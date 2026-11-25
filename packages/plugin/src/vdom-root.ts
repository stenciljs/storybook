import { render as renderStencil, type VNode } from '@stencil/core';
import * as stencilClient from '@stencil/core/internal/client';

/**
 * A persistent render root for Stencil vnodes.
 *
 * Stencil's public `render(vnode, container)` creates a fresh host ref on every
 * call, so it always diffs against an empty tree: calling it twice on the same
 * container appends a second copy instead of patching the first. To update a
 * story in place we keep our own host ref per container and pass it to
 * `renderVdom`, which stores the rendered tree on `hostRef.$vnode$` and diffs
 * against it on the next call. This is exactly what `render()` does internally,
 * minus throwing the ref away.
 *
 * `renderVdom` is not part of Stencil's public API, so it is feature-detected.
 * Without it, `patch` falls back to clearing the container and rendering from
 * scratch, which is the plugin's previous behaviour.
 */
export interface VdomRoot {
  readonly container: HTMLElement;
  /** Render `vnode` into the container, reusing existing DOM where possible. */
  patch(vnode: unknown): void;
  /** Remove everything rendered into the container and run vnode `ref(null)` callbacks. */
  unmount(): void;
  /** Whether `patch` diffs against the previous tree (`false` means it falls back to recreating). */
  readonly canDiff: boolean;
}

type RenderVdom = (hostRef: unknown, vnode: unknown) => void;

const renderVdom: RenderVdom | null = typeof stencilClient.renderVdom === 'function' ? stencilClient.renderVdom : null;

/**
 * @param diff Stencil's `renderVdom`. Pass `null` to force the recreate-on-every-render fallback.
 */
export function createVdomRoot(container: HTMLElement, diff: RenderVdom | null = renderVdom): VdomRoot {
  // Same shape `render()` in @stencil/core builds on every call.
  const hostRef = {
    $flags$: 0,
    $cmpMeta$: { $flags$: 0, $tagName$: container.tagName },
    $hostElement$: container,
  };

  return {
    container,
    canDiff: !!diff,
    patch(vnode) {
      const tree = cloneVNodeTree(vnode);
      if (diff) {
        diff(hostRef, tree);
      } else {
        container.replaceChildren();
        renderStencil(tree as VNode, container);
      }
    },
    unmount() {
      if (diff) {
        try {
          // Rendering `null` removes all children through Stencil's own
          // removal path, which also calls `ref(null)` on vnode refs.
          diff(hostRef, null);
        } catch {
          // fall through to a hard clear
        }
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
