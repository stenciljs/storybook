import { h } from '@stencil/core';
import { describe, expect, it } from 'vitest';

import { disableRichSlotControls } from './entry-preview-argtypes';

describe('disableRichSlotControls', () => {
  const argTypes = {
    'slot:default': { name: 'default', control: { type: 'text' } },
    'slot:icon': { name: 'icon', control: { type: 'text' } },
    icon: { name: 'icon', control: { type: 'object' } },
  };

  it('turns off the text control for slots given JSX, keeping it for strings and unset slots', () => {
    const result = disableRichSlotControls({
      argTypes,
      initialArgs: { 'slot:icon': h('svg', null), icon: h('svg', null) },
    } as any);

    expect(result['slot:icon'].control).toBe(false);
    expect(result['slot:default'].control).toEqual({ type: 'text' });
    // not a slot arg
    expect(result.icon.control).toEqual({ type: 'object' });
  });
});
