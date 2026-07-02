declare var __STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__: any;
declare var __STORYBOOK_CUSTOM_ELEMENTS__: any;

declare module 'virtual:stencil-docs' {
  import type { Package } from 'custom-elements-manifest';
  const docs: Package;
  export default docs;
}
