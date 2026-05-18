# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for the Storybook plugin for StencilJS (`@stencil/storybook-plugin`). The plugin enables developers to build, document, and test StencilJS web components in isolation using Storybook.

**Note**: This project is in early development and maintained by the StencilJS core team.

## Build & Development Commands

This project uses `pnpm` (v10.10.0) and Node.js (v22.2.0).

### Building
```bash
pnpm build                  # Build all packages
pnpm build.plugin           # Build only the plugin package
pnpm build.example          # Build only the example package
pnpm build.example-lazy     # Build only the lazy-loaded example package
```

### Development
```bash
pnpm dev                    # Start all dev servers (plugin watch + example storybook)
pnpm dev.plugin             # Watch mode for plugin development (rebuilds on changes)
pnpm dev.example            # Run Storybook for the standard example project
pnpm dev.example-lazy       # Run Storybook for the lazy-loaded example project
```

When developing the plugin, run `pnpm dev.plugin` in one terminal and `pnpm dev.example` in another to see changes reflected in Storybook at `http://localhost:6006`.

### Testing
```bash
pnpm test-all               # Run all tests sequentially
pnpm test                   # Run e2e tests for standard example (WebdriverIO + Chrome)
pnpm test.example-lazy      # Run e2e tests for lazy-loaded example
```

Tests use WebdriverIO with Mocha. E2E tests are located in `tests/` directory and spin up a Storybook instance automatically.

### Code Formatting
```bash
pnpm prettier               # Format all code (uses @ionic/prettier-config)
pnpm prettier.dry-run       # Check formatting without making changes
```

### Production Storybook Build
```bash
pnpm build-storybook        # Build static Storybook for both examples
```

## Architecture

### Monorepo Structure

```
packages/
├── plugin/           # @stencil/storybook-plugin - Core package published to npm
├── example/          # Example StencilJS project with auto-define-custom-elements
└── example-lazy/     # Example StencilJS project with lazy-loaded components
```

### Plugin Package (`packages/plugin/`)

The plugin package is structured to integrate Stencil components into Storybook's architecture:

**Key Entry Points** (defined in `tsdown.config.ts`):
- `src/index.ts` - Main exports: types, framework API (`setCustomElementsManifest`)
- `src/preset.ts` - Storybook preset configuration (builder, Vite config, preview annotations)
- `src/entry-preview.ts` - Core rendering logic for Stencil components
- `src/entry-preview-argtypes.ts` - ArgTypes extraction from component metadata
- `src/entry-preview-docs.ts` - Documentation generation
- `src/node/index.ts` - Node-specific utilities

**Core Rendering** (`src/render.ts`):
- `render()` - Converts Storybook args/parameters into Stencil JSX (VNodes)
- `renderToCanvas()` - Renders VNodes to DOM using `@stencil/core`'s `render()` function
- Handles both lazy-loaded components (string component names) and auto-defined components (constructor references)
- Supports slots via `parameters.slots` object (keys are slot names, `default` for unnamed slots)

**Vite Integration** (`src/preset.ts`):
- Uses `unplugin-stencil/vite` to transpile Stencil components within Storybook's Vite builder
- Configures `@storybook/builder-vite` as the builder
- Externalizes `@stencil/core` in development mode to avoid bundling issues

**Autodocs System** (`src/docs/`):
- `custom-elements.ts` - Extracts argTypes, props, events, slots, and CSS custom properties from Stencil's `custom-elements.json` manifest
- `infer-type.ts` - Infers control types (boolean, number, text, etc.) from component prop types
- `source-decorator.ts` - Generates source code display in multiple formats (HTML, JSX, TSX)
- `render-vnode.ts` - Converts Stencil VNodes to HTML/JSX strings for documentation

**Framework API** (`src/framework-api.ts`):
- `setCustomElementsManifest(customElements)` - Stores the `custom-elements.json` output from Stencil for autodocs
- Global storage: `__STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__`

**Build System**:
- Uses `tsdown` for bundling (not tsc)
- Outputs ESM and CJS formats to `dist/`
- Externalizes native modules: `fsevents`, `esbuild`, `vite`
- Target: ES2020, Node.js platform

### Example Packages

