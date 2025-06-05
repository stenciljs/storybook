import { h } from '@stencil/core';
import type { Meta, StoryObj } from '@stencil/storybook-plugin';
import { MySlotted } from './my-slotted';

const meta = {
  title: 'MySlotted',
  component: MySlotted,
  parameters: {
    layout: 'centered',
  },
  args: {},
} satisfies Meta<MySlotted>;

export default meta;
type Story = StoryObj<MySlotted>;

export const Primary: Story = {
  args: {},
  parameters: {
    slots: {
      default: 'Hello World',
      another: <div>another</div>,
    },
  },
};

export const Secondary: Story = {
  args: {},
  parameters: {
    slots: {
      default: <div>default</div>,
      another: 'does it work?'
    },
  },
};
