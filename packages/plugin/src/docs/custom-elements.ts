import { logger } from 'storybook/internal/client-logger';
import type { ArgTypes, InputType } from 'storybook/internal/types';

import invariant from 'tiny-invariant';

import { global } from '@storybook/global';

export function isValidComponent(tagName: string) {
  if (!tagName) {
    return false;
  }
  if (typeof tagName === 'string') {
    return true;
  }
  throw new Error('Provided component needs to be a string. e.g. component: "my-element"');
}

export function isValidMetaData(customElements: any) {
  if (!customElements) {
    return false;
  }

  if (
    (customElements.tags && Array.isArray(customElements.tags)) ||
    (customElements.modules && Array.isArray(customElements.modules))
  ) {
    return true;
  }
  throw new Error(`You need to setup valid meta data in your config.js via setCustomElements().
    See the readme of addon-docs for web components for more details.`);
}

/** @param customElements `any` for now as spec is not super stable yet */
export function setCustomElements(customElements: any) {
  global.__STORYBOOK_CUSTOM_ELEMENTS__ = customElements;
}

export function setCustomElementsManifest(customElements: any) {
  global.__STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__ = customElements;
}

export function getCustomElements() {
  return global.__STORYBOOK_CUSTOM_ELEMENTS__ || global.__STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__;
}


interface TagItem {
  name: string;
  type: { [key: string]: any };
  description: string;
  default?: any;
  kind?: string;
  defaultValue?: any;
  privacy?: string;
  return?: { type: { [key: string]: any } };
}

interface Tag {
  name: string;
  description: string;
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

interface Module {
  declarations?: [];
  exports?: [];
}

interface Declaration {
  tagName: string;
}

function mapItem(item: TagItem, category: string): InputType {
  let type;

  switch (category) {
    case 'attributes':
    case 'properties':
      if (item.type?.text?.match(/^\(.*\)\s*=>\s*.+$/)) {
        type = { name: 'function' };
      } else {
        type = { name: item.type?.text || item.type };
      }
      break;
    case 'events':
    case 'slots':
    case 'css custom properties':
    case 'css shadow parts':
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

function mapMethod(item: TagItem): InputType {
  const type = item.return?.type?.text || item.return?.type || 'void';

  return {
    name: item.name,
    required: false,
    description: item.description,
    type,
    control: false,
    table: {
      category: 'methods',
      type: { summary: type },
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
      .filter((item) => item.privacy !== 'private')
      .filter((item) => item.name !== 'render')
      .reduce((acc, item) => {
        if (item.kind === 'method') {
          acc[item.name] = mapMethod(item);
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

const getMetaDataExperimental = (tagName: string, customElements: CustomElements) => {
  if (!isValidComponent(tagName) || !isValidMetaData(customElements)) {
    return null;
  }
  const metaData = customElements.tags.find(
    (tag) => tag.name.toUpperCase() === tagName.toUpperCase()
  );
  if (!metaData) {
    logger.warn(`Component not found in custom-elements.json: ${tagName}`);
  }
  return metaData;
};

const getMetaDataV1 = (tagName: string, customElements: CustomElements) => {
  if (!isValidComponent(tagName) || !isValidMetaData(customElements)) {
    return null;
  }

  let metadata: any;
  customElements?.modules?.forEach((_module: Module) => {
    _module?.declarations?.forEach((declaration: Declaration) => {
      if (!metadata && declaration.tagName === tagName) {
        metadata = declaration;
      }
    });
  });

  if (!metadata) {
    logger.warn(`Component not found in custom-elements.json: ${tagName}`);
    return;
  }

  return metadata;
};

const getMetaData = (tagName: string, manifest: any) => {
  if (manifest?.version === 'experimental') {
    return getMetaDataExperimental(tagName, manifest);
  }
  return getMetaDataV1(tagName, manifest);
};

export const extractArgTypesFromElements = (tagName: string, customElements: CustomElements) => {
  const metaData = getMetaData(tagName, customElements);
  const argTypes = metaData && {
    ...mapData(metaData.members ?? [], 'properties'),
    ...mapData(metaData.properties ?? [], 'properties'),
    ...mapData(metaData.events ?? [], 'events'),
    ...mapData(metaData.slots ?? [], 'slots'),
    ...mapData(metaData.cssProperties ?? [], 'css custom properties'),
    ...mapData(metaData.cssParts ?? [], 'css shadow parts'),
  };

  return argTypes;
};

export const extractArgTypes = (tagName: string) => {
  const cem = getCustomElements();
  return extractArgTypesFromElements(tagName, cem);
};

export const extractComponentDescription = (tagName: string) => {
  const metaData = getMetaData(tagName, getCustomElements());
  return metaData && metaData.description;
};