Both example packages demonstrate different Stencil output target configurations:

**Standard Example** (`packages/example/`):
- Uses `customElementsExportBehavior: 'auto-define-custom-elements'`
- Components auto-register on import
- Story component value: `component: MyComponent` (constructor)
- No need to call `defineCustomElements()` in preview

**Lazy Example** (`packages/example-lazy/`):
- Uses lazy-loaded components (default Stencil behavior with `dist` output target)
- Requires `defineCustomElements()` call in `.storybook/preview.ts`
- Story component value: `component: 'my-component'` (string tag name)
- Components registered at runtime

### Story Writing

Stories use Stencil's JSX syntax via `h` from `@stencil/core`:

```tsx
import type { Meta, StoryObj } from '@stencil/storybook-plugin';
import { h } from '@stencil/core';
import { MyComponent } from './my-component';

const meta = {
  title: 'MyComponent',
  component: MyComponent, // or 'my-component' for lazy-loaded
  args: { first: 'John', last: 'Doe' },
} satisfies Meta<MyComponent>;

export default meta;
type Story = StoryObj<MyComponent>;

export const Primary: Story = {
  args: { first: 'Jane' },
  render: (props) => <my-component {...props} />
};
```

Slots are passed via `parameters.slots`:

```tsx
{
  parameters: {
    slots: {
      default: 'Hello World',      // Unnamed slot
      another: <div>Content</div>  // Named slot
    }
  }
}
```

## Testing Strategy

**E2E Tests** (`tests/`):
- WebdriverIO spins up Storybook dev server via `pnpm dev.example`
- Tests navigate to story URLs: `http://localhost:6006/iframe.html?id=...`
- Chrome browser (headless in CI)
- Configuration in `wdio.conf.ts` and `wdio.conf-lazy.ts`

**Component Tests**:
- Individual component tests within packages use Stencil's test runner
- Test files: `*.spec.ts` (unit), `*.e2e.ts` (e2e per component)

## Stencil Configuration Requirements

For the plugin to work correctly, Stencil projects need:

1. **Docs JSON Output Target** (for autodocs):
```ts
{
  type: 'docs-json',
  file: 'dist/custom-elements.json'
}
```

2. **Component Output Target** (one of):
   - `dist-custom-elements` with `customElementsExportBehavior: 'auto-define-custom-elements'`
   - `dist` with lazy loading (requires `defineCustomElements()` call)

3. **Preview Setup** (`.storybook/preview.ts`):
```ts
import { setCustomElementsManifest } from '@stencil/storybook-plugin';
import customElements from '../dist/custom-elements.json';

setCustomElementsManifest(customElements);
```

## Common Pitfalls

1. **Component not found errors**: Check if story `component` value matches the loading strategy:
   - Auto-define: use constructor `component: MyComponent`
   - Lazy-load: use string `component: 'my-component'`

2. **Hot Module Replacement**: Stories completely reload on changes (no HMR yet)

3. **Dev Mode Only**: Stories run in dev mode; no SSR or hydration serialization

4. **Static Dirs**: Example projects set `staticDirs: ['../dist/esm']` to serve component assets

## Release Process

Only maintainers can release via GitHub Actions workflow (`.github/workflows/release.yml`):
- Manual trigger with version bump type: `patch`, `minor`, `major`
- Dev releases use format: `version-dev.timestamp.githash`
- Production releases create Git tags and publish to npm with `latest` tag
- Only `@stencil/storybook-plugin` is published; examples are private

## Dependencies

**Key Dependencies**:
- `@stencil/core` - Peer dependency for component compilation and rendering
- `storybook` - Peer dependency (v9.0.5+)
- `@storybook/builder-vite` - Vite-based builder
- `unplugin-stencil` - Vite plugin to compile Stencil components
- `preact-render-to-string` - Used for VNode serialization

**Dev Tools**:
- `tsdown` - Build tool (not tsc)
- `npm-run-all2` - Parallel/sequential script execution
- `@wdio/cli` - WebdriverIO test runner

## Known Limitations

- No hot module replacement for stories
- Stories run in dev mode only (no production build testing of components)
- No automated scaffolding command for adding Storybook to existing Stencil projects
