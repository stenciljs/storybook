import { logger } from 'storybook/internal/client-logger';
import type { ArgTypes, InputType } from 'storybook/internal/types';

import invariant from 'tiny-invariant';

import { getCustomElements, isValidComponent, isValidMetaData } from '..';

interface TagItem {
  name: string;
  type: { [key: string]: any };
  description: string;
  default?: any;
  kind?: string;
  defaultValue?: any;
}

interface Tag {
  name: string;
  description: {
    kind: 'markdown';
    value: string;
  };
  attributes?: TagItem[];
  properties?: TagItem[];
  events?: TagItem[];
  methods?: TagItem[];
  members?: TagItem[];
  slots?: TagItem[];
  cssProperties?: TagItem[];
  cssParts?: TagItem[];
}

interface CustomElements {
  tags: Tag[];
  modules?: [];
}

function mapItem(item: TagItem, category: string): InputType {
  let type;
  switch (category) {
    case 'attributes':
    case 'properties':
      type = { name: item.type?.text || item.type };
      break;
    case 'slots':
      type = { name: 'string' };
      break;
    default:
      type = { name: 'void' };
      break;
  }

  return {
    name: item.name,
    required: false,
    description: item.description,
    type,
    table: {
      category,
      type: { summary: item.type?.text || item.type },
      defaultValue: {
        summary: item.default !== undefined ? item.default : item.defaultValue,
      },
    },
  };
}

function mapEvent(item: TagItem): InputType[] {
  let name = item.name
    .replace(/(-|_|:|\.|\s)+(.)?/g, (_match, _separator, chr: string) => {
      return chr ? chr.toUpperCase() : '';
    })
    .replace(/^([A-Z])/, (match) => match.toLowerCase());

  name = `on${name.charAt(0).toUpperCase() + name.substr(1)}`;

  return [{ name, action: { name: item.name }, table: { disable: true } }, mapItem(item, 'events')];
}

function mapData(data: TagItem[], category: string) {
  return (
    data &&
    data
      .filter((item) => item && item.name)
      .reduce((acc, item) => {
        if (item.kind === 'method') {
          return acc;
        }

        switch (category) {
          case 'events':
            mapEvent(item).forEach((argType) => {
              invariant(argType.name, `${argType} should have a name property.`);
              acc[argType.name] = argType;
            });
            break;
          default:
            acc[item.name] = mapItem(item, category);
            break;
        }

        return acc;
      }, {} as ArgTypes)
  );
}

const getMetaData = (tagName: string, manifest: CustomElements) => {
  if (!isValidComponent(tagName) || !isValidMetaData(manifest)) {
    return null;
  }
  const metaData = manifest.tags.find(
    (tag) => tag.name.toUpperCase() === tagName.toUpperCase()
  );
  if (!metaData) {
    logger.warn(`Component not found in custom-elements.json: ${tagName}`);
  }
  return metaData;
};

export const extractArgTypesFromElements = (tagName: string, customElements: CustomElements) => {
  const metaData = getMetaData(tagName, customElements);
  return (
    metaData && {
      ...mapData(metaData.members ?? [], 'properties'),
      ...mapData(metaData.properties ?? [], 'properties'),
      ...mapData(metaData.attributes ?? [], 'attributes'),
      ...mapData(metaData.events ?? [], 'events'),
      ...mapData(metaData.slots ?? [], 'slots'),
      ...mapData(metaData.cssProperties ?? [], 'css custom properties'),
      ...mapData(metaData.cssParts ?? [], 'css shadow parts'),
    }
  );
};

export const extractArgTypes = (component: any) => {
  const cem = getCustomElements();
  return extractArgTypesFromElements(component.is, cem);
};

export const extractComponentDescription = (component: any) => {
  const metaData = getMetaData(component.is, getCustomElements());
  return metaData && metaData.description.value;
};