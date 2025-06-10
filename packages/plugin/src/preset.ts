/**
 * we can't prefix the Node.js imports with `node:` because it will break
 * within Storybook due to its Vite setup.
 */
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import stencil from 'unplugin-stencil/vite';
import { mergeConfig } from 'vite';

import { StorybookConfig } from './types.js';

const require = createRequire(import.meta.url);
const getAbsolutePath = <I extends string>(input: I): I => dirname(require.resolve(join(input, 'package.json'))) as any;

const __dirname = dirname(fileURLToPath(import.meta.url));

const renderer = join(__dirname, 'entry-preview.js');

export const core: StorybookConfig['core'] = {
  builder: getAbsolutePath('@storybook/builder-vite'),
  renderer,
};

export const viteFinal: StorybookConfig['viteFinal'] = async (defaultConfig) => {
  const config = mergeConfig(defaultConfig, {
    build: {
      target: 'es2020',
      rollupOptions: {
        external: ['@stencil/core'],
      },
    },
    plugins: [
      stencil({
        rootPath: defaultConfig.root,
      }),
    ],
  });

  return config;
};

export const previewAnnotations: StorybookConfig['previewAnnotations'] = async (input = [], options) => {
  const docsEnabled = Object.keys(await options.presets.apply('docs', {}, options)).length > 0;
  const result: string[] = [];

  return result
    .concat(input)
    .concat([renderer])
    .concat(docsEnabled ? [join(__dirname, 'entry-preview-docs.js')] : []);
};
