import { sourceDecorator } from './docs/sourceDecorator';

export const parameters: { renderer: 'stencil'; docs: { source: { type: string } } } = { 
  renderer: 'stencil',
  docs: {
    source: {
      type: 'dynamic',
    },
  },
};

export { render, renderToCanvas } from './render.js';
export { sourceDecorator };
