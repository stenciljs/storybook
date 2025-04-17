import type { Meta, StoryObj } from '@stencil/storybook-plugin';
import { h } from '@stencil/core';

import { MyComponent } from './my-component';

// Define the props type for consistency
type MyComponentProps = {
  first: string;
  last: string;
  middle: string;
};

const meta = {
  title: 'StencilJS/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    first: { control: 'text' },
    last: { control: 'text' },
    middle: { control: 'text' },
  },
  args: { first: 'John', last: 'Doe', middle: 'Michael' },
} satisfies Meta<MyComponentProps>;

export default meta;
type Story = StoryObj<MyComponentProps>;

export const Primary: Story = {
  args: {
    first: 'John',
    last: 'Doe',
    middle: 'Michael',
  },
  // render: (props: MyComponentProps) => {
  //   console.log(MyComponent)
  //   return <my-component {...props} />;
  // }
};
