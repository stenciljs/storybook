import type { Package } from 'custom-elements-manifest';
import docs from '@stencil/unplugin/docs';
import { setCustomElementsManifest } from './framework-api';

setCustomElementsManifest(docs as Package);

if (import.meta.hot) {
  import.meta.hot.on('stencil:docs-update', () => {
    window.location.reload();
  });
}
