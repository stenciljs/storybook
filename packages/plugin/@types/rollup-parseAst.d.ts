/**
 * Extra type definitions for rollup/parseAst in cases the Rollup version between
 * `@stencil/storybook-plugin` and `unplugin-stencil` is different. This may cause
 * the following type error:
 *
 * ```
 * [ ERROR ]  TypeScript: node_modules/vite/dist/node/index.d.ts:5:41
 *          Cannot find module 'rollup/parseAst' or its corresponding type
 *          declarations.
 *
 *     L4:  export { rollup as Rollup };
 *     L5:  export { parseAst, parseAstAsync } from 'rollup/parseAst';
 *     L6:  import * as http from 'node:http';
 * ```
 *
 * This file is a workaround to make sure the type definitions are available when
 * importing `rollup/parseAst` in `unplugin-stencil`.
 */
declare module 'rollup/parseAst' {
  export function parseAst(code: string, options?: any): any;
  export function parseAstAsync(code: string, options?: any): Promise<any>;
}
