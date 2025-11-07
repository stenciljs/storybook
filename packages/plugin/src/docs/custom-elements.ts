import type {
  JsonDocs,
  JsonDocsEvent,
  JsonDocsMethod,
  JsonDocsPart,
  JsonDocsProp,
  JsonDocsSlot,
  JsonDocsStyle,
} from '@stencil/core/internal';
import { logger } from 'storybook/internal/client-logger';
import type { ArgTypes } from 'storybook/internal/types';

import { getCustomElements, isValidComponent, isValidMetaData } from '..';
import { inferControlType, inferSBType, mapPropOptions } from './infer-type';

const mapData = <T extends JsonDocsPart>(data: T[], category: string): ArgTypes =>
  data.reduce<ArgTypes>((acc, item) => {
    acc[item.name] = {
      name: item.name,
      description: item.docs,
      control: false,
      table: {
        category,
      },
    };
    return acc;
  }, {});

const mapMethods = (methods: JsonDocsMethod[]): ArgTypes =>
  methods.reduce<ArgTypes>((acc, method) => {
    acc[method.name] = {
      name: method.name,
      description: method.docs,
      control: null,
      type: { name: 'function' },
      table: {
        category: 'methods',
        type: { summary: method.signature },
      },
    };
    return acc;
  }, {});

const mapEvent = (events: JsonDocsEvent[]): ArgTypes =>
  events.reduce<ArgTypes>((acc, event) => {
    let name = event.event
      .replace(/(-|_|:|\.|\s)+(.)?/g, (_match, _separator, chr: string) => {
        return chr ? chr.toUpperCase() : '';
      })
      .replace(/^([A-Z])/, (match) => match.toLowerCase());

    name = `on${name.charAt(0).toUpperCase() + name.slice(1)}`;

    acc[name] = {
      name,
      description: event.docs,
      control: null,
      table: {
        category: 'events',
        type: { summary: event.detail },
      },
      type: { name: 'function' },
    };

    return acc;
  }, {});

const mapProps = (props: JsonDocsProp[]): ArgTypes =>
  props.reduce<ArgTypes>((acc, prop) => {
    acc[prop.name] = {
      name: prop.attr || prop.name,
      description: prop.docs,
      control: inferControlType(prop),
      table: {
        category: 'properties',
        type: { summary: prop.complexType?.original },
        defaultValue: { summary: prop.default },
      },
      options: mapPropOptions(prop),
      type: inferSBType(prop),
    };

    return acc;
  }, {});

const getMetaData = (tagName: string, manifest: JsonDocs) => {
  if (!isValidComponent(tagName) || !isValidMetaData(manifest)) {
    return null;
  }
  const metaData = manifest.components.find((component) => component.tag.toUpperCase() === tagName.toUpperCase());
  if (!metaData) {
    logger.warn(`Component not found in custom-elements.json: ${tagName}`);
  }
  return metaData;
};

export const extractArgTypesFromElements = (tagName: string, customElements: JsonDocs) => {
  const metaData = getMetaData(tagName, customElements);
  return (
    metaData && {
      ...mapProps(metaData.props),
      ...mapEvent(metaData.events),
      ...mapMethods(metaData.methods),
      ...mapData<JsonDocsSlot>(metaData.slots, 'slots'),
      ...mapData<JsonDocsPart>(metaData.parts, 'parts'),
      ...mapData<JsonDocsStyle>(metaData.styles, 'styles'),
    }
  );
};

export const extractArgTypes = (component: any) => {
  const cem = getCustomElements();
  // Handle both string references (lazy loading) and class references (auto-define)
  const tagName = typeof component === 'string' ? component : component?.is;
  return extractArgTypesFromElements(tagName, cem);
};

export const extractComponentDescription = (component: any) => {
  // Handle both string references (lazy loading) and class references (auto-define)
  const tagName = typeof component === 'string' ? component : component?.is;
  const metaData = getMetaData(tagName, getCustomElements());
  return metaData && metaData.docs;
};
