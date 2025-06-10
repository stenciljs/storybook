import { SourceType } from 'storybook/internal/docs-tools';
import { emitTransformCode, useEffect } from 'storybook/internal/preview-api';
import type { AnnotatedStoryFn, Args, DecoratorFunction } from 'storybook/internal/types';
import type { StencilRenderer } from '../types';
import { renderHTML } from './render-html';

type StoryFn<TArgs = Args> = AnnotatedStoryFn<StencilRenderer<unknown>, TArgs>;

const skip = (context: Parameters<DecoratorFunction<StencilRenderer<unknown>>>[1]) => {
  const sourceParams = context?.parameters.docs?.source;
  const isArgsStory = context?.parameters.__isArgsStory;

  if (sourceParams.type === SourceType.DYNAMIC) return false;

  return !isArgsStory || sourceParams?.code || sourceParams?.type === SourceType.CODE;
};

export const sourceDecorator: DecoratorFunction<StencilRenderer<unknown>> = (storyFn, context) => {
  const story = storyFn();

  useEffect(() => {
    const renderedForSource = context?.parameters.docs?.source?.excludeDecorators
      ? (context.originalStoryFn as StoryFn)(context.args, context)
      : story;

    if (skip(context)) return;

    switch (context.parameters.docs.source.language) {
      case 'html': {
        const source = renderHTML(renderedForSource);
        emitTransformCode(source, context);
      }
    }
  });

  return story;
};
