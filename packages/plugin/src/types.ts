import { JSX } from '@stencil/core';
import { StorybookConfigVite } from '@storybook/builder-vite';
import { WebRenderer } from '@storybook/types';
export type { Args, ArgTypes, Parameters, StrictArgs } from '@storybook/types';
import type {
  AnnotatedStoryFn,
  Args,
  ComponentAnnotations,
  StoryAnnotations,
  DecoratorFunction,
  LoaderFunction,
  StoryContext as GenericStoryContext,
  StrictArgs,
  ProjectAnnotations,
  StorybookConfig as StorybookConfigBase,
} from '@storybook/types';

interface DevJSX {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  stack?: string;
}

type JSXChildren = string | number | boolean | null | undefined | Function | RegExp | JSXChildren[] | Promise<JSXChildren> | JSXNode;
interface JSXNode<T extends string | FunctionComponent | unknown = unknown> {
  type: T;
  props: T extends FunctionComponent<infer P> ? P : Record<any, unknown>;
  children: JSXChildren | null;
  key: string | null;
  dev?: DevJSX;
}
type ComponentChildren<PROPS> = PROPS extends {
  children: any;
} ? never : {
  children?: JSXChildren;
}
type PublicProps<PROPS> = (PROPS extends Record<any, any> ? Omit<PROPS, `${string}$`> : unknown extends PROPS ? {} : PROPS) & ComponentChildren<PROPS>;

type JSXOutput = JSXNode | string | number | boolean | null | undefined | JSXOutput[];
type FunctionComponent<P = unknown> = {
  renderFn(props: P, key: string | null, flags: number, dev?: DevJSX): JSXOutput;
}['renderFn']
type Component<PROPS = unknown> = FunctionComponent<PublicProps<PROPS>>

export interface StencilRenderer<T> extends WebRenderer {
  component: Component<T> | any;
  storyResult: ReturnType<Component<T>>;
  args: T;
}

export type Preview = ProjectAnnotations<StencilRenderer<unknown>>;
/**
 * Metadata to configure the stories for a component.
 *
 * @see [Default export](https://storybook.js.org/docs/formats/component-story-format/#default-export)
 */
export type Meta<TArgs = Args> = ComponentAnnotations<
  StencilRenderer<TArgs>,
  TArgs
>;

/**
 * Story function that represents a CSFv2 component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/formats/component-story-format/#named-story-exports)
 */
export type StoryFn<TArgs = Args> = AnnotatedStoryFn<
  StencilRenderer<TArgs>,
  TArgs
>;

/**
 * Story function that represents a CSFv3 component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/formats/component-story-format/#named-story-exports)
 */
export type StoryObj<TArgs = Args> = StoryAnnotations<
  StencilRenderer<TArgs>,
  TArgs
>;

export type Decorator<TArgs = StrictArgs> = DecoratorFunction<
  StencilRenderer<TArgs>,
  TArgs
>;
export type Loader<TArgs = StrictArgs> = LoaderFunction<
  StencilRenderer<TArgs>,
  TArgs
>;
export type StoryContext<TArgs = StrictArgs> = GenericStoryContext<
  StencilRenderer<TArgs>,
  TArgs
>;

export type StorybookConfig = Omit<StorybookConfigBase, 'framework'> & {
  framework: '@stencil/storybook-plugin' | { name: '@stencil/storybook-plugin' };
} & StorybookConfigVite;
