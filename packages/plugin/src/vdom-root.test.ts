// @vitest-environment jsdom
import { h } from '@stencil/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestProbe } from './test-utils';
import { cloneVNodeTree, createVdomRoot } from './vdom-root';

describe('createVdomRoot', () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.replaceChildren();
    container = document.createElement('div');
    document.body.appendChild(container);
    TestProbe.reset();
  });

  it('patches the existing element instead of recreating it', () => {
    const root = createVdomRoot(container);
    root.patch(h('test-probe', { label: 'one' }));
    const first = container.querySelector('test-probe') as TestProbe;

    root.patch(h('test-probe', { label: 'two' }));

    expect(container.querySelector('test-probe')).toBe(first);
    expect(container.querySelectorAll('test-probe')).toHaveLength(1);
    expect(first.label).toBe('two');
    expect(TestProbe.connected).toBe(1);
  });

  it('patches nested markup and text', () => {
    const root = createVdomRoot(container);
    const tree = (text: string) => h('div', { class: 'wrapper' }, h('test-probe', null, h('p', null, text)));
    root.patch(tree('a'));
    const wrapper = container.firstElementChild;
    const p = container.querySelector('p');

    root.patch(tree('b'));

    expect(container.firstElementChild).toBe(wrapper);
    expect(container.querySelector('p')).toBe(p);
    expect(p?.textContent).toBe('b');
  });

  it('only recreates when the root tag changes', () => {
    const root = createVdomRoot(container);
    root.patch(h('test-probe', null));
    const first = container.firstElementChild;

    root.patch(h('section', null));

    expect(container.firstElementChild).not.toBe(first);
    expect(container.firstElementChild?.tagName).toBe('SECTION');
  });

  it('unmount clears the container and runs ref(null)', () => {
    const ref = vi.fn();
    const root = createVdomRoot(container);
    root.patch(h('test-probe', { ref }));
    expect(ref).toHaveBeenLastCalledWith(expect.any(TestProbe));

    root.unmount();

    expect(container.childNodes).toHaveLength(0);
    expect(ref).toHaveBeenLastCalledWith(null);
    expect(TestProbe.disconnected).toBe(1);
  });

  it('keeps roots independent when they render the same vnode objects', () => {
    // parameters.slots vnodes are created once and reused on every render, in
    // every canvas that shows the story (e.g. a docs page).
    const shared = h('span', { slot: 'x' }, 'shared');
    const a = document.createElement('div');
    const b = document.createElement('div');
    document.body.append(a, b);
    const rootA = createVdomRoot(a);
    const rootB = createVdomRoot(b);

    rootA.patch(h('test-probe', { label: 'a' }, shared));
    rootB.patch(h('test-probe', { label: 'b' }, shared));
    rootA.patch(h('test-probe', { label: 'a2' }, shared));
    rootB.patch(h('test-probe', { label: 'b2' }, shared));

    expect(a.querySelector('span')?.textContent).toBe('shared');
    expect(b.querySelector('span')?.textContent).toBe('shared');
    expect(a.querySelectorAll('span')).toHaveLength(1);
    expect(b.querySelectorAll('span')).toHaveLength(1);
    expect(shared.$elm$).toBeFalsy();
  });
});

describe('cloneVNodeTree', () => {
  it('copies vnodes deeply without the rendered element', () => {
    const child = h('b', null, 'x');
    const tree = h('div', { id: 'a' }, child);
    (tree as any).$elm$ = document.createElement('div');

    const clone = cloneVNodeTree(tree) as any;

    expect(clone).not.toBe(tree);
    expect(clone.$elm$).toBeNull();
    expect(clone.$children$[0]).not.toBe(child);
    expect(clone.$children$[0].$tag$).toBe('b');
    expect(clone.$attrs$).toBe(tree.$attrs$);
  });

  it('copies arrays and leaves non-vnodes alone', () => {
    const list = [h('a', null), 'text', 3];
    const clone = cloneVNodeTree(list);
    expect(clone).not.toBe(list);
    expect(clone[1]).toBe('text');
    expect(clone[2]).toBe(3);
    expect(cloneVNodeTree('plain')).toBe('plain');
  });
});
