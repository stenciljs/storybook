import { global } from '@storybook/global';
import type { Package } from 'custom-elements-manifest';

export function isValidComponent(tagName: string) {
  if (!tagName) {
    return false;
  }
  if (typeof tagName === 'string') {
    return true;
  }
  throw new Error('Provided component needs to be a string. e.g. component: "my-element"');
}

export function isValidMetaData(cem: unknown): cem is Package {
  if (!cem) {
    return false;
  }
  const candidate = cem as Package;
  if (candidate.modules && Array.isArray(candidate.modules)) {
    return true;
  }
  throw new Error(
    'Invalid Custom Elements Manifest. Ensure @stencil/unplugin is configured and docs are enabled in your Storybook preset.',
  );
}

/** @param customElements `any` for now as spec is not super stable yet */
export function setCustomElements(customElements: any) {
  global.__STORYBOOK_CUSTOM_ELEMENTS__ = customElements;
}

export function setCustomElementsManifest(cem: Package) {
  global.__STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__ = cem;
}

export function getCustomElements(): Package | undefined {
  return global.__STORYBOOK_CUSTOM_ELEMENTS__ ?? global.__STORYBOOK_CUSTOM_ELEMENTS_MANIFEST__;
}
