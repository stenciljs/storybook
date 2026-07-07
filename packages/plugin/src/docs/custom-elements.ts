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

const toEventActionName = (eventName: string): string => {
  const camel = eventName.replace(/(-|_|:|\.|\s)+(.)?/g, (_, _sep, chr: string) => (chr ? chr.toUpperCase() : ''));
  const lowerFirst = camel.replace(/^([A-Z])/, (m) => m.toLowerCase());
  return `on${lowerFirst.charAt(0).toUpperCase() + lowerFirst.slice(1)}`;
};

const mapNamedItems = (items: Array<{ name: string; description?: string }>, category: string): ArgTypes =>
  items.reduce<ArgTypes>((acc, item) => {
    acc[item.name] = { name: item.name, description: item.description, control: false, table: { category } };
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
    ...mapNamedItems(decl.slots ?? [], 'slots'),
    ...mapNamedItems(decl.cssParts ?? [], 'parts'),
    ...mapNamedItems(decl.cssProperties ?? [], 'styles'),
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
