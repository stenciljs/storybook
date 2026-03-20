/**
 * we can't prefix the Node.js imports with `node:` because it will break
 * within Storybook due to its Vite setup.
 */
import { dirname, join } from 'path';
import stencil from 'unplugin-stencil/vite';
import { fileURLToPath } from 'url';
import { mergeConfig } from 'vite';
import { StorybookConfig } from './types';

const __dirname = dirname(fileURLToPath(import.meta.url));

const renderer = join(__dirname, 'entry-preview.js');

export const core: StorybookConfig['core'] = {
  builder: '@storybook/builder-vite',
  renderer,
};

export const viteFinal: StorybookConfig['viteFinal'] = async (defaultConfig, { configType }) => {
  const config = mergeConfig(defaultConfig, {
    build: {
      target: 'es2020',
    },
    plugins: [
      stencil({
        rootPath: defaultConfig.root,
      }),
    ],
  });
  if (configType === 'DEVELOPMENT') {
    return mergeConfig(config, {
      build: {
        rollupOptions: {
          external: ['@stencil/core'],
        },
      },
    });
  }

  return config;
};

export const previewAnnotations: StorybookConfig['previewAnnotations'] = async (input = [], options) => {
  const docsEnabled = Object.keys(await options.presets.apply('docs', {}, options)).length > 0;
  const result: string[] = [];

  return result
    .concat(input)
    .concat([renderer, join(__dirname, 'entry-preview-argtypes.js')])
    .concat(docsEnabled ? [join(__dirname, 'entry-preview-docs.js')] : []);
};
