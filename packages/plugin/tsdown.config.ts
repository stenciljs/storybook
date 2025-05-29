import url from 'node:url';
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/preset.ts',
    './src/preview.ts',
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
  dts: true,
  tsconfig: './tsconfig.json',
  define: {
    'process.env.STORYBOOK_HTML_PREVIEW_DOCS': `"${url.fileURLToPath(import.meta.resolve('@storybook/html/dist/entry-preview-docs.mjs'))}"`,
  },
})
