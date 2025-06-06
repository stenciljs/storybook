import type { Preview } from '@stencil/storybook-plugin';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      codePanel: true,
    },
  },
};

export default preview;
