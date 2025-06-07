import { SourceType } from 'storybook/internal/docs-tools';
import type { DecoratorFunction, StoryContext } from 'storybook/internal/types';

import { sourceDecorator } from './docs/sourceDecorator';
import type { StencilRenderer } from './types';

export const decorators: DecoratorFunction<StencilRenderer<unknown>>[] = [sourceDecorator];

export const parameters = {
  docs: {
    story: { inline: true },
    code: undefined as unknown,
    source: {
      type: SourceType.DYNAMIC,
      language: 'jsx', // Using JSX as the language for syntax highlighting

      // see https://storybook.js.org/docs/api/doc-blocks/doc-block-source#transform
      transform: async (source: string, context: StoryContext<StencilRenderer<unknown>>) => {
        const prettier = await import('prettier/standalone');
        const prettierPluginBabel = await import('prettier/plugins/babel');
        const prettierPluginEstree = await import('prettier/plugins/estree');

        const isSourceCode = context?.parameters.docs?.source?.type === SourceType.CODE;

        // we wrap the source code in a const x = to make it valid for babel
        const srcPrefix = isSourceCode ? 'const x = ' : ';';
        const sourceToFormat = srcPrefix + source;

        const formatted = await prettier.format(sourceToFormat, {
          parser: 'babel-ts',
          plugins: [prettierPluginBabel, prettierPluginEstree.default],
          semi: false,
        });

        // we remove the prefix we added to make babel happy
        return formatted.slice(srcPrefix.length);
      },
    },
  },
};
