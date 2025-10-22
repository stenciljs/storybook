import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'example',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: true,
    },
    {
      type: 'docs-vscode',
      file: 'custom-elements.json',
    }
  ],
  testing: {
    browserHeadless: 'shell',
  },
};
