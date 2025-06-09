import type { Preview } from '@stencil/storybook-plugin';
import { setCustomElementsManifest } from '@stencil/storybook-plugin';
import customElementsManifest from '../custom-elements.json';

setCustomElementsManifest(customElementsManifest)

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      codePanel: true,
      excludeDecorators: true,
    },
  },
};

export default preview;
