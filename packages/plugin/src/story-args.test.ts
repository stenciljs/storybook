import { h } from '@stencil/core';
import { describe, expect, it } from 'vitest';

import { splitStoryArgs } from './story-args';

describe('splitStoryArgs', () => {
  it('passes ordinary args through as props', () => {
    expect(splitStoryArgs({ variant: 'danger', dismissible: true })).toEqual({
      props: { variant: 'danger', dismissible: true },
      slots: {},
    });
  });

  describe('CSS custom properties', () => {
    it('moves `--*` args into `style`, never onto the element as attributes', () => {
      expect(splitStoryArgs({ variant: 'danger', '--badge-color': 'red' }).props).toEqual({
        variant: 'danger',
        style: { '--badge-color': 'red' },
      });
    });

    it('merges them with an object `style` arg', () => {
      expect(splitStoryArgs({ style: { margin: '4px' }, '--badge-color': 'red' }).props.style).toEqual({
        margin: '4px',
        '--badge-color': 'red',
      });
    });

    it('appends them to a string `style` arg', () => {
      expect(splitStoryArgs({ style: 'margin: 4px', '--badge-color': 'red' }).props.style).toBe(
        'margin: 4px;--badge-color:red',
      );
    });

    it('leaves unset and cleared ones out, so the stylesheet default applies', () => {
      expect(splitStoryArgs({ '--a': undefined, '--b': '' }).props).toEqual({});
    });
  });

  describe('slots', () => {
    it('takes `slot:<name>` args as slot content', () => {
      const icon = h('svg', null);
      expect(splitStoryArgs({ 'slot:default': 'Label', 'slot:icon': icon })).toEqual({
        props: {},
        slots: { default: 'Label', icon },
      });
    });

    it('falls back to `parameters.slots`, which a set arg overrides', () => {
      expect(
        splitStoryArgs({ 'slot:default': 'From args' }, { default: 'From params', icon: 'From params' }).slots,
      ).toEqual({ default: 'From args', icon: 'From params' });
    });

    it('keeps an emptied slot arg empty rather than falling back', () => {
      expect(splitStoryArgs({ 'slot:default': '' }, { default: 'From params' }).slots).toEqual({ default: '' });
    });
  });

  it('drops `part:*` args - parts are docs-only', () => {
    expect(splitStoryArgs({ 'part:label': 'x' })).toEqual({ props: {}, slots: {} });
  });
});
