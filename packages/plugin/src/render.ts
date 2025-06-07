import { ArgsStoryFn, RenderContext } from 'storybook/internal/types'
import { simulatePageLoad } from 'storybook/preview-api'
import { render as renderStencil, h, VNode } from '@stencil/core'

import type { StencilRenderer } from './types'

export const render: ArgsStoryFn<StencilRenderer<unknown>> = (args, context) => {
    const { component, parameters } = context;

    if (Array.isArray(component)) {
        throw new Error('If your story does not contain a render function, you must provide a component property!')
    }

    const cmpName = customElements.getName(component)
    if (!cmpName) {
        throw new Error('Component is not registered!')
    }

    const children: VNode[] = [];

    if (parameters.slots) {
      Object.entries(parameters.slots).forEach(([key, value]) => {
        // if the parameter key is 'default' don't give it a slot name so it renders just as a child
        const slot = key === 'default' ? undefined : key;

        // Handle array of values for the same slot
        const values = Array.isArray(value) ? value : [value];

        values.forEach(item => {
          if (item === undefined || item === null) return;

          if (typeof item === 'string') {
            // For strings, create a vnode with the string as the children
            children.push(h('span', { slot }, item));
          } else if (Array.isArray(item)) {
            // Handle nested arrays (flatten them)
            item.forEach(nestedItem => {
              if (nestedItem !== undefined && nestedItem !== null) {
                children.push({
                  ...nestedItem,
                  $attrs$: {
                    ...(nestedItem.$attrs$ || {}),
                    slot,
                  },
                });
              }
            });
          } else {
            // For VNodes or other objects
            children.push({
              ...item,
              $attrs$: {
                ...(item.$attrs$ || {}),
                slot,
              },
            });
          }
        });
      });
    }

    const Component = `${cmpName}`;
    return h(Component, { ...args }, children)
};

export function renderToCanvas(
    { storyFn, showMain, storyContext }: RenderContext<StencilRenderer<unknown>>,
    canvasElement: StencilRenderer<unknown>['canvasElement']
) {
    const vdom = storyFn()
    showMain()

    /**
     * If the component is not automatically registered after import, register it here
     */
    if (storyContext.component && storyContext.component.is && !customElements.get(storyContext.component.is)) {
        customElements.define(storyContext.component.is, storyContext.component);
    }

    if (canvasElement.firstChild) {
        canvasElement.removeChild(canvasElement.firstChild)
    }

    const element = document.createElement('div')
    canvasElement.appendChild(element)
    renderStencil(vdom, element);
    simulatePageLoad(element)
}
