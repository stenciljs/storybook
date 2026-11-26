import { h, VNode } from '@stencil/core';
import { ArgsStoryFn, RenderContext } from 'storybook/internal/types';
import { simulateDOMContentLoaded, simulatePageLoad } from 'storybook/preview-api';

import { isCssOnlyComponent } from './docs/custom-elements';
import { splitStoryArgs } from './story-args';
import type { StencilRenderer } from './types';
import { createVdomRoot, type VdomRoot } from './vdom-root';

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

/**
 * What is currently rendered into a canvas. Keyed by canvas element, so docs
 * pages with several stories keep one entry per story.
 */
type CanvasState = { kind: 'vdom'; root: VdomRoot } | { kind: 'string'; html: string } | { kind: 'node'; node: Node };

const canvases = new WeakMap<HTMLElement, CanvasState>();

/**
 * Renders a story into its canvas.
 *
 * Args changes arrive with `forceRemount: false`; for vnode output we then
 * patch the existing tree so the component keeps its identity, internal state
 * and focus, and its load lifecycle doesn't run again. The tree is rebuilt only
 * when Storybook asks for it (`forceRemount`: story change, the Remount button)
 * or when the kind of story output changes.
 *
 * Resolves once every Stencil component in the story reports
 * `componentOnReady()`, so play functions and anything waiting on the render
 * see a fully loaded component.
 */
export async function renderToCanvas(
  { storyFn, showMain, showError, forceRemount, storyContext, name, title }: RenderContext<StencilRenderer<unknown>>,
  canvasElement: StencilRenderer<unknown>['canvasElement'],
) {
  /**
   * If the component is not automatically registered after import, register it here.
   * This must happen before `storyFn()`, because the default `render` throws for unregistered components.
   */
  if (storyContext.component?.is && !customElements.get(storyContext.component.is)) {
    customElements.define(storyContext.component.is, storyContext.component);
  }

  const result = storyFn() as unknown;
  showMain();

  const teardown = () => clearCanvas(canvasElement);
  const previous = canvases.get(canvasElement);

  if (result === null || result === undefined) {
    clearCanvas(canvasElement);
    showError({
      title: `Expecting a Stencil vnode, an HTML string or a DOM node from the story: "${name}" of "${title}".`,
      description:
        'Did you forget to return the JSX from the story? Use "() => <my-component />" when defining the story.',
    });
    return teardown;
  }

  if (typeof result === 'string') {
    if (!forceRemount && previous?.kind === 'string' && previous.html === result) {
      return teardown;
    }
    clearCanvas(canvasElement);
    canvasElement.innerHTML = result;
    canvases.set(canvasElement, { kind: 'string', html: result });
    simulatePageLoad(canvasElement);
    await whenComponentsReady(canvasElement);
    return teardown;
  }

  if (result instanceof Node) {
    if (!forceRemount && previous?.kind === 'node' && previous.node === result && result.parentNode === canvasElement) {
      return teardown;
    }
    clearCanvas(canvasElement);
    canvasElement.appendChild(result);
    canvases.set(canvasElement, { kind: 'node', node: result });
    simulateDOMContentLoaded();
    await whenComponentsReady(canvasElement);
    return teardown;
  }

  // Stencil vnode (or an array of them, e.g. from a fragment).
  // Reuse the existing root unless a remount was requested, the previous output
  // wasn't a vnode tree, or something else replaced the canvas content.
  let root =
    !forceRemount && previous?.kind === 'vdom' && previous.root.container.parentNode === canvasElement
      ? previous.root
      : undefined;
  const mounting = !root;
  if (!root) {
    clearCanvas(canvasElement);
    const container = document.createElement('div');
    canvasElement.appendChild(container);
    root = createVdomRoot(container);
    canvases.set(canvasElement, { kind: 'vdom', root });
  }

  root.patch(result);
  if (mounting) {
    simulatePageLoad(root.container);
  }
  await whenComponentsReady(root.container);
  return teardown;
}

function clearCanvas(canvasElement: HTMLElement) {
  const state = canvases.get(canvasElement);
  if (state?.kind === 'vdom') {
    state.root.unmount();
  }
  canvases.delete(canvasElement);
  canvasElement.replaceChildren();
}

/** How long to wait for components to report ready before resolving anyway. */
const COMPONENT_READY_TIMEOUT = 5000;

/**
 * Waits for every Stencil component under `root` to finish loading. Elements
 * that aren't Stencil components (or aren't upgraded yet) have no
 * `componentOnReady` and are skipped. Only light DOM is scanned; Stencil's own
 * `componentOnReady()` already waits for components nested in shadow roots.
 *
 * Gives up after `COMPONENT_READY_TIMEOUT` so a component that never loads
 * can't hang the render (and any play function waiting on it).
 */
async function whenComponentsReady(root: Element) {
  const pending: Promise<unknown>[] = [];
  root.querySelectorAll('*').forEach((el) => {
    const ready = (el as { componentOnReady?: () => Promise<unknown> }).componentOnReady;
    if (typeof ready === 'function') {
      pending.push(ready.call(el));
    }
  });
  if (!pending.length) {
    return;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), COMPONENT_READY_TIMEOUT);
  });
  const outcome = await Promise.race([Promise.allSettled(pending), timedOut]);
  clearTimeout(timer);
  if (outcome === 'timeout') {
    console.warn(
      `[@stencil/storybook-plugin] Components did not report ready within ${COMPONENT_READY_TIMEOUT}ms; continuing anyway.`,
    );
  }
}
