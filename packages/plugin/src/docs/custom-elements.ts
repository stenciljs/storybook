import type {
  ClassMethod,
  CustomElement,
  CustomElementDeclaration,
  CustomElementField,
  Package,
} from 'custom-elements-manifest';
import { logger } from 'storybook/internal/client-logger';
import type { ArgTypes } from 'storybook/internal/types';

import { getCustomElements, isValidComponent, isValidMetaData } from '..';
import { inferControlType, inferSBType, parseLiteralValues } from './infer-type';

// Stencil CEM extension — mirrors the Tag interface in @stencil/core's CEM generator.
interface Tag {
  name: string;
  text?: string;
}

// Stencil marks optional props as `string | undefined`; strip the redundant
// `undefined` arm so it doesn't appear as a noisy type chip in the docs table.
const cleanTypeText = (text: string | undefined) =>
  text
    ?.replace(/undefined\s*\|\s*/g, '')
    .replace(/\s*\|\s*undefined/g, '')
    .trim() || undefined;

const withTags = (
  description: string | undefined,
  tags: Tag[] | undefined,
  deprecated?: boolean | string,
): string | undefined => {
  const sections: string[] = [];
  if (deprecated !== undefined && deprecated !== false) {
    sections.push(typeof deprecated === 'string' ? `**⚠️ Deprecated:** ${deprecated}` : '**⚠️ Deprecated**');
  }
  if (description) sections.push(description);
  if (tags?.length) {
    sections.push(
      tags
        .map(({ name, text }) => `**${name.charAt(0).toUpperCase() + name.slice(1)}:** ${text ?? ''}`.trimEnd())
        .join('\n\n'),
    );
  }
  return sections.length > 0 ? sections.join('\n\n') : undefined;
};

const findDeclaration = (tagName: string, cem: Package): CustomElementDeclaration | undefined => {
  for (const mod of cem.modules) {
    const found = (mod.declarations ?? []).find(
      (d): d is CustomElementDeclaration => 'customElement' in d && (d as CustomElementDeclaration).tagName === tagName,
    );
    if (found) return found;
  }
  return undefined;
};

/**
 * A CSS-only component (a `@component`-marked rule in a `.css` file) has no JS class, so it's
 * never registered with `customElements`. The CEM has no flag for it, but its module is the `.css`
 * file that defines it.
 * @param tagName the custom element's tag name
 * @returns whether the CEM declares `tagName` as a CSS-only component
 */
export const isCssOnlyComponent = (tagName: string): boolean => {
  const cem = getCustomElements() as Package;
  if (!isValidMetaData(cem)) return false;
  return cem.modules.some(
    (mod) =>
      mod.path.endsWith('.css') &&
      (mod.declarations ?? []).some((d) => (d as CustomElementDeclaration).tagName === tagName),
  );
};

const toEventActionName = (eventName: string): string => {
  const camel = eventName.replace(/(-|_|:|\.|\s)+(.)?/g, (_, _sep, chr: string) => (chr ? chr.toUpperCase() : ''));
  const lowerFirst = camel.replace(/^([A-Z])/, (m) => m.toLowerCase());
  return `on${lowerFirst.charAt(0).toUpperCase() + lowerFirst.slice(1)}`;
};

/**
 * Arg-key prefixes for slot/part argTypes - like Stencil's own `attr:`/`prop:` JSX prefixes, so they
 * can't collide with a prop of the same name (or, for the default slot, be an empty key).
 */
export const SLOT_ARG_PREFIX = 'slot:';
export const PART_ARG_PREFIX = 'part:';

/**
 * @param name a slot's name - `''` for the default slot
 * @returns its arg key, e.g. `slot:default`, `slot:label`
 */
export const slotArgKey = (name: string): string => `${SLOT_ARG_PREFIX}${name || 'default'}`;

const mapSlots = (slots: CustomElement['slots']): ArgTypes =>
  (slots ?? []).reduce<ArgTypes>((acc, slot) => {
    acc[slotArgKey(slot.name)] = {
      name: slot.name || 'default',
      description: slot.description,
      control: { type: 'text' },
      table: { category: 'slots', type: { summary: 'string | VNode' } },
    };
    return acc;
  }, {});

