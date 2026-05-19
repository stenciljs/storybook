import { enhanceArgTypes } from 'storybook/internal/docs-tools';
import type { ArgTypesEnhancer, Parameters } from 'storybook/internal/types';

export const parameters: Parameters = { renderer: 'stencil' };

export { render, renderToCanvas } from './render';

export const argTypesEnhancers: ArgTypesEnhancer[] = [enhanceArgTypes];

// Reload the iframe when a Stencil component .tsx is rebuilt — see preset.ts.
if (import.meta.hot) {
  import.meta.hot.on('stencil:reload', () => {
    location.reload();
  });
}
