import { render as renderStencil, type VNode } from '@stencil/core';

/**
 * A persistent render root for Stencil vnodes.
 *
 * Since Stencil v5, `render(vnode, container)` caches its host ref per
 * container and diffs against the tree it rendered there last time. So the
 * only thing needed to update a story in place is to keep rendering into the
 * same container instead of a new one per render.
 */
export interface VdomRoot {
  readonly container: HTMLElement;
  /** Render `vnode` into the container, reusing existing DOM where possible. */
  patch(vnode: unknown): void;
  /** Remove everything rendered into the container and run vnode `ref(null)` callbacks. */
  unmount(): void;
}

export function createVdomRoot(container: HTMLElement): VdomRoot {
  return {
    container,
    patch(vnode) {
      renderStencil(cloneVNodeTree(vnode) as VNode, container);
    },
    unmount() {
      try {
        // Rendering `null` removes all children through Stencil's own
        // removal path, which also calls `ref(null)` on vnode refs.
        renderStencil(null as unknown as VNode, container);
      } catch {
        // fall through to a hard clear
      }
      container.replaceChildren();
    },
  };
}

/**
 * Stencil writes the created DOM node onto each vnode (`$elm$`) and reads it
 * back on the next patch. Story output often reuses vnode objects across
 * renders and across canvases: `parameters.slots` vnodes are created once at
 * module load, and docs pages render the same story several times. Patching a
 * shared vnode would point one canvas at another canvas's DOM, so every render
 * gets a private copy of the tree.
 */
export function cloneVNodeTree<T>(node: T): T {
  if (Array.isArray(node)) {
    return node.map(cloneVNodeTree) as T;
  }
  if (!isVNode(node)) {
    return node;
  }
  return {
    ...node,
    $elm$: null,
    $children$: node.$children$ ? node.$children$.map(cloneVNodeTree) : node.$children$,
  } as T;
}

export function isVNode(value: unknown): value is VNode & { $children$: unknown[] | null; $elm$: unknown } {
  return typeof value === 'object' && value !== null && '$flags$' in value && ('$tag$' in value || '$text$' in value);
}
