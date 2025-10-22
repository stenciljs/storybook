import { logger } from 'storybook/internal/client-logger';
import type { ArgTypes } from 'storybook/internal/types';
import type { JsonDocs, JsonDocsProp, JsonDocsEvent, JsonDocsSlot } from '@stencil/core/internal';

import { inferSBType } from './infer-sb-type';
import { getCustomElements, isValidComponent, isValidMetaData } from '..';

const mapSlots = (slots: JsonDocsSlot[]): ArgTypes =>
  slots.reduce<ArgTypes>((acc, slot) => {
    acc[slot.name] = {
      name: slot.name,
      description: slot.docs,
      table: {
        category: 'slots',
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
      table: {
        category: 'events',
      },
    };

    return acc;
  }, {});

const mapProps = (props: JsonDocsProp[]): ArgTypes =>
  props.reduce<ArgTypes>((acc, prop) => {
    const type = inferSBType(prop.type);

    acc[prop.name] = {
      name: prop.name,
      description: prop.docs,
      table: {
        category: 'properties',
        type: { summary: prop.complexType?.original },
        defaultValue: { summary: prop.default },
      },
      type,
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
      ...mapSlots(metaData.slots),
    }
  );
};

export const extractArgTypes = (component: any) => {
  const cem = getCustomElements();
  return extractArgTypesFromElements(component.is, cem);
};

export const extractComponentDescription = (component: any) => {
  const metaData = getMetaData(component.is, getCustomElements());
  return metaData && metaData.docs;
};
