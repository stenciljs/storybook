import { enhanceArgTypes } from 'storybook/internal/docs-tools';
import type { ArgTypesEnhancer, Parameters } from 'storybook/internal/types';

export const parameters: Parameters = { renderer: 'stencil' };

export { render, renderToCanvas } from './render';

export const argTypesEnhancers: ArgTypesEnhancer[] = [enhanceArgTypes];
