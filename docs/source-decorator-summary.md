# Stencil Storybook Plugin Development Summary

## Overview

This document summarizes the work done on enhancing the Stencil Storybook plugin, particularly focusing on the implementation of the `sourceDecorator` for dynamic source code generation in Storybook documentation.

## What is the Source Decorator?

The `sourceDecorator` is a Storybook decorator that dynamically generates JSX-like source code for components based on the story's args and parameters. This allows developers to see how they would use the component in their code, with the correct props and structure, without having to manually write the source code examples.

Key features of the `sourceDecorator`:

1. **Dynamic Source Generation**: Automatically generates source code based on the component's tag name and the props passed to it in the story.
2. **Props Formatting**: Correctly formats different types of props (strings, booleans, objects) in JSX syntax.
3. **Integration with Storybook Docs**: Uses Storybook's `emitTransformCode` API to display the generated source in the docs panel.

## Implementation Details

The `sourceDecorator` is implemented in `/packages/plugin/src/docs/sourceDecorator.ts` and consists of several key functions:

1. **`sourceDecorator`**: The main decorator function that:
   - Gets the component's tag name using `getComponentTagName`
   - Generates source code using `generateComponentSource`
   - Emits the code to Storybook using `emitTransformCode`

2. **`generateComponentSource`**: Creates a JSX-like string representation of a component with its props:
   - Filters out undefined/null values and functions
   - Formats props based on their types (strings, booleans, objects)
   - Returns a properly formatted JSX string

3. **`getComponentTagName`**: Retrieves the tag name for a Stencil component:
   - First tries to get it from the custom elements registry
   - Falls back to the component's `is` property if available

4. **`formatValue`**: Helper function to format complex values like objects into string representations.

5. **`skipSourceRender`**: Helper function to determine if source rendering should be skipped (e.g., if static source is provided).

## Integration with Storybook

The source decorator is integrated into the Storybook workflow through:

1. **Entry Point**: Exported from `/packages/plugin/src/preview-docs.ts` along with default parameters that set `docs.source.type` to `'dynamic'`.

2. **Preset Configuration**: The `/packages/plugin/src/preset.ts` file conditionally loads `preview-docs.js` when docs are enabled.

3. **Build Configuration**: The `/packages/plugin/tsdown.config.ts` includes `preview-docs.ts` as an entry point for building.

## Examples

Examples of the source decorator in action can be found in the example project:

1. **Basic Component**: `/packages/example/src/components/my-component/MyComponent.stories.tsx`
   - Shows basic prop handling and source generation

2. **Slotted Component**: `/packages/example/src/components/my-slotted/MySlotted.stories.tsx`
   - Demonstrates how to use slots in stories
   - Example of how the source decorator handles slotted content

## Usage

To use the source decorator in a Stencil Storybook project:

1. The decorator is automatically applied when docs are enabled
2. No manual configuration is needed in most cases
3. For slotted components, define slots in the story parameters:

```tsx
export const Primary: Story = {
  args: {},
  parameters: {
    slots: {
      default: 'Default slot content',
      named: <div>Named slot content</div>,
    },
  },
};
```