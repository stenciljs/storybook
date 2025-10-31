import { setCustomElementsManifest, type Preview } from '@stencil/storybook-plugin';
import customElements from '../custom-elements.json';
import { defineCustomElements } from '../loader';

setCustomElementsManifest(customElements);
defineCustomElements();

export const parameters: Preview['parameters'] = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  docs: {
    source: {
      excludeDecorators: true,
    },
  },
};

export const tags: Preview['tags'] = ['autodocs'];
