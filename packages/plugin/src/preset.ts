import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite'
import stencil from 'unplugin-stencil/vite'

import { StorybookConfig } from './types.js'

const require = createRequire(import.meta.url);
const getAbsolutePath = <I extends string>(input: I): I =>
  dirname(require.resolve(join(input, 'package.json'))) as any;

const __dirname = dirname(fileURLToPath(import.meta.url));

const renderer = join(__dirname, 'preview.js')

export const core: StorybookConfig['core'] = {
  builder: getAbsolutePath('@storybook/builder-vite'),
  renderer,
};

export const viteFinal: StorybookConfig["viteFinal"] = async (
  defaultConfig,
) => {
  const config = mergeConfig(defaultConfig, {
    build: {
      target: "es2020",
      rollupOptions: {
        external: ['@stencil/core'],
      },
    },
    plugins: [stencil({
      rootPath: defaultConfig.root,
    })],
  });

  return config;
};

export const previewAnnotations: StorybookConfig["previewAnnotations"] = async (
  input = [],
  options
) => {
  const docsEnabled = Object.keys(await options.presets.apply('docs', {}, options)).length > 0;
  const result: string[] = [];

  return result
    .concat(input)
    .concat([renderer])
    .concat(docsEnabled ? [resolve(getAbsolutePath('@storybook/html'), 'dist', 'entry-preview-docs.mjs')] : []);
};
