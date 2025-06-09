import { enhanceArgTypes } from 'storybook/internal/docs-tools';
import type { ArgTypesEnhancer } from 'storybook/internal/types';

import { extractArgTypes, extractComponentDescription } from './docs/custom-elements';
import type { StencilRenderer } from './types';

export const parameters = {
  docs: {
    extractArgTypes: (component: {is: string}) => extractArgTypes(component.is),
    extractComponentDescription: (component: {is: string}) => extractComponentDescription(component.is),
  },
};

export const argTypesEnhancers: ArgTypesEnhancer<StencilRenderer<unknown>>[] = [enhanceArgTypes];
