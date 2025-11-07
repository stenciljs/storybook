import { h } from '@stencil/core';
import type { Meta, StoryObj } from '@stencil/storybook-plugin';
import type { JSX } from '../../components';

const meta = {
  title: 'MyComponent',
  component: 'my-component',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<JSX.MyComponent>;

export default meta;
type Story = StoryObj<JSX.MyComponent>;

export const Primary: Story = {
  args: {
    first: 'John',
    last: 'Doe',
    middle: 'Michael',
    onEvalEvent: () => console.log('Eval event triggered'),
  },
  render: props => {
    return <my-component {...props} />;
  },
};

export const Secondary: Story = {
  args: {
    first: 'Jane',
    last: 'Smith',
    middle: 'Marie',
  },
};
