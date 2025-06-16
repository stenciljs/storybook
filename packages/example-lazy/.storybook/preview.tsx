import { type Preview } from '@stencil/storybook-plugin';
import { defineCustomElements } from '../loader';

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
