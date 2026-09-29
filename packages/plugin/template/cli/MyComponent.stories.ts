import type { Meta, StoryObj } from '@stencil/storybook-plugin';
import { MyComponent } from './MyComponent';

const meta = {
  title: 'MyComponent',
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
} satisfies Meta<'my-component'>;

export default meta;
type Story = StoryObj<'my-component'>;

export const Primary: Story = {
  args: {
    first: 'John',
    last: 'Doe',
    middle: 'Michael',
  },
};
