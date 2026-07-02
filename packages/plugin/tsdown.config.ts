import { defineConfig } from 'tsdown';

// In watch mode tsdown cleans dist before the first build, which races with
// Storybook startup. Skip cleaning when watching so the previous build stays
// in place until the new one is ready.
const watching = process.argv.includes('--watch') || process.argv.includes('-w');

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/preset.ts',
    './src/entry-preview.ts',
    './src/entry-preview-auto-docs.ts',
    './src/entry-preview-docs.ts',
    './src/entry-preview-argtypes.ts',
    './src/docs/index.ts',
    './src/node/index.ts',
  ],
  deps: {
    neverBundle: [
      'fsevents',
      'esbuild',
      'vite',
      'virtual:stencil-docs', // resolved at runtime by Vite, not at build time
      /^@stencil\/core(\/.*)?$/,
      /^@stencil\/unplugin(\/.*)?$/,
    ],
  },
  outDir: './dist',
  format: ['esm'],
  target: 'es2020',
  platform: 'node',
  sourcemap: true,
  clean: !watching,
  dts: {
    sourcemap: true,
  },
  tsconfig: './tsconfig.json',
});
