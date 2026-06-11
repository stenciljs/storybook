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
    // Stencil packages ship their own ESM/CJS builds with native-ish Node
    // interop (e.g. `@stencil/core/sys/node`'s default export). Bundling them
    // mangles that interop and makes `nodeApi` undefined at runtime, so always
    // resolve them from node_modules instead of inlining. Match subpath
    // imports too (e.g. `@stencil-community/unplugin-stencil/vite`).
    /^@stencil\/core(\/.*)?$/,
    /^@stencil-community\/unplugin-stencil(\/.*)?$/,
  ],
  outDir: './dist',
  format: ['esm', 'cjs'],
  target: 'es2020',
  platform: 'node',
  sourcemap: true,
  clean: !watching,
  dts: {
    sourcemap: true,
  },
  tsconfig: './tsconfig.json',
});
