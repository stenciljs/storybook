import { h } from '@stencil/core';
import type { Meta, StoryObj } from '@stencil/storybook-plugin';
import type { MyProbe } from './my-probe';

/**
 * Stories for checking that changing args patches the rendered element in
 * place instead of remounting it.
 */
const meta = {
  title: 'MyProbe',
  component: 'my-probe',
  args: {
    label: 'Probe',
    disabled: false,
    count: 1,
    config: { color: 'teal', size: 'small' },
    items: ['alpha', 'beta'],
  },
  argTypes: {
    config: { control: 'object' },
    items: { control: 'object' },
  },
} satisfies Meta<MyProbe>;

export default meta;
type Story = StoryObj<MyProbe>;

/** Default render: `render()` from the plugin, no custom template. */
export const Default: Story = {};

/** Custom render with wrapper markup and slotted content driven by args. */
export const WithRender: Story = {
  render: args => (
    <div class="wrapper">
      <my-probe {...args}>
        <p class="slotted">Slotted: {args.label}</p>
      </my-probe>
    </div>
  ),
};

/** Story wrapped in a decorator that adds markup around it. */
export const WithDecorator: Story = {
  decorators: [Story => <div style={{ padding: '24px', outline: '1px dashed gray' }}>{Story()}</div>],
};
