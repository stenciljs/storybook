import { setCustomElementsManifest, type Preview } from '@stencil/storybook-plugin';
import customElements from '../dist/custom-elements.json';
import { defineCustomElements } from '../loader';

setCustomElementsManifest(customElements);
defineCustomElements(window, {
  resourcesUrl: '/assets/',
});

export const parameters: Preview['parameters'] = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  docs: {
    source: {
      excludeDecorators: true,
      language: 'jsx',
    },
  },
};

export const tags: Preview['tags'] = ['autodocs'];
