import { h } from '@stencil/core';
import { simulateDOMContentLoaded, simulatePageLoad } from 'storybook/preview-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderToCanvas } from './render';
import { TestLazy, TestProbe } from './test-utils';

vi.mock('storybook/preview-api', () => ({
  simulatePageLoad: vi.fn(),
  simulateDOMContentLoaded: vi.fn(),
}));

function context(storyFn: () => unknown, forceRemount: boolean) {
  return {
    storyFn,
    showMain: vi.fn(),
    showError: vi.fn(),
    forceRemount,
    storyContext: { component: undefined },
    name: 'Story',
    title: 'Component',
  } as any;
}

describe('renderToCanvas', () => {
  let canvas: HTMLElement;

  const renderStory = (storyFn: () => unknown, { forceRemount = false } = {}) => {
    const ctx = context(storyFn, forceRemount);
    return renderToCanvas(ctx, canvas).then((teardown) => ({ ctx, teardown }));
  };
  const probe = () => canvas.querySelector('test-probe') as TestProbe;

  beforeEach(() => {
    document.body.replaceChildren();
    canvas = document.createElement('div');
    canvas.id = 'storybook-root';
    document.body.appendChild(canvas);
    TestProbe.reset();
    vi.mocked(simulatePageLoad).mockClear();
    vi.mocked(simulateDOMContentLoaded).mockClear();
  });

  describe('vnode stories', () => {
    it('keeps the element when args change without forceRemount', async () => {
      await renderStory(() => h('test-probe', { label: 'one', count: 1 }), { forceRemount: true });
      const first = probe();

      await renderStory(() => h('test-probe', { label: 'two', count: 2 }));

      expect(probe()).toBe(first);
      expect(first.label).toBe('two');
      expect(first.count).toBe(2);
      expect(TestProbe.created).toBe(1);
      expect(TestProbe.connected).toBe(1);
      expect(TestProbe.disconnected).toBe(0);
    });

    it('only sets the props that changed', async () => {
      const config = { color: 'teal' };
      await renderStory(() => h('test-probe', { label: 'one', config }), { forceRemount: true });
      probe().propSets = [];

      await renderStory(() => h('test-probe', { label: 'two', config }));

      expect(probe().propSets).toEqual(['label']);
    });

    it('sets objects and arrays as properties, not attributes', async () => {
      const config = { color: 'teal', size: 'small' };
      const items = ['a', 'b'];
      await renderStory(() => h('test-probe', { config, items }), { forceRemount: true });

      const nextConfig = { color: 'tomato', size: 'large' };
      await renderStory(() => h('test-probe', { config: nextConfig, items }));

      expect(probe().config).toBe(nextConfig);
      expect(probe().items).toBe(items);
      expect(probe().hasAttribute('config')).toBe(false);
      expect(probe().hasAttribute('items')).toBe(false);
    });

    it('clears a prop when its arg is removed', async () => {
      await renderStory(() => h('test-probe', { label: 'one', disabled: true }), { forceRemount: true });
      const first = probe();

      await renderStory(() => h('test-probe', { label: 'one' }));

      expect(probe()).toBe(first);
      expect(first.disabled).toBeUndefined();
    });

    it('patches through wrapper markup from decorators and custom render functions', async () => {
      const story = (label: string) =>
        h('div', { class: 'decorator' }, h('test-probe', { label }, h('p', null, label)));
      await renderStory(() => story('one'), { forceRemount: true });
      const first = probe();

      await renderStory(() => story('two'));

      expect(probe()).toBe(first);
      expect(canvas.querySelector('p')?.textContent).toBe('two');
      expect(canvas.querySelectorAll('.decorator')).toHaveLength(1);
    });

    it('renders fragments (arrays of vnodes)', async () => {
      await renderStory(() => [h('test-probe', { label: 'a' }), h('test-probe', { label: 'b' })], {
        forceRemount: true,
      });
      const [a, b] = canvas.querySelectorAll('test-probe');

      await renderStory(() => [h('test-probe', { label: 'a2' }), h('test-probe', { label: 'b2' })]);

      const after = canvas.querySelectorAll('test-probe');
      expect(after[0]).toBe(a);
      expect(after[1]).toBe(b);
      expect((after[1] as TestProbe).label).toBe('b2');
    });

    it('remounts when forceRemount is true', async () => {
      await renderStory(() => h('test-probe', { label: 'one' }), { forceRemount: true });
      const first = probe();

      await renderStory(() => h('test-probe', { label: 'one' }), { forceRemount: true });

      expect(probe()).not.toBe(first);
      expect(canvas.querySelectorAll('test-probe')).toHaveLength(1);
      expect(TestProbe.disconnected).toBe(1);
    });

    it('treats the first render into a canvas as a mount even without forceRemount', async () => {
      await renderStory(() => h('test-probe', { label: 'one' }));
      expect(probe().label).toBe('one');
      expect(simulatePageLoad).toHaveBeenCalledTimes(1);
    });

    it('runs simulatePageLoad on mount only', async () => {
      await renderStory(() => h('test-probe', { label: 'one' }), { forceRemount: true });
      await renderStory(() => h('test-probe', { label: 'two' }));
      await renderStory(() => h('test-probe', { label: 'three' }));

      expect(simulatePageLoad).toHaveBeenCalledTimes(1);
    });

    it('returns a teardown that unmounts the story', async () => {
      const { teardown } = await renderStory(() => h('test-probe', { label: 'one' }), { forceRemount: true });

      teardown();

      expect(canvas.childNodes).toHaveLength(0);
      expect(TestProbe.disconnected).toBe(1);

      // the next render mounts from scratch
      await renderStory(() => h('test-probe', { label: 'two' }));
      expect(TestProbe.created).toBe(2);
    });

    it('remounts when something else replaced the canvas content', async () => {
      await renderStory(() => h('test-probe', { label: 'one' }), { forceRemount: true });
      canvas.replaceChildren();

      await renderStory(() => h('test-probe', { label: 'two' }));

      expect(probe().label).toBe('two');
      expect(canvas.children).toHaveLength(1);
    });

    it('keeps separate state per canvas', async () => {
      const other = document.createElement('div');
      document.body.appendChild(other);
      await renderStory(() => h('test-probe', { label: 'main' }), { forceRemount: true });
      await renderToCanvas(
        context(() => h('test-probe', { label: 'other' }), true),
        other,
      );
      const mainProbe = probe();
      const otherProbe = other.querySelector('test-probe');

      await renderStory(() => h('test-probe', { label: 'main2' }));

      expect(probe()).toBe(mainProbe);
      expect(other.querySelector('test-probe')).toBe(otherProbe);
      expect((otherProbe as TestProbe).label).toBe('other');
    });

    it('waits for componentOnReady before resolving', async () => {
      let resolved = false;
      const pending = renderStory(() => h('test-lazy', null), { forceRemount: true }).then(() => (resolved = true));

      await new Promise((r) => setTimeout(r, 10));
      expect(resolved).toBe(false);

      TestLazy.resolveReady?.();
      await pending;
      expect(resolved).toBe(true);
    });
  });

  describe('string stories', () => {
    it('renders HTML strings', async () => {
      await renderStory(() => '<test-probe label="x"></test-probe>', { forceRemount: true });
      expect(probe().getAttribute('label')).toBe('x');
      expect(simulatePageLoad).toHaveBeenCalledWith(canvas);
    });

    it('leaves the DOM alone when the string did not change', async () => {
      await renderStory(() => '<test-probe></test-probe>', { forceRemount: true });
      const first = probe();

      await renderStory(() => '<test-probe></test-probe>');

      expect(probe()).toBe(first);
    });

    it('replaces the DOM when the string changes', async () => {
      await renderStory(() => '<test-probe label="a"></test-probe>', { forceRemount: true });
      await renderStory(() => '<test-probe label="b"></test-probe>');

      expect(canvas.querySelectorAll('test-probe')).toHaveLength(1);
      expect(probe().getAttribute('label')).toBe('b');
    });
  });

  describe('DOM node stories', () => {
    it('keeps the node when the story returns the same one', async () => {
      const node = document.createElement('test-probe');
      await renderStory(() => node, { forceRemount: true });
      await renderStory(() => node);

      expect(canvas.firstChild).toBe(node);
      expect(TestProbe.connected).toBe(1);
      expect(simulateDOMContentLoaded).toHaveBeenCalledTimes(1);
    });

    it('swaps in a new node', async () => {
      await renderStory(() => document.createElement('test-probe'), { forceRemount: true });
      const next = document.createElement('test-probe');
      await renderStory(() => next);

      expect(canvas.childNodes).toHaveLength(1);
      expect(canvas.firstChild).toBe(next);
    });
  });

  it('clears the canvas when the story switches output kind', async () => {
    await renderStory(() => '<p>string</p>', { forceRemount: true });
    await renderStory(() => h('test-probe', null));

    expect(canvas.querySelector('p')).toBeNull();
    expect(canvas.querySelectorAll('test-probe')).toHaveLength(1);
  });

  it('shows an error when the story returns nothing', async () => {
    const { ctx } = await renderStory(() => undefined, { forceRemount: true });
    expect(ctx.showError).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('"Story"') }));
  });

  it('calls showMain on every render', async () => {
    const { ctx } = await renderStory(() => h('test-probe', null), { forceRemount: true });
    expect(ctx.showMain).toHaveBeenCalledTimes(1);
  });
});
