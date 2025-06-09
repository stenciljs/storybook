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

export const Strings: Story = {
  args: {},
  parameters: {
    slots: {
      default: 'default',
      another: 'another',
    },
  },
};

export const Elements: Story = {
  args: {},
  parameters: {
    slots: {
      default: <div>default</div>,
      another: <div>another</div>,
    },
  },
};

export const Fragments: Story = {
  args: {},
  parameters: {
    slots: {
      default: (
        <>
          <h1>hello</h1>
          <h2>world</h2>
        </>
      ),
      another: (
        <>
          <h1>hello</h1>
          <h2>world</h2>
        </>
      ),
    },
  },
};
