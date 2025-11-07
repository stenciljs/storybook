import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/preset.ts',
    './src/entry-preview.ts',
    './src/entry-preview-docs.ts',
    './src/entry-preview-argtypes.ts',
    './src/docs/index.ts',
    './src/node/index.ts',
  ],
  // Externalize native modules and problematic dependencies
  external: [
    'fsevents', // macOS file watching native module
    'esbuild', // Contains native binaries
    'vite', // May contain native dependencies
  ],
  outDir: './dist',
  format: ['esm', 'cjs'],
  target: 'es2020',
  platform: 'node',
  sourcemap: true,
  clean: true,
  dts: {
    sourcemap: true,
  },
  tsconfig: './tsconfig.json',
});
