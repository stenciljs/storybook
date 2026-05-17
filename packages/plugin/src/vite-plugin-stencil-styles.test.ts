import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, normalize, resolve } from 'path';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { extractStyleUrls, stencilStylesPlugin } from './vite-plugin-stencil-styles';

describe('extractStyleUrls', () => {
  it('extracts a single styleUrl', () => {
    const src = `@Component({ tag: 'x-y', styleUrl: 'x-y.css' })`;
    expect(extractStyleUrls(src)).toEqual(['x-y.css']);
  });

  it('supports double, single, and template-literal quotes', () => {
    expect(extractStyleUrls(`styleUrl: "a.css"`)).toEqual(['a.css']);
    expect(extractStyleUrls(`styleUrl: 'b.css'`)).toEqual(['b.css']);
    expect(extractStyleUrls(`styleUrl: \`c.css\``)).toEqual(['c.css']);
  });

  it('extracts a styleUrls array', () => {
    const src = `@Component({ tag: 'x-y', styleUrls: ['a.scss', 'b.scss'] })`;
    expect(extractStyleUrls(src)).toEqual(['a.scss', 'b.scss']);
  });

  it('extracts a styleUrls array spread across multiple lines', () => {
    const src = `@Component({
      tag: 'x-y',
      styleUrls: [
        'a.scss',
        'b.scss',
      ],
    })`;
    expect(extractStyleUrls(src)).toEqual(['a.scss', 'b.scss']);
  });

  it('extracts mode-based styleUrls object', () => {
    const src = `@Component({
      tag: 'x-y',
      styleUrls: {
        ios: 'x-y.ios.scss',
        md: 'x-y.md.scss',
      },
    })`;
    expect(extractStyleUrls(src)).toEqual(['x-y.ios.scss', 'x-y.md.scss']);
  });

  it('returns empty array when no style references present', () => {
    expect(extractStyleUrls(`@Component({ tag: 'x-y' })`)).toEqual([]);
    expect(extractStyleUrls(``)).toEqual([]);
  });

  it('does not match unrelated property names', () => {
    expect(extractStyleUrls(`myStyleUrl: 'oops.css'`)).toEqual([]);
  });
});

describe('stencilStylesPlugin', () => {
  let tmpDir: string;
  let componentPath: string;
  let stylePath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'stencil-styles-test-'));
    mkdirSync(join(tmpDir, 'src', 'components', 'my-thing'), { recursive: true });
    componentPath = join(tmpDir, 'src', 'components', 'my-thing', 'my-thing.tsx');
    stylePath = join(tmpDir, 'src', 'components', 'my-thing', 'my-thing.scss');
    writeFileSync(
      componentPath,
      `import { Component } from '@stencil/core';\n@Component({ tag: 'my-thing', styleUrl: 'my-thing.scss' })\nexport class MyThing {}\n`,
    );
    writeFileSync(stylePath, `:host { display: block; }\n`);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function getPlugin() {
    const plugin = stencilStylesPlugin();
    // call() to bind a minimal `this` context that load/handleHotUpdate don't actually use
    const load = (id: string) => (plugin.load as any).call({}, id);
    const handleHotUpdate = (ctx: any) => (plugin.handleHotUpdate as any).call({}, ctx);
    return { plugin, load, handleHotUpdate };
  }

  it('skips files that are not .ts/.tsx component sources', () => {
    const { load } = getPlugin();
    expect(load(join(tmpDir, 'foo.css'))).toBeNull();
    expect(load(join(tmpDir, 'foo.stories.tsx'))).toBeNull();
    expect(load(join(tmpDir, 'node_modules', 'pkg', 'index.ts'))).toBeNull();
    expect(load(join(tmpDir, '.storybook', 'preview.ts'))).toBeNull();
  });

  it('silently ignores virtual / non-existent modules', () => {
    const { load } = getPlugin();
    expect(() => load(join(tmpDir, 'does-not-exist.ts'))).not.toThrow();
  });

  it('triggers full-reload + invalidation when a tracked style changes', () => {
    const { load, handleHotUpdate } = getPlugin();
    load(componentPath);

    const invalidateModule = vi.fn();
    const send = vi.fn();
    const moduleStub = {};
    const server = {
      moduleGraph: {
        getModuleById: vi.fn().mockReturnValue(moduleStub),
        invalidateModule,
      },
      ws: { send },
    };

    const result = handleHotUpdate({ file: stylePath, server });

    expect(result).toEqual([]);
    expect(server.moduleGraph.getModuleById).toHaveBeenCalledWith(normalize(componentPath));
    expect(invalidateModule).toHaveBeenCalledWith(moduleStub);
    expect(send).toHaveBeenCalledWith({ type: 'full-reload', path: '*' });
  });

  it('returns undefined for style files not tracked by any component', () => {
    const { handleHotUpdate } = getPlugin();
    const send = vi.fn();
    const server = {
      moduleGraph: { getModuleById: vi.fn(), invalidateModule: vi.fn() },
      ws: { send },
    };
    const result = handleHotUpdate({ file: join(tmpDir, 'unknown.scss'), server });
    expect(result).toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });

  it('strips query strings from module ids', () => {
    const { load, handleHotUpdate } = getPlugin();
    load(`${componentPath}?used&lang.tsx`);

    const send = vi.fn();
    const server = {
      moduleGraph: { getModuleById: vi.fn().mockReturnValue({}), invalidateModule: vi.fn() },
      ws: { send },
    };
    handleHotUpdate({ file: stylePath, server });
    expect(send).toHaveBeenCalledWith({ type: 'full-reload', path: '*' });
  });

  it('tracks multiple components that share the same style file', () => {
    const otherDir = join(tmpDir, 'src', 'components', 'other');
    mkdirSync(otherDir, { recursive: true });
    const otherComponent = join(otherDir, 'other.tsx');
    // shared.scss is two levels up from `other/other.tsx`
    const sharedRel = '../my-thing/my-thing.scss';
    writeFileSync(
      otherComponent,
      `import { Component } from '@stencil/core';\n@Component({ tag: 'other', styleUrl: '${sharedRel}' })\nexport class Other {}\n`,
    );

    const { load, handleHotUpdate } = getPlugin();
    load(componentPath);
    load(otherComponent);

    const touched: string[] = [];
    const server = {
      moduleGraph: {
        getModuleById: (id: string) => {
          touched.push(id);
          return {};
        },
        invalidateModule: vi.fn(),
      },
      ws: { send: vi.fn() },
    };

    handleHotUpdate({ file: stylePath, server });
    expect(touched.sort()).toEqual([normalize(componentPath), normalize(otherComponent)].sort());
  });

  it('resolves style paths relative to the component directory', () => {
    const { load, handleHotUpdate } = getPlugin();
    writeFileSync(
      componentPath,
      `@Component({ tag: 'my-thing', styleUrl: './my-thing.scss' })\nexport class MyThing {}\n`,
    );
    load(componentPath);

    const send = vi.fn();
    const server = {
      moduleGraph: { getModuleById: vi.fn().mockReturnValue({}), invalidateModule: vi.fn() },
      ws: { send },
    };
    handleHotUpdate({ file: resolve(stylePath), server });
    expect(send).toHaveBeenCalledWith({ type: 'full-reload', path: '*' });
  });
});
