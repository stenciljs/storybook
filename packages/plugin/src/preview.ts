export const parameters = { 
  renderer: 'stencil',
  docs: {
    source: {
      type: 'dynamic',
    },
  },
};

export { render, renderToCanvas, transformSource } from './render.js';
