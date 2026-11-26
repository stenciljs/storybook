import type { Package } from 'custom-elements-manifest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setCustomElementsManifest } from '../framework-api';
import { extractArgTypesFromElements, isCssOnlyComponent } from './custom-elements';

const cem = (declaration: Record<string, unknown>, path = 'src/my-tag.css'): Package => ({
  schemaVersion: '2.1.0',
  modules: [
    {
      kind: 'javascript-module',
      path,
      declarations: [{ kind: 'class', customElement: true, name: 'MyTag', tagName: 'my-tag', ...declaration } as any],
    },
  ],
});

describe('extractArgTypesFromElements', () => {
  afterEach(() => vi.unstubAllGlobals());

  describe('slots', () => {
    it('keys them `slot:<name>` - the default slot as `slot:default` - with a text control', () => {
      const argTypes = extractArgTypesFromElements(
        'my-tag',
        cem({
          slots: [
            { name: '', description: "The badge's label." },
            { name: 'icon', description: 'An icon.' },
          ],
        }),
      );

      expect(argTypes?.['slot:default']).toEqual({
        name: 'default',
        description: "The badge's label.",
        control: { type: 'text' },
        table: { category: 'slots', type: { summary: 'string | VNode' } },
      });
      expect(argTypes?.['slot:icon']).toMatchObject({ name: 'icon', control: { type: 'text' } });
      expect(Object.keys(argTypes ?? {})).not.toContain('');
    });

    it("can't collide with a prop of the same name", () => {
      const argTypes = extractArgTypesFromElements(
        'my-tag',
        cem({
          members: [{ kind: 'field', name: 'label', type: { text: 'string' } }],
          slots: [{ name: 'label' }],
        }),
      );

      expect(argTypes?.label).toMatchObject({ table: { category: 'properties' } });
      expect(argTypes?.['slot:label']).toMatchObject({ table: { category: 'slots' } });
    });
  });

  it('keys parts `part:<name>`, docs-only', () => {
    const argTypes = extractArgTypesFromElements('my-tag', cem({ cssParts: [{ name: 'label' }] }));

    expect(argTypes?.['part:label']).toEqual({
      name: 'label',
      description: undefined,
      control: false,
      table: { category: 'parts' },
    });
  });

  describe('CSS custom properties', () => {
    it('gives them a text control, with their syntax and default in the table', () => {
      const argTypes = extractArgTypesFromElements(
        'my-tag',
        cem({ cssProperties: [{ name: '--badge-padding', syntax: '<length>', default: '4px' }] }),
      );

      expect(argTypes?.['--badge-padding']).toEqual({
        name: '--badge-padding',
        description: undefined,
        control: { type: 'text' },
        table: { category: 'styles', type: { summary: '<length>' }, defaultValue: { summary: '4px' } },
      });
    });

    it('gives a `<color>` one a colour picker', () => {
      const argTypes = extractArgTypesFromElements(
        'my-tag',
        cem({ cssProperties: [{ name: '--badge-color', syntax: '<color>' }] }),
      );

      expect(argTypes?.['--badge-color']).toMatchObject({ control: { type: 'color' } });
    });

    it('gives one whose default is a concrete colour a colour picker', () => {
      vi.stubGlobal('CSS', { supports: (_: string, value: string) => value === 'rebeccapurple' });
      const argTypes = extractArgTypesFromElements(
        'my-tag',
        cem({
          cssProperties: [
            { name: '--a', default: 'rebeccapurple' },
            { name: '--b', default: '4px' },
          ],
        }),
      );

      expect(argTypes?.['--a']).toMatchObject({ control: { type: 'color' } });
      expect(argTypes?.['--b']).toMatchObject({ control: { type: 'text' } });
    });

    it("doesn't give a colour picker to a default it can't represent", () => {
      // a browser accepts all of these as `color` values
      vi.stubGlobal('CSS', { supports: () => true });
      const argTypes = extractArgTypesFromElements(
        'my-tag',
        cem({
          cssProperties: [
            { name: '--a', default: 'var(--brand)' },
            { name: '--b', default: 'inherit' },
            { name: '--c', default: 'currentColor' },
          ],
        }),
      );

      for (const name of ['--a', '--b', '--c']) {
        expect(argTypes?.[name]).toMatchObject({ control: { type: 'text' } });
      }
    });
  });
});

describe('isCssOnlyComponent', () => {
  afterEach(() => setCustomElementsManifest(undefined as unknown as Package));

  it("is true for a tag declared in a `.css` module, false for one in a `.tsx` module or one that isn't declared", () => {
    setCustomElementsManifest({
      schemaVersion: '2.1.0',
      modules: [...cem({}).modules, ...cem({ tagName: 'my-cmp' }, 'src/my-cmp.tsx').modules],
    });

    expect(isCssOnlyComponent('my-tag')).toBe(true);
    expect(isCssOnlyComponent('my-cmp')).toBe(false);
    expect(isCssOnlyComponent('my-unknown')).toBe(false);
  });

  it('is false with no CEM', () => {
    expect(isCssOnlyComponent('my-tag')).toBe(false);
  });
});
