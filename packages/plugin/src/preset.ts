/**
 * we can't prefix the Node.js imports with `node:` because it will break
 * within Storybook due to its Vite setup.
 */
import { readFileSync, utimesSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join, resolve, sep } from 'path';
import { getComponentStyleDependencies, stencilBuildEvents } from '@stencil-community/unplugin-stencil';
import stencil from '@stencil-community/unplugin-stencil/vite';
import { fileURLToPath } from 'url';
import type { HmrContext, Plugin, ViteDevServer } from 'vite';
import { mergeConfig } from 'vite';
import { StorybookConfig } from './types';

const require = createRequire(import.meta.url);
const getAbsolutePath = <I extends string>(input: I): I => dirname(require.resolve(join(input, 'package.json'))) as any;

const _dirname = dirname(fileURLToPath(import.meta.url));

const renderer = join(_dirname, 'entry-preview.js');

const UNPLUGIN_STENCIL_NAME = '@stencil-community/unplugin-stencil';

export const core: StorybookConfig['core'] = {
  builder: join(getAbsolutePath('@storybook/builder-vite'), 'dist', 'index.js'),
  renderer,
};

export const viteFinal: StorybookConfig['viteFinal'] = async (defaultConfig, { configType }) => {
  const config = mergeConfig(defaultConfig, {
    build: {
      target: 'es2020',
    },
    plugins: [
      stencil({
        rootPath: defaultConfig.root,
      }),
    ],
  });
  if (configType === 'DEVELOPMENT') {
    return mergeConfig(config, {
      build: {
        rollupOptions: {
          external: ['@stencil/core'],
        },
      },
      // Don't let Vite watch this plugin's own `dist/`. `tsdown --watch`
      // rewrites those files during plugin development; if Vite picks the
      // change up it re-optimizes deps, bumping the React chunk hash and
      // leaving previously-imported chunks pointing at a torn-down React
      // (`useEffect` becomes null in <DocsContainer>).
      server: {
        watch: {
          ignored: [join(__dirname, '**')],
        },
      },
      plugins: [stencilPreviewReloadPlugin()],
    });
  }

  return config;
};

/**
 * Forces a full preview reload when a Stencil component changes.
 *
 * `customElements.define()` is permanent, so HMR can't swap the new class in —
 * the iframe must reload. We use a custom HMR event (instead of Vite's
 * `full-reload`) because Storybook's story-index watcher races us with its own
 * `vite-app.js` HMR update and cancels plain reloads.
 *
 * - Eager: the .tsx is in Vite's graph; our `transform` hook fires after
 *   unplugin-stencil and emits the reload.
 * - Lazy: the .tsx isn't imported, so we run unplugin-stencil ourselves, then
 *   reload once `@stencil-community/unplugin-stencil` reports the build
 *   finished (its `stencilBuildEvents` emitter, instead of polling dist/esm).
 * - Styles: `@stencil-community/unplugin-stencil` exposes a `style → component`
 *   map built from each component's `@Component` decorator (AST-parsed, covers
 *   `styleUrl`, `styleUrls` array, and `styleUrls` mode object). When a tracked
 *   style file changes we touch every dependent `.tsx` so the eager/lazy paths
 *   above pick up the rebuild.
 * - Global style: the same package resolves `stencil.config#globalStyle`; when
 *   it changes we touch every known component `.tsx`.
 */
