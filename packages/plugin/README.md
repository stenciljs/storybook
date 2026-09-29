# @stencil/storybook-plugin

Storybook framework plugin for StencilJS. Provides a zero-config integration with full HMR, automatic argTypes from component metadata, and controls out of the box.

## Setup

In your Stencil project, install Storybook and the plugin:

```sh
npm install --save-dev storybook @stencil/storybook-plugin
```

Configure `.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@stencil/storybook-plugin';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@stencil/storybook-plugin',
  },
};

export default config;
```

That's it. The plugin automatically:
- Transpiles Stencil components on the fly via `@stencil/unplugin`
- Generates a Custom Elements Manifest from your component decorators
- Populates argTypes (props, events, slots, CSS parts/properties) in the docs panel
- Enables HMR for component changes

## Writing Stories

Import your component class directly — no separate registration step needed:

```tsx
import type { Meta, StoryObj } from '@stencil/storybook-plugin';
import { MyComponent } from './my-component';

const meta: Meta<MyComponent> = {
  title: 'MyComponent',
  component: MyComponent,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<MyComponent>;

export const Primary: Story = {
  args: { first: 'John', last: 'Doe' },
};
```

### Slots

Pass slot content via `parameters.slots`:

```tsx
export const WithSlot: Story = {
  parameters: {
    slots: {
      default: 'Hello World',
      footer: <span>Footer content</span>,
    },
  },
};
```

## Autodocs

The docs panel is populated automatically from your `@Component`, `@Prop`, `@Event`, `@Method`, and `@Slot` decorators — including JSDoc comments and tags such as `@since`, `@see`, and `@deprecated`.

No manual CEM setup required.

## Source Code Display

Control the source snippet language via story parameters:

```tsx
export default {
  parameters: {
    docs: {
      source: { language: 'html' }, // 'html' | 'jsx' | 'tsx'
    },
  },
} satisfies Meta<MyComponent>;
```

**HTML** (default):
```html
<my-component first="John"></my-component>
```

**JSX/TSX**: custom element tag names are converted to PascalCase, HTML attributes to their JSX equivalents (`class` → `className`, etc.), and long attribute lists are wrapped automatically.

### Global source format toolbar

```ts
// .storybook/preview.ts
export const globalTypes = {
  source: {
    name: 'Source Format',
    defaultValue: 'html',
    toolbar: {
      items: ['html', 'jsx', 'tsx'],
      icon: 'markup',
      showName: true,
      dynamicTitle: true,
    },
  },
};
```
