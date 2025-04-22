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
} satisfies Meta<MyComponent>;

export default meta;
type Story = StoryObj<MyComponent>;

export const Primary: Story = {
  args: {
    first: 'John',
    last: 'Doe',
    middle: 'Michael',
  }
};
