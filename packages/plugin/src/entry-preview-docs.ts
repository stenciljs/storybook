import { SourceType } from 'storybook/internal/docs-tools';
import type { DecoratorFunction, Parameters } from 'storybook/internal/types';
import { sourceDecorator } from './docs';
import type { StencilRenderer } from './types';

export const decorators: DecoratorFunction<StencilRenderer<unknown>>[] = [sourceDecorator];

export const parameters: Parameters = {
  docs: {
    story: { inline: true },
    source: {
      type: SourceType.DYNAMIC,
      language: 'html',
    },
  },
};
