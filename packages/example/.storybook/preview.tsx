import type { Preview } from '@stencil/storybook-plugin';

export const parameters: Preview['parameters'] = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  // the "save story" bar appears once a control is edited and covers the controls below it,
  // intercepting the e2e tests' clicks
  controls: { disableSaveFromUI: true },
  docs: {
    source: {
      excludeDecorators: true,
    },
  },
};

export const tags: Preview['tags'] = ['autodocs'];
