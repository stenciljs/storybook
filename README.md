# Storybook Framework StencilJS

> This is still early and work in progress, don't use it yet!

## Limitations

- This has only been tested with brand new Qwik applications and component libraries.
- Story is completely reloaded when component is changed (no hot module replacement)
- There is no automation yet for easily scaffolding storybook in a Qwik project.
- Stories are run in dev mode - no SSR, or serialization happens

## Setup

In an existing Qwik project, run `npx storybook@next init` (Storybook 7 is required)

See the [Storybook Docs](https://storybook.js.org/docs/7.0/qwik/get-started/introduction) for the best documentation on getting started with Storybook.

## Usage

A basic story will look like this:

```tsx
import MyComponent, { MyComponentProps } from "./MyComponent";
import { StoryObj } from "@stencil/storybook";

export default {
  title: "MyComponent",
  component: MyComponent, // component value may be a `component$`, or a "Lite component" (function component)
} as Meta<MyComponentProps>;

export const Default: StoryObj<MyComponentProps> = {};
```