const mapParts = (parts: CustomElement['cssParts']): ArgTypes =>
  (parts ?? []).reduce<ArgTypes>((acc, part) => {
    acc[`${PART_ARG_PREFIX}${part.name}`] = {
      name: part.name,
      description: part.description,
      control: false,
      table: { category: 'parts' },
    };
    return acc;
  }, {});

// valid `color` values a colour picker can't represent or round-trip
const NON_PICKABLE_COLOR_RE = /var\(|^(inherit|initial|unset|revert|revert-layer|currentcolor)$/i;

/**
 * @param value a CSS custom property's documented default
 * @returns whether it's a concrete colour - so a colour picker suits the property
 */
const isColorValue = (value: string | undefined): boolean =>
  !!value &&
  !NON_PICKABLE_COLOR_RE.test(value.trim()) &&
  typeof globalThis.CSS?.supports === 'function' &&
  CSS.supports('color', value);

// CSS custom property names always start with `--`, so they can't collide with any other arg
const mapCssProperties = (props: CustomElement['cssProperties']): ArgTypes =>
  (props ?? []).reduce<ArgTypes>((acc, prop) => {
    acc[prop.name] = {
      name: prop.name,
      description: prop.description,
      control: { type: prop.syntax === '<color>' || isColorValue(prop.default) ? 'color' : 'text' },
      table: {
        category: 'styles',
        type: { summary: prop.syntax },
        defaultValue: { summary: prop.default },
      },
    };
    return acc;
  }, {});

const mapFields = (members: CustomElement['members']): ArgTypes =>
  (members ?? [])
    .filter((m): m is CustomElementField => m.kind === 'field')
    .reduce<ArgTypes>((acc, field) => {
      acc[field.name] = {
        name: field.attribute ?? field.name,
        description: withTags(
          field.description,
          (field as CustomElementField & { tags?: Tag[] }).tags,
          field.deprecated,
        ),
        control: inferControlType(field),
        table: {
          category: 'properties',
          type: { summary: cleanTypeText(field.type?.text) },
          defaultValue: { summary: field.default },
        },
        options: parseLiteralValues(field.type?.text ?? ''),
        type: inferSBType(field),
      };
      return acc;
    }, {});

const mapMethods = (members: CustomElement['members']): ArgTypes =>
  (members ?? [])
    .filter((m): m is ClassMethod => m.kind === 'method')
    .reduce<ArgTypes>((acc, method) => {
      acc[method.name] = {
        name: method.name,
        description: withTags(method.description, (method as ClassMethod & { tags?: Tag[] }).tags, method.deprecated),
        control: false,
        type: { name: 'function' },
        table: {
          category: 'methods',
          type: { summary: method.return?.type?.text ?? 'void' },
        },
      };
      return acc;
    }, {});

const mapEvents = (events: CustomElement['events']): ArgTypes =>
  (events ?? []).reduce<ArgTypes>((acc, event) => {
    const name = toEventActionName(event.name);
    acc[name] = {
      name,
      description: withTags(event.description, (event as typeof event & { tags?: Tag[] }).tags, event.deprecated),
      control: false,
      table: { category: 'events', type: { summary: cleanTypeText(event.type?.text) } },
      type: { name: 'function' },
    };
    return acc;
  }, {});

export const extractArgTypesFromElements = (tagName: string, cem: Package): ArgTypes | null => {
  if (!isValidComponent(tagName) || !isValidMetaData(cem)) return null;
  const decl = findDeclaration(tagName, cem);
  if (!decl) {
    logger.warn(`Component not found in Custom Elements Manifest: ${tagName}`);
    return null;
  }
  return {
    ...mapFields(decl.members),
    ...mapEvents(decl.events),
    ...mapMethods(decl.members),
    ...mapSlots(decl.slots),
    ...mapParts(decl.cssParts),
    ...mapCssProperties(decl.cssProperties),
  };
};

export const extractArgTypes = (component: any): ArgTypes | null => {
  const cem = getCustomElements() as Package;
  const tagName = typeof component === 'string' ? component : component?.is;
  return extractArgTypesFromElements(tagName, cem);
};

export const extractComponentDescription = (component: any): string | undefined => {
  const cem = getCustomElements() as Package;
  const tagName = typeof component === 'string' ? component : component?.is;
  if (!isValidComponent(tagName) || !isValidMetaData(cem)) return undefined;
  const decl = findDeclaration(tagName, cem);
  return withTags(decl?.description, (decl as typeof decl & { tags?: Tag[] })?.tags, decl?.deprecated);
};
