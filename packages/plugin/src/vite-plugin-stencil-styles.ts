/**
 * Vite plugin to watch for style file changes and reload dependent Stencil components.
 *
 * Problem: When a Stencil component uses `styleUrl: './component.scss'`, and the style file changes,
 * Vite doesn't know about this dependency, so the component doesn't reload with the new styles.
 *
 * Solution:
 * 1. Tracks which components depend on which style files by reading source code in `load()`
 * 2. When a style file changes, "touches" the component file (updates mtime) so unplugin-stencil
 *    re-runs its compiler with the updated styles
 * 3. Invalidates the component module and triggers a full page reload
 */
import { readFileSync, utimesSync } from 'fs';
import { resolve, dirname, normalize } from 'path';
import type { Plugin } from 'vite';

/**
 * Extracts style file paths from a Stencil component's @Component decorator.
 * Supports:
 *   - `styleUrl: 'file.css'`
 *   - `styleUrls: ['a.css', 'b.css']`
 *   - `styleUrls: { ios: 'a.ios.css', md: 'a.md.css' }`
 */
export function extractStyleUrls(sourceCode: string): string[] {
  const styleFiles: string[] = [];

  // Singular: styleUrl: 'file.css'
  // Note: requires the singular form explicitly so we don't false-match `styleUrls:` when its value
  // happens to start with a string (would only happen with malformed code anyway).
  const singularMatch = sourceCode.match(/\bstyleUrl\s*:\s*['"`]([^'"`]+)['"`]/);
  if (singularMatch) {
    styleFiles.push(singularMatch[1]);
  }

  // Array: styleUrls: ['a.css', 'b.css']
  const arrayMatch = sourceCode.match(/\bstyleUrls\s*:\s*\[([\s\S]*?)\]/);
  if (arrayMatch) {
    const urls = arrayMatch[1].match(/['"`]([^'"`]+)['"`]/g);
    if (urls) {
      styleFiles.push(...urls.map((url) => url.slice(1, -1)));
    }
  }

  // Object (mode-based): styleUrls: { ios: 'a.ios.css', md: 'a.md.css' }
  const objectMatch = sourceCode.match(/\bstyleUrls\s*:\s*\{([\s\S]*?)\}/);
  if (objectMatch) {
    const urls = objectMatch[1].match(/['"`]([^'"`]+)['"`]/g);
    if (urls) {
      styleFiles.push(...urls.map((url) => url.slice(1, -1)));
    }
  }

  return styleFiles;
}

function shouldSkip(cleanId: string): boolean {
  return (
    (!cleanId.endsWith('.tsx') && !cleanId.endsWith('.ts')) ||
    cleanId.includes('.stories.') ||
    cleanId.includes('.storybook') ||
    cleanId.includes('node_modules')
  );
}

export function stencilStylesPlugin(): Plugin {
  // Map of style file paths to the component files that depend on them
  const styleDependencies = new Map<string, Set<string>>();

  return {
    name: 'vite-plugin-stencil-styles',
    enforce: 'pre',

    load(id) {
      const cleanId = id.split('?')[0];
      if (shouldSkip(cleanId)) return null;

      let sourceCode: string;
      try {
        sourceCode = readFileSync(cleanId, 'utf-8');
      } catch {
        // File doesn't exist on disk (likely a virtual module), skip it
        return null;
      }

      const styleFiles = extractStyleUrls(sourceCode);
      if (styleFiles.length === 0) return null;

      const componentDir = dirname(cleanId);
      styleFiles.forEach((styleFile) => {
        const absoluteStylePath = normalize(resolve(componentDir, styleFile));
        let components = styleDependencies.get(absoluteStylePath);
        if (!components) {
          components = new Set();
          styleDependencies.set(absoluteStylePath, components);
        }
        components.add(cleanId);
      });

      return null;
    },

    handleHotUpdate({ file, server }) {
      const normalizedFile = normalize(file);
      const affectedComponents = styleDependencies.get(normalizedFile);
      if (!affectedComponents || affectedComponents.size === 0) return undefined;

      // Touch component files so unplugin-stencil re-compiles them with the updated styles
      const now = new Date();
      affectedComponents.forEach((componentId) => {
        try {
          utimesSync(componentId, now, now);
        } catch (error) {
          console.error(`[vite-plugin-stencil-styles] Failed to touch ${componentId}:`, error);
        }
        const module = server.moduleGraph.getModuleById(componentId);
        if (module) {
          server.moduleGraph.invalidateModule(module);
        }
      });

      // Full page reload — HMR can't swap inlined CSS strings inside the compiled component
      server.ws.send({ type: 'full-reload', path: '*' });
      return [];
    },
  };
}
