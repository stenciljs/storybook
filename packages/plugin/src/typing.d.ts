declare var __STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__: any;
declare var __STORYBOOK_CUSTOM_ELEMENTS__: any;

// Stencil's runtime ships no type declarations for this entry. We only read
// `renderVdom` from it, feature-detected (see vdom-root.ts).
declare module '@stencil/core/internal/client' {
  export const renderVdom: ((hostRef: unknown, vnode: unknown) => void) | undefined;
}

interface ImportMeta {
  hot?: {
    on(event: string, cb: (...args: any[]) => void): void;
  };
  env: {
    VITEST?: boolean;
  };
}
