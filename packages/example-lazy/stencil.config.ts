import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'example-lazy',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'single-export-module',
      externalRuntime: true,
    },
  ],
  testing: {
    browserHeadless: 'shell',
  },
};
