declare var __STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__: any;
declare var __STORYBOOK_CUSTOM_ELEMENTS__: any;

interface ImportMeta {
  hot?: {
    on(event: string, cb: (...args: any[]) => void): void;
  };
}

declare module 'virtual:stencil-docs' {
  import type { Package } from 'custom-elements-manifest';
  const docs: Package;
  export default docs;
}
