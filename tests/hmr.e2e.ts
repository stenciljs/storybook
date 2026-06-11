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
const STYLE_PATH = path.resolve(
  __dirname,
  '..',
  'packages',
  PACKAGE,
  'src',
  'components',
  'my-component',
  'my-component.css',
);

const ORIGINAL_RENDER = `    return <div>Hello, World! I'm {this.getText()}</div>;`;
// Matches any prior HMR mutation of the render line so we can self-heal a file
// left dirty by a previous run that died before its cleanup hook fired.
const RENDER_LINE_PATTERN = /^ {4}return <div>Hello, [^!]+! I'm \{this\.getText\(\)\}<\/div>;$/m;

function makeUpdatedRender(token: string) {
  return `    return <div>Hello, ${token}! I'm {this.getText()}</div>;`;
}

async function readMyComponentText() {
  await browser.switchFrame(null);
  await browser.switchFrame(() => Boolean(document.querySelector('my-component')));
  const el = await $('my-component');
  await el.waitForExist({ timeout: 15000 });
  // The lazy loader places <my-component> in the DOM immediately and hydrates
  // it asynchronously from `dist/esm/*.entry.js`. Wait for the canonical
  // `hydrated` class before reading text so we don't see an empty shadow root.
  await browser.waitUntil(
    async () => {
      const cls = await $('my-component').getAttribute('class');
      return typeof cls === 'string' && cls.split(/\s+/).includes('hydrated');
    },
    { timeout: 15000, interval: 200, timeoutMsg: 'my-component never reached the `hydrated` state' },
  );
  return browser.execute(() => {
    const host = document.querySelector('my-component');
    const root = host?.shadowRoot ?? host;
    return root?.textContent?.trim() ?? '';
  });
}

async function readHostDisplay() {
  await browser.switchFrame(null);
  await browser.switchFrame(() => Boolean(document.querySelector('my-component')));
  const el = await $('my-component');
  await el.waitForExist({ timeout: 15000 });
  await browser.waitUntil(
    async () => {
      const cls = await $('my-component').getAttribute('class');
      return typeof cls === 'string' && cls.split(/\s+/).includes('hydrated');
    },
    { timeout: 15000, interval: 200, timeoutMsg: 'my-component never reached the `hydrated` state' },
  );
  return browser.execute(() => {
    const host = document.querySelector('my-component');
    return host ? getComputedStyle(host).display : '';
  });
}

describe(`StencilJS Storybook HMR (${PACKAGE})`, () => {
  let originalSource: string | undefined;
  let originalStyle: string | undefined;

  before(async () => {
    const onDisk = fs.readFileSync(COMPONENT_PATH, 'utf-8');
    originalStyle = fs.readFileSync(STYLE_PATH, 'utf-8');

    if (onDisk.includes(ORIGINAL_RENDER)) {
      originalSource = onDisk;
    } else {
      // A previous run may have died before its `after` hook restored the
      // file. Heal the canonical render line so the suite can proceed.
      const healed = onDisk.replace(RENDER_LINE_PATTERN, ORIGINAL_RENDER);
      if (!healed.includes(ORIGINAL_RENDER)) {
        throw new Error(`HMR test could not self-heal ${COMPONENT_PATH}; restore the canonical render line manually.`);
      }
      // eslint-disable-next-line no-console
      console.warn(`[hmr.e2e] Detected leftover mutation in ${COMPONENT_PATH}; self-healing to canonical render line.`);
      fs.writeFileSync(COMPONENT_PATH, healed, 'utf-8');
      originalSource = healed;
    }

    await browser.url(`/?path=/story/mycomponent--primary`);
    const iframe = $('#storybook-preview-iframe');
    await iframe.waitForExist({ timeout: 30000 });
    // Storybook flips this to "true" only once the preview iframe has booted
    // and a story is rendered. Without this we can switch into a still-empty
    // iframe and time out waiting for <my-component>.
    await browser.waitUntil(async () => (await iframe.getAttribute('data-is-loaded')) === 'true', {
      timeout: 60000,
      interval: 250,
      timeoutMsg: 'Storybook preview iframe never reached data-is-loaded=true',
    });
    await browser.switchFrame(iframe);
    await $('my-component').waitForExist({ timeout: 30000 });
    await browser.switchFrame(null);
  });

  afterEach(async () => {
    await browser.switchFrame(null);
  });

  after(() => {
    if (originalSource !== undefined) {
      fs.writeFileSync(COMPONENT_PATH, originalSource, 'utf-8');
    }
    if (originalStyle !== undefined) {
      fs.writeFileSync(STYLE_PATH, originalStyle, 'utf-8');
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

  it('reloads the preview iframe when the component stylesheet changes', async () => {
    // Baseline: the canonical stylesheet sets `:host { display: block }`.
    await browser.waitUntil(
      async () => {
        try {
          return (await readHostDisplay()) === 'block';
        } catch {
          return false;
        }
      },
      { timeout: 30000, interval: 1000, timeoutMsg: 'Host did not start with display: block' },
    );

    const updatedStyle = (originalStyle as string).replace('display: block;', 'display: inline-block;');
    if (updatedStyle === originalStyle) {
      throw new Error('Failed to produce an updated stylesheet for style HMR test.');
    }

    fs.writeFileSync(STYLE_PATH, updatedStyle, 'utf-8');

    try {
      await browser.waitUntil(
        async () => {
          try {
            return (await readHostDisplay()) === 'inline-block';
          } catch {
            return false;
          }
        },
        {
          // Style edits re-route through the dependent component, which re-runs
          // the Stencil compiler, so allow extra time.
          timeout: 60000,
          interval: 1000,
          timeoutMsg: 'Host never picked up the edited stylesheet (display: inline-block)',
        },
      );
    } finally {
      fs.writeFileSync(STYLE_PATH, originalStyle as string, 'utf-8');
    }

    // After restoring the stylesheet the preview should reload back to block.
    await browser.waitUntil(
      async () => {
        try {
          return (await readHostDisplay()) === 'block';
        } catch {
          return false;
        }
      },
      {
        timeout: 60000,
        interval: 1000,
        timeoutMsg: 'Host did not return to display: block after restoring the stylesheet',
      },
    );
  });
});
