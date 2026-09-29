import { enhanceArgTypes } from 'storybook/internal/docs-tools';
import type { ArgTypesEnhancer } from 'storybook/internal/types';

import { extractArgTypes, extractComponentDescription, SLOT_ARG_PREFIX } from './docs/custom-elements';
import type { StencilRenderer } from './types';

export const parameters = {
  docs: {
    extractArgTypes,
    extractComponentDescription,
  },
};

/**
 * A slot arg given JSX (a VNode) can't be edited or serialized by a text control - turn the control
 * off for it, keeping it for slots whose content is a plain string.
 * @param context the story's enhancer context
 * @returns the argTypes, with rich-content slots' controls disabled
 */
export const disableRichSlotControls: ArgTypesEnhancer<StencilRenderer<unknown>> = ({ argTypes, initialArgs }) => {
  const args = initialArgs as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(argTypes).map(([key, argType]) =>
      key.startsWith(SLOT_ARG_PREFIX) && args[key] != null && typeof args[key] !== 'string'
        ? [key, { ...argType, control: false }]
        : [key, argType],
    ),
  ) as typeof argTypes;
};

export const argTypesEnhancers: ArgTypesEnhancer<StencilRenderer<unknown>>[] = [
  enhanceArgTypes,
  disableRichSlotControls,
];
