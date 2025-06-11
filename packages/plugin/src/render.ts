import { h, render as renderStencil, VNode } from '@stencil/core';
import { ArgsStoryFn, RenderContext } from 'storybook/internal/types';
import { simulatePageLoad } from 'storybook/preview-api';

import type { StencilRenderer } from './types';

export const render: ArgsStoryFn<StencilRenderer<unknown>> = (args, context) => {
  const { component, parameters } = context;

  if (Array.isArray(component)) {
    throw new Error('If your story does not contain a render function, you must provide a component property!');
  }
  if (typeof component === 'string' && !customElements.get(component)) {
    throw new Error(
      `Stencil component not found. If you are not lazy loading your components with \`defineCustomElements()\` in preview.ts, pass a constructor value for component in your story \`component: MyComponent\``,
    );
  } else if (typeof component !== 'string' && !customElements.getName(component)) {
    throw new Error(
      `Stencil component not found. If you are lazy loading your components with \`defineCustomElements()\` in preview.ts, pass a string value for component in your story \`component: 'my-component'\``,
    );
  }
  const cmpName = typeof component === 'string' ? component : customElements.getName(component);

  const children: any[] = Object.entries<VNode>(parameters.slots || []).map(([key, value]) => {
    // if the parameter key is 'default' don't give it a slot name so it renders just as a child
    const slot = key === 'default' ? undefined : key;
    // if the value it s a string, create a vnode with the string as the children
    const child =
      typeof value === 'string'
        ? h(undefined, { slot }, value)
        : {
            ...value,
            $attrs$: {
              slot,
            },
          };
    // if the value is a fragment and it is a named slot, create a span element with the slot name
    child.$tag$ = child.$tag$ || (slot ? 'span' : null);
    return child.$tag$ ? child : child.$children$;
  });

  const Component = `${cmpName}`;
  return h(Component, { ...args }, children);
};

export function renderToCanvas(
  { storyFn, showMain, storyContext }: RenderContext<StencilRenderer<unknown>>,
  canvasElement: StencilRenderer<unknown>['canvasElement'],
) {
  const vdom = storyFn();
  showMain();

  /**
   * If the component is not automatically registered after import, register it here
   */
  if (storyContext.component && storyContext.component.is && !customElements.get(storyContext.component.is)) {
    customElements.define(storyContext.component.is, storyContext.component);
  }

  if (canvasElement.firstChild) {
    canvasElement.removeChild(canvasElement.firstChild);
  }

  const element = document.createElement('div');
  canvasElement.appendChild(element);
  renderStencil(vdom, element);
  simulatePageLoad(element);
}
