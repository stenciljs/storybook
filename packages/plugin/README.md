# StencilJS Storybook Plugin

> This is still early and work in progress, don't use it yet!

## Setup

In an existing StencilJS project, run:

```sh
npx storybook@next init
```

to setup a new Storybook project. Select any preset available, e.g. Lit and finish the setup process. After, install the StencilJS preset.

```sh
npm i --save-dev @stencil/storybook-plugin
```

Last, update the `.storybook/main.ts` file as following:

```ts
const config = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@stencil/storybook-plugin"
  }
};

export default config;
```

See the [Storybook Docs](https://storybook.js.org/docs/7.0/qwik/get-started/introduction) for the best documentation on getting started with Storybook.

## Usage

A basic story will look like this:

```tsx
import type { Meta, StoryObj } from '@stencil/storybook-plugin';
import { h } from '@stencil/core';

import { MyComponent } from './my-component';

const meta = {
  title: 'MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    first: { control: 'text' },
    last: { control: 'text' },
    middle: { control: 'text' },
  },
  args: { first: 'John', last: 'Doe', middle: 'Michael' },
} satisfies Meta<MyComponent>;

export default meta;
type Story = StoryObj<MyComponent>;

export const Primary: Story = {
  args: {
    first: 'John',
    last: 'Doe',
    middle: 'Michael',
  },
  render: (props) => {
    return <my-component {...props} />;
  }
};
```

If you are using slots in your component, pass them as parameters to the story object like this:

```tsx
import type { Meta, StoryObj } from '@stencil/storybook-plugin';
import { h } from '@stencil/core';

import { MySlotted } from './my-slotted';

const meta = {
  title: 'MySlotted',
  component: MySlotted,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<MySlotted>;

export default meta;
type Story = StoryObj<MySlotted>;

export const Primary: Story = {
  args: {},
  parameters: {
    slots: {
      default: 'Hello World',
      another: <div>another</div>
    },
  }
};
```

### Troubleshooting

If you encounter any issues with the story rendering, please check the following:

- If your `customElementsExportBehavior` is set to a value that lazy loads components, ensure that you are using `defineCustomElements()` in `preview.ts`. You should also define your component as a string in your story file: `component: 'my-component'` as it does not yet exist in the custom element registry.
- If your `customElementsExportBehavior` is set to a value like `auto-define-custom-elements` or `default`, do not include `defineCustomElements()` in `preview.ts` and use the constructor as the component value in your story file: `component: MyComponent`.
- Check the console for any error messages.

## Limitations

This is early development and we are still seeing some limitations we want to see fixed:

- Story is completely reloaded when component is changed (no hot module replacement)
- There is no automation yet for easily scaffolding storybook in a Stencil project.
- Stories are run in dev mode - no SSR, or serialization happens

Please get involved and support the project with code contributions. Thanks!
