import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unpluginStencil } from '@stencil/unplugin';
import { mergeConfig } from 'vite';

import { StorybookConfig } from './types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const renderer = join(__dirname, 'entry-preview.mjs');

export const core: StorybookConfig['core'] = {
  builder: '@storybook/builder-vite',
  renderer,
};

export const viteFinal: StorybookConfig['viteFinal'] = async (defaultConfig, { configType }) => {
  const config = mergeConfig(defaultConfig, {
    build: { target: 'es2022' },
    plugins: [unpluginStencil.vite({ docs: true })],
    // Vite's dev-mode JSX transform injects React DevTools' `__self`/`__source` metadata into every
    // JSX element regardless of jsxFactory. Stencil's `h()` doesn't strip these, so they leak into the
    // DOM as a literal `__source="[object Object]"` attribute on story-authored slot content.
    esbuild: { jsxDev: false },
    oxc: { jsx: { development: false } },
  });

  if (configType === 'DEVELOPMENT') {
    return mergeConfig(config, {
      server: {
        watch: {
          // Prevent Vite from watching this plugin's own dist/ during plugin development.
          ignored: [join(__dirname, '**')],
        },
      },
    });
  }

  return config;
};

export const previewAnnotations: StorybookConfig['previewAnnotations'] = async (input = [], options) => {
  const docsEnabled = Object.keys(await options.presets.apply('docs', {}, options)).length > 0;
  return [
    ...input,
    renderer,
    join(__dirname, 'entry-preview-auto-docs.mjs'),
    join(__dirname, 'entry-preview-argtypes.mjs'),
    ...(docsEnabled ? [join(__dirname, 'entry-preview-docs.mjs')] : []),
  ];
};
