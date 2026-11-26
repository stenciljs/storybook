import type { VNode } from '@stencil/core';

import { PART_ARG_PREFIX, SLOT_ARG_PREFIX } from './docs/custom-elements';

export type SlotContent = string | VNode;

export interface StoryArgs {
  /** Everything to set on the element - props/attributes, plus `style` carrying CSS custom properties. */
  props: Record<string, unknown>;
  /** Slot content keyed by slot name (`default` for the default slot). */
  slots: Record<string, SlotContent>;
}

/**
 * Split a story's args into what goes on the element and what goes in its slots:
 * - `--*` args are CSS custom properties, set through `style` (merged with any `style` arg).
 *   An attribute can't be named `--*` - `setAttribute` would throw.
 * - `slot:<name>` args are slot content, overriding `parameters.slots[<name>]`.
 * - `part:<name>` args are docs-only.
 * @param args the story's args
 * @param slotParams the story's `parameters.slots`, the fallback slot content
 * @returns the element's props and its slot content
 */
export function splitStoryArgs(args: Record<string, unknown>, slotParams: Record<string, SlotContent> = {}): StoryArgs {
  const props: Record<string, unknown> = {};
  const cssProps: Record<string, string> = {};
  const slots: Record<string, SlotContent> = { ...slotParams };

  for (const [key, value] of Object.entries(args)) {
    if (key.startsWith('--')) {
      // an unset / cleared control falls back to the stylesheet's own value
      if (value != null && value !== '') cssProps[key] = String(value);
    } else if (key.startsWith(SLOT_ARG_PREFIX)) {
      if (value !== undefined) slots[key.slice(SLOT_ARG_PREFIX.length)] = value as SlotContent;
    } else if (!key.startsWith(PART_ARG_PREFIX)) {
      props[key] = value;
    }
  }

  if (Object.keys(cssProps).length > 0) {
    const { style } = props;
    props.style =
      typeof style === 'string'
        ? `${style.replace(/;?\s*$/, ';')}${Object.entries(cssProps)
            .map(([name, value]) => `${name}:${value}`)
            .join(';')}`
        : { ...(style as Record<string, string> | undefined), ...cssProps };
  }

  return { props, slots };
}
