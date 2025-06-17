import { JSX as StencilJSX, VNode } from '@stencil/core';
import { StorybookConfigVite } from '@storybook/builder-vite';
import type {
  AnnotatedStoryFn,
  Args,
  ComponentAnnotations,
  DecoratorFunction,
  StoryContext as GenericStoryContext,
  LoaderFunction,
  ProjectAnnotations,
  StoryAnnotations,
  StorybookConfig as StorybookConfigBase,
  StrictArgs,
  WebRenderer,
} from 'storybook/internal/types';

interface DevJSX {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  stack?: string;
}

type JSXChildren =
  | string
  | number
  | boolean
  | null
  | undefined
  | Function
  | RegExp
  | JSXChildren[]
  | Promise<JSXChildren>
  | VNode;

type ComponentChildren<PROPS> = PROPS extends {
  children: any;
}
  ? never
  : {
      children?: JSXChildren;
    };
type PublicProps<PROPS> = (PROPS extends Record<any, any>
  ? Omit<PROPS, `${string}$`>
  : unknown extends PROPS
    ? {}
    : PROPS) &
  ComponentChildren<PROPS>;

type FunctionComponent<P = unknown> = {
  renderFn(props: P, key: string | null, flags: number, dev?: DevJSX): VNode;
}['renderFn'];
type Component<PROPS = unknown> = FunctionComponent<PublicProps<PROPS>>;

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
export type Meta<TArgs = Args> = ComponentAnnotations<StencilRenderer<TArgs>, TArgs>;

/**
 * Story function that represents a CSFv2 component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/formats/component-story-format/#named-story-exports)
 */
export type StoryFn<TArgs = Args> = AnnotatedStoryFn<StencilRenderer<TArgs>, TArgs>;

/**
 * Story function that represents a CSFv3 component example.
 *
 * @see [Named Story exports](https://storybook.js.org/docs/formats/component-story-format/#named-story-exports)
 */
export type StoryObj<TArgs = Args> = StoryAnnotations<StencilRenderer<TArgs>, TArgs>;

export type Decorator<TArgs = StrictArgs> = DecoratorFunction<StencilRenderer<TArgs>, TArgs>;
export type Loader<TArgs = StrictArgs> = LoaderFunction<StencilRenderer<TArgs>, TArgs>;
export type StoryContext<TArgs = StrictArgs> = GenericStoryContext<StencilRenderer<TArgs>, TArgs>;

export type StorybookConfig = Omit<StorybookConfigBase, 'framework'> & {
  framework: '@stencil/storybook-plugin' | { name: '@stencil/storybook-plugin' };
} & StorybookConfigVite;

/**
 * Extend the JSX namespace to include StencilJSX.IntrinsicElements, StencilJSX.Element, and StencilJSX.ElementClass.
 * This is necessary to allow the use of Stencil components in Storybook.
 * Without we get are getting type errors.
 */
type StencilIntrinsic = StencilJSX.IntrinsicElements;
type StencilElement = StencilJSX.Element;

declare global {
  namespace JSX {
    interface IntrinsicElements extends StencilIntrinsic {}
    interface Element extends StencilElement {}
    interface ElementClass {}
  }
}
