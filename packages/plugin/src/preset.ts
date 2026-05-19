/**
 * we can't prefix the Node.js imports with `node:` because it will break
 * within Storybook due to its Vite setup.
 */
import { createRequire } from 'module';
import { dirname, join } from 'path';
import stencil from 'unplugin-stencil/vite';
import { fileURLToPath } from 'url';
import { mergeConfig } from 'vite';
import { StorybookConfig } from './types';

const require = createRequire(import.meta.url);
const getAbsolutePath = <I extends string>(input: I): I => dirname(require.resolve(join(input, 'package.json'))) as any;

const __dirname = dirname(fileURLToPath(import.meta.url));

const renderer = join(__dirname, 'entry-preview.js');

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
 * - Lazy: the .tsx isn't imported, so we run unplugin-stencil ourselves, wait
 *   for `dist/esm/*.entry.js` to be rewritten (Stencil's build is async), then
 *   reload.
 */
function stencilPreviewReloadPlugin() {
  let devServer: any;
  let lazyBuildPending = false;

  const sendReload = (server: any) => {
    server.ws.send({ type: 'custom', event: 'stencil:reload' });
  };

  return {
    name: 'stencil-preview-reload',

    configureServer(server: any) {
      devServer = server;

      server.watcher.on('change', async (file: string) => {
        if (!file.endsWith('.tsx') || file.endsWith('.stories.tsx')) return;

        const mod = server.moduleGraph.getModuleById(file);
        // Eager components are handled by the `transform` hook below.
        if (mod && mod.importers.size > 0) return;

        // Lazy: trigger Stencil's build manually, then poll mtimes since
        // unplugin-stencil's transform resolves before the build flushes to disk.
        const stencilPlugin = server.config.plugins.find((p: any) => p.name === 'unplugin-stencil');
        if (!stencilPlugin?.transform) return;

        const { readFileSync, statSync, existsSync, readdirSync } = await import('fs');
        const distDir = join(server.config.root, 'dist', 'esm');
        const snapshotMtimes = (): Record<string, number> => {
          if (!existsSync(distDir)) return {};
          const out: Record<string, number> = {};
          for (const f of readdirSync(distDir)) {
            if (!f.endsWith('.entry.js')) continue;
            try {
              out[f] = statSync(join(distDir, f)).mtimeMs;
            } catch {
              // file may be removed mid-scan
            }
          }
          return out;
        };
        const before = snapshotMtimes();

        lazyBuildPending = true;
        try {
          const code = readFileSync(file, 'utf-8');
          await stencilPlugin.transform.call({ resolve: (): null => null }, code, file);
        } catch {
          lazyBuildPending = false;
          return;
        }

        const deadline = Date.now() + 5000;
        const tick = (): void => {
          if (!lazyBuildPending) return;
          const after = snapshotMtimes();
          const changed = Object.keys(after).some((f) => !(f in before) || after[f] > before[f]);
          if (changed) {
            lazyBuildPending = false;
            // dist/esm lives outside Vite's watched root, so its module cache
            // never invalidates on its own. Drop it before reloading.
            for (const cached of server.moduleGraph.idToModuleMap.values()) {
              if (cached.id && cached.id.includes('/dist/esm/') && cached.id.endsWith('.js')) {
                server.moduleGraph.invalidateModule(cached);
              }
            }
            sendReload(server);
            return;
          }
          if (Date.now() > deadline) {
            lazyBuildPending = false;
            return;
          }
          setTimeout(tick, 50);
        };
        tick();
      });
    },

    // Always reload (never HMR) for component .tsx files. Eager modules still
    // need to flow through Vite so unplugin-stencil rebuilds dist.
    handleHotUpdate({ file, modules }: { file: string; server: any; modules: any[] }): any[] | undefined {
      if (!file.endsWith('.tsx') || file.endsWith('.stories.tsx')) return;
      const mod = modules[0];
      if (mod && mod.importers?.size > 0) return;
      return [];
    },

    async transform(_code: string, id: string) {
      if (!devServer) return;
      if (!id.endsWith('.tsx') || id.endsWith('.stories.tsx')) return;
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
    .concat([renderer, join(__dirname, 'entry-preview-argtypes.js')])
    .concat(docsEnabled ? [join(__dirname, 'entry-preview-docs.js')] : []);
};
