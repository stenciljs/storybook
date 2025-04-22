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

export const Secondary: Story = {
  args: {
    first: 'Jane',
    last: 'Smith',
    middle: 'Marie',
  },
};