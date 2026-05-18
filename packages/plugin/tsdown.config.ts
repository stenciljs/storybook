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
    /**
     * Inline types from storybook and @storybook/* packages so consumer
     * workspaces resolve them locally from our bundled .d.ts. @stencil/core
     * stays external — the consumer always has it installed, and bundling
     * it would duplicate the `declare global { namespace jest { ... } }`
     * augmentation, breaking @vitest/expect's JestAssertion inheritance.
     */
    resolve: [/^storybook(\/|$)/, /^@storybook\//],
  },
  tsconfig: './tsconfig.json',
});
