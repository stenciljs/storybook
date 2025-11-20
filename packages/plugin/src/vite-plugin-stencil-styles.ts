/**
 * Vite plugin to watch for style file changes and reload dependent Stencil components.
 *
 * Problem: When a Stencil component uses `styleUrl: './component.scss'`, and the style file changes,
 * Vite doesn't know about this dependency, so the component doesn't reload with the new styles.
 *
 * Solution: This plugin:
 * 1. Tracks which components depend on which style files by reading source code
 * 2. When a style file changes, "touches" the component file (updates mtime)
 * 3. Forces unplugin-stencil to recompile the component with the updated styles
 * 4. Triggers a full page reload to show the changes
 */
import { readFileSync, utimesSync } from 'fs';
import { resolve, dirname, normalize } from 'path';
import type { Plugin, ViteDevServer } from 'vite';

/**
 * Extracts style file paths from a Stencil component's @Component decorator.
 * Supports both `styleUrl` and `styleUrls` properties.
 */
function extractStyleUrls(sourceCode: string): string[] {
  const styleFiles: string[] = [];

  // Match single styleUrl: 'file.css'
  const styleUrlMatch = sourceCode.match(/styleUrls?:\s*['"`]([^'"`]+)['"`]/);
  if (styleUrlMatch) {
    styleFiles.push(styleUrlMatch[1]);
  }

  // Match array styleUrls: ['file1.css', 'file2.css']
  const styleUrlsArrayMatch = sourceCode.match(/styleUrls:\s*\[([^\]]+)\]/);
  if (styleUrlsArrayMatch) {
    const urls = styleUrlsArrayMatch[1].match(/['"`]([^'"`]+)['"`]/g);
    if (urls) {
      styleFiles.push(...urls.map(url => url.replace(/['"`]/g, '')));
    }
  }

  return styleFiles;
}

export function stencilStylesPlugin(): Plugin {
  // Map of style file paths to the component files that depend on them
  const styleDependencies = new Map<string, Set<string>>();
  let server: ViteDevServer | undefined;

  return {
    name: 'vite-plugin-stencil-styles',
    enforce: 'pre',

    configureServer(_server) {
      server = _server;
    },

    load(id) {
      const cleanId = id.split('?')[0];

      // Skip non-component files
      if (
        (!cleanId.endsWith('.tsx') && !cleanId.endsWith('.ts')) ||
        cleanId.includes('.stories.') ||
        cleanId.includes('.storybook') ||
        cleanId.includes('node_modules')
      ) {
        return null;
      }

      try {
        const sourceCode = readFileSync(cleanId, 'utf-8');

        // Extract style files from @Component decorator
        const styleFiles = extractStyleUrls(sourceCode);

        if (styleFiles.length > 0) {
          const componentDir = dirname(cleanId);

          styleFiles.forEach(styleFile => {
            const absoluteStylePath = normalize(resolve(componentDir, styleFile));

            if (!styleDependencies.has(absoluteStylePath)) {
              styleDependencies.set(absoluteStylePath, new Set());
            }
            styleDependencies.get(absoluteStylePath)!.add(cleanId);
          });
        }
      } catch {
        // File doesn't exist on disk (likely a virtual module), skip it
      }

      return null;
    },

    handleHotUpdate({ file, server }) {
      const normalizedFile = normalize(file);
      const affectedComponents = styleDependencies.get(normalizedFile);

      if (!affectedComponents || affectedComponents.size === 0) {
        return undefined;
      }

      // Touch component files to force unplugin-stencil to recompile with updated styles
      const now = new Date();
      affectedComponents.forEach(componentId => {
        try {
          utimesSync(componentId, now, now);
        } catch (error) {
          console.error(`[vite-plugin-stencil-styles] Failed to touch ${componentId}:`, error);
        }

        // Invalidate the module in Vite's module graph
        const module = server.moduleGraph.getModuleById(componentId);
        if (module) {
          server.moduleGraph.invalidateModule(module);
        }
      });

      // Trigger full page reload (HMR won't work since CSS is inlined)
      server.ws.send({
        type: 'full-reload',
        path: '*',
      });

      return [];
    },
  };
}
