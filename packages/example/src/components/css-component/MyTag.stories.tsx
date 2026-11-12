import type { Meta, StoryObj } from '@stencil/storybook-plugin';

// A CSS-only component has no JS class to import: refer to it by tag name. Its styles load into
// the preview automatically, and its docs/controls come from the CEM.
const meta = {
  title: 'MyTag',
  component: 'my-tag',
  parameters: {
    layout: 'centered',
    slots: { default: 'Label' },
  },
} satisfies Meta<'my-tag'>;

export default meta;
type Story = StoryObj<'my-tag'>;

export const Primary: Story = {};
export const Danger: Story = { args: { variant: 'danger' } };
export const Success: Story = { args: { variant: 'success' } };
