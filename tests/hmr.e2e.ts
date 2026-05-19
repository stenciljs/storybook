import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import { $, browser, expect } from '@wdio/globals';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const PACKAGE = process.env.STENCIL_HMR_PACKAGE ?? 'example';
const COMPONENT_PATH = path.resolve(
  __dirname,
  '..',
  'packages',
  PACKAGE,
  'src',
  'components',
  'my-component',
  'my-component.tsx',
);

const ORIGINAL_RENDER = `    return <div>Hello, World! I'm {this.getText()}</div>;`;

function makeUpdatedRender(token: string) {
  return `    return <div>Hello, ${token}! I'm {this.getText()}</div>;`;
}

async function readMyComponentText() {
  await browser.switchFrame(null);
  await browser.switchFrame(() => Boolean(document.querySelector('my-component')));
  const el = await $('my-component');
  await el.waitForExist({ timeout: 15000 });
  return browser.execute(() => {
    const host = document.querySelector('my-component');
    const root = host?.shadowRoot ?? host;
    return root?.textContent?.trim() ?? '';
  });
}

describe(`StencilJS Storybook HMR (${PACKAGE})`, () => {
  let originalSource: string | undefined;

  before(async () => {
    originalSource = fs.readFileSync(COMPONENT_PATH, 'utf-8');
    if (!originalSource.includes(ORIGINAL_RENDER)) {
      throw new Error(
        `HMR test expected ${COMPONENT_PATH} to contain the canonical render line. Update the test or restore the file.`,
      );
    }

    await browser.url(`/?path=/story/mycomponent--primary`);
    // give Storybook a moment to mount the iframe
    await browser.pause(3000);
  });

  afterEach(async () => {
    await browser.switchFrame(null);
  });

  after(() => {
    if (originalSource !== undefined) {
      fs.writeFileSync(COMPONENT_PATH, originalSource, 'utf-8');
    }
  });

  it('renders the original component before any edits', async () => {
    const text = await readMyComponentText();
    await expect(text).toContain('Hello, World!');
  });

  it('reloads the preview iframe when the component .tsx changes', async () => {
    const token = `HMR_${Date.now()}`;
    const updated = (originalSource as string).replace(ORIGINAL_RENDER, makeUpdatedRender(token));
    if (updated === originalSource) {
      throw new Error('Failed to produce an updated source for HMR test.');
    }

    fs.writeFileSync(COMPONENT_PATH, updated, 'utf-8');

    try {
      await browser.waitUntil(
        async () => {
          try {
            const text = await readMyComponentText();
            return text.includes(`Hello, ${token}!`);
          } catch {
            return false;
          }
        },
        {
          // Lazy builds re-run the Stencil compiler, so allow extra time.
          timeout: 60000,
          interval: 1000,
          timeoutMsg: `Component never picked up edited render output for token ${token}`,
        },
      );
    } finally {
      fs.writeFileSync(COMPONENT_PATH, originalSource as string, 'utf-8');
    }

    // After restoring the file the preview should hot-reload back to "World".
    await browser.waitUntil(
      async () => {
        try {
          const text = await readMyComponentText();
          return text.includes('Hello, World!');
        } catch {
          return false;
        }
      },
      {
        timeout: 60000,
        interval: 1000,
        timeoutMsg: 'Component did not return to the original render after restoring the file',
      },
    );
  });
});
