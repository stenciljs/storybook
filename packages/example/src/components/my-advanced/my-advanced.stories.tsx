import type { Meta, StoryObj } from '@stencil/storybook-plugin';
import { h } from '@stencil/core';
import { action } from 'storybook/actions';

import { MyAdvanced } from './my-advanced';
import type { MyAdvancedCustomEvent } from '../../components';

const meta = {
  title: 'my-advanced',
  component: MyAdvanced,
  parameters: {
    actions: { argTypesRegex: '^on.*' },
    layout: 'centered',
  },
  argTypes: {
    first: { control: 'text' },
    middle: { control: 'text' },
    last: { control: 'object' },
    step: { control: 'number' },
    hideButton: { control: 'boolean' },
    customFormat: { control: false },
  },
  args: {
    first: 'John',
    middle: 'M.',
    last: 'Doe',
    step: 1,
  },
} satisfies Meta<JSX.IntrinsicElements['my-advanced']>;

export default meta;
type Story = StoryObj<JSX.IntrinsicElements['my-advanced']>;

export const Primary: Story = {
  args: {
    hideButton: true,
  },
  render: (props) => {
    return <my-advanced {...props} />;
  }
};

export const Secondary: Story = {
  args: {
    first: 'Salvador',
    middle: 'Domingo Felipe Jacinto',
    last: ['Dalí', 'Doménech'],
    step: 5,
    onMyClick: action('myClick'),
  },
  parameters: {
    slots: {
      default: [
        <img src="https://uploads5.wikiart.org/images/salvador-dali.jpg!Portrait.jpg" alt="Salvador Dalí" />,
        <div>But you can just call me, <strong>Salvador</strong></div>,
      ],
    },
  },
};

export const CustomRender: Story = {
  parameters: {
    docs: {
      source: {
        type: 'code',
      }
    }
  },
  render: () => {
    const nameProps = {
      first: 'Federico',
      middle: 'del Sagrado Corazón de Jesús',
      last: ['García', 'Lorca'],
      customFormat: (first: string) => <span>{first}</span>,
    }

    const imgURL = 'https://upload.wikimedia.org/wikipedia/commons/2/22/Federico_Garc%C3%ADa_Lorca._Huerta_de_San_Vicente%2C_Granada.jpg';
    const fullName = nameProps.first + ' ' + nameProps.middle + ' ' + nameProps.last.join(' ');
    const onMyClick = (e: MyAdvancedCustomEvent<number>) => console.log(e.detail);

    return (
      <my-advanced
        {...nameProps}
        onMyClick={onMyClick}
      >
        <img src={imgURL} title={fullName} alt={fullName} />
      </my-advanced>
    );
  },
};