function stencilPreviewReloadPlugin(): Plugin {
  let devServer: ViteDevServer | undefined;
  let lazyBuildPending = false;

  const sendReload = (server: ViteDevServer) => {
    server.ws.send({ type: 'custom', event: 'stencil:reload' });
  };

  // Match dist/esm module ids on both POSIX and Windows.
  const distEsmFragment = `${sep}dist${sep}esm${sep}`;

  const isComponentSource = (id: string): boolean =>
    id.endsWith('.tsx') &&
    !id.endsWith('.stories.tsx') &&
    !id.includes(`${sep}node_modules${sep}`) &&
    !id.includes(`${sep}.storybook${sep}`);

  // dist/esm lives outside Vite's watched root, so its module cache never
  // invalidates on its own. Drop it before reloading.
  const invalidateDistEsm = (server: ViteDevServer): void => {
    for (const cached of server.moduleGraph.idToModuleMap.values()) {
      if (cached.id && cached.id.includes(distEsmFragment) && cached.id.endsWith('.js')) {
        server.moduleGraph.invalidateModule(cached);
      }
    }
  };

  // Touch a file's mtime so unplugin-stencil recompiles it. The resulting
  // `change` event re-enters the watcher handler and rides the eager/lazy path.
  const touch = (file: string): void => {
    try {
      const now = new Date();
      utimesSync(file, now, now);
    } catch {
      // ignore: best-effort touch
    }
  };

  return {
    name: 'stencil-preview-reload',

    configureServer(server) {
      devServer = server;

      // When unplugin-stencil finishes a (project-wide) Stencil build, the
      // fresh dist/esm chunks are on disk but Vite still has the old versions
      // cached. If we kicked a lazy rebuild, invalidate + reload now.
      stencilBuildEvents.on('buildFinished', () => {
        if (!lazyBuildPending || !devServer) return;
        lazyBuildPending = false;
        invalidateDistEsm(devServer);
        sendReload(devServer);
      });

      server.watcher.on('change', async (file: string) => {
        // unplugin-stencil seeds this map at buildStart, so it's populated from
        // the first watcher event for eager, lazy, and globalStyle alike.
        const { byStyle, byComponent, globalStyle } = getComponentStyleDependencies();
        const resolved = resolve(file);

        // Global style: baked into every component, so touch every component
        // we know about and let the eager/lazy paths reload.
        if (globalStyle && resolved === globalStyle) {
          for (const componentId of byComponent.keys()) touch(componentId);
          return;
        }

        // Component-style change: re-route to every dependent .tsx. Each touch
        // produces a fresh `change` event that flows through the logic below.
        const dependents = byStyle.get(resolved);
        if (dependents && dependents.size > 0) {
          for (const componentId of dependents) touch(componentId);
          return;
        }

        if (!file.endsWith('.tsx') || file.endsWith('.stories.tsx')) return;

        const mod = server.moduleGraph.getModuleById(file);
        // Eager components are handled by the `transform` hook below.
        if (mod && mod.importers.size > 0) return;

        // Lazy: trigger Stencil's build manually. unplugin-stencil's transform
        // resolves before the build flushes to disk, so we set a flag and wait
        // for `stencilBuildEvents.buildFinished` (above) to do the reload.
        const stencilPlugin = server.config.plugins.find((p) => p.name === UNPLUGIN_STENCIL_NAME);
        if (!stencilPlugin || typeof stencilPlugin.transform !== 'function') return;

        lazyBuildPending = true;
        try {
          const code = readFileSync(file, 'utf-8');
          await (stencilPlugin.transform as any).call({ resolve: (): null => null }, code, file);
        } catch {
          lazyBuildPending = false;
        }
      });
    },

    // Always reload (never HMR) for component .tsx files. Eager modules still
    // need to flow through Vite so unplugin-stencil rebuilds dist.
    handleHotUpdate(ctx: HmrContext) {
      const { file, modules } = ctx;
      if (!file.endsWith('.tsx') || file.endsWith('.stories.tsx')) return;
      const mod = modules[0];
      if (mod && mod.importers?.size > 0) return;
      return [];
    },

    async transform(_code, id) {
      if (!devServer) return;
      const cleanId = id.split('?')[0];
      if (!isComponentSource(cleanId)) return;
      if (lazyBuildPending) return;
      sendReload(devServer);
    },
  };
}

export const previewAnnotations: StorybookConfig['previewAnnotations'] = async (input = [], options) => {
  const docsEnabled = Object.keys(await options.presets.apply('docs', {}, options)).length > 0;
  const result: string[] = [];

  return result
    .concat(input)
    .concat([renderer])
    .concat(docsEnabled ? [join(_dirname, 'entry-preview-docs.js')] : []);
};
