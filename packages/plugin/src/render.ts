import { h, render as renderStencil, VNode } from '@stencil/core';
import { ArgsStoryFn, RenderContext } from 'storybook/internal/types';
import { simulatePageLoad } from 'storybook/preview-api';

import { isCssOnlyComponent } from './docs/custom-elements';
import { splitStoryArgs } from './story-args';
import type { StencilRenderer } from './types';

export const render: ArgsStoryFn<StencilRenderer<unknown>> = (args, context) => {
  const { component, parameters } = context;

  if (Array.isArray(component)) {
    throw new Error('If your story does not contain a render function, you must provide a component property!');
  }
  if (typeof component === 'string' && !customElements.get(component) && !isCssOnlyComponent(component)) {
    throw new Error(
      `Stencil component <${component}> is not registered. Make sure it is imported in your story file or in preview.ts.`,
    );
  } else if (typeof component !== 'string' && !customElements.getName(component)) {
    // After HMR the module re-evaluates and produces a new class reference, so
    // getName returns null even though the tag is still registered under component.is.
    if (!(component as any).is || !customElements.get((component as any).is)) {
      throw new Error(
        `Stencil component is not registered. Make sure the component class is imported in your story file.`,
      );
    }
  }
  const cmpName =
    typeof component === 'string' ? component : (customElements.getName(component) ?? (component as any).is);

  const { props, slots } = splitStoryArgs(args as Record<string, unknown>, parameters.slots);

  const children: any[] = Object.entries(slots).map(([key, value]: [string, any]) => {
    // if the parameter key is 'default' don't give it a slot name so it renders just as a child
    const slot = key === 'default' ? undefined : key;
    // if the value it s a string, create a vnode with the string as the children
    const child =
      typeof value === 'string'
        ? h(undefined, { slot }, value)
        : {
            ...value,
            $attrs$: {
              ...value.$attrs$,
              slot,
            },
          };
    // if the value is a fragment and it is a named slot, create a span element with the slot name
    child.$tag$ = child.$tag$ || (slot ? 'span' : null);
    return child.$tag$ ? child : child.$children$;
  });

  const Component = `${cmpName}`;
  return h(Component, props, children);
};

export function renderToCanvas(
  { storyFn, showMain, storyContext }: RenderContext<StencilRenderer<unknown>>,
  canvasElement: StencilRenderer<unknown>['canvasElement'],
) {
  const vdom = storyFn();
  showMain();

  if (storyContext.component?.is && !customElements.get(storyContext.component.is)) {
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
