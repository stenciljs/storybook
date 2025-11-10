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
  },
};

export const Secondary: Story = {
  args: {
    first: 'Jane',
    last: 'Smith',
    middle: 'Marie',
  },
};
