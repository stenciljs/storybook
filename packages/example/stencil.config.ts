import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'example',
  outputTargets: [
    {
      type: 'loader-bundle',
      loaderPath: '../../loader',
    },
    {
      type: 'standalone',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: true,
    },
    {
      type: 'docs-json',
      file: 'dist/custom-elements.json',
    },
  ],
  testing: {
    browserHeadless: 'shell',
  },
};
