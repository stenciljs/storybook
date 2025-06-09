import { Config } from '@stencil/core';
import { JsonDocs } from '@stencil/core/internal';
import { execSync } from 'child_process';

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
      externalRuntime: false,
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'docs-custom',
      generator: (_docs: JsonDocs, _config: Config) => {
        execSync('pnpm run cem', { stdio: 'inherit' });
        return;
      }
    },
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
  testing: {
    browserHeadless: "shell",
  },
};
