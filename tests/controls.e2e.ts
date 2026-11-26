import { $, browser, expect } from '@wdio/globals';
import { Key } from 'webdriverio';

/**
 * Changing a control must patch the rendered component in place: same element,
 * internal state and typed input kept, no second load lifecycle. Only an
 * explicit remount ("Reload story") may recreate it.
 */

const probe = () => $('my-probe');

/** Select-all is Cmd+A on macOS and Ctrl+A elsewhere. */
const selectAllModifier = process.platform === 'darwin' ? Key.Command : Key.Ctrl;

async function inPreview<T>(fn: () => Promise<T>): Promise<T> {
  await browser.switchFrame(() => Boolean(document.querySelector('my-probe')));
  try {
    return await fn();
  } finally {
    await browser.switchFrame(null);
  }
}

const instanceId = () => inPreview(() => probe().getAttribute('data-instance'));

async function setTextControl(name: string, value: string) {
  const input = $(`#control-${name}`);
  await input.click();
  await browser.keys([selectAllModifier, 'a']);
  await browser.keys([Key.Backspace]);
  await input.setValue(value);
}

async function expectHeading(text: string) {
  await inPreview(() =>
    browser.waitUntil(async () => (await probe().shadow$('h2').getText()).startsWith(text), {
      timeoutMsg: `expected heading to start with "${text}"`,
    }),
  );
}

for (const story of ['default', 'with-render', 'with-decorator']) {
  describe(`controls update the story in place (tests-myprobe--${story})`, () => {
    let firstInstance: string | null;

    before(async () => {
      await browser.url(`/?path=/story/tests-myprobe--${story}`);
      await $('#control-label').waitForDisplayed({ timeout: 30000 });
      await inPreview(() => probe().shadow$('button').waitForClickable({ timeout: 30000 }));

      // Put the component into a state only a live instance can have.
      await inPreview(async () => {
        await probe().shadow$('button').click();
        await probe().shadow$('input').setValue('typed by user');
        await browser.execute(() => (window.__probeLog = []));
      });
      firstInstance = await instanceId();
    });

    afterEach(async () => {
      await browser.switchFrame(null);
    });

    it('keeps the element and its state when a text control changes', async () => {
      await setTextControl('label', 'Changed label');
      await expectHeading('Changed label');

      expect(await instanceId()).toBe(firstInstance);
      await inPreview(async () => {
        await expect(probe().shadow$('input')).toHaveValue('typed by user');
        await expect(probe().shadow$('button')).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('keeps the element when a boolean control changes', async () => {
      // Newer Storybook versions render this as a visually hidden switch input,
      // so a WebDriver click lands on the surrounding cell. Click it via the DOM.
      await browser.execute(() => (document.getElementById('control-disabled') as HTMLInputElement).click());

      await inPreview(async () => {
        await browser.waitUntil(async () => (await probe().getProperty('disabled')) === true);
        await expect(probe().shadow$('input')).toHaveValue('typed by user');
      });
      expect(await instanceId()).toBe(firstInstance);
    });

    it('does not run the load lifecycle again', async () => {
      const log = await inPreview(() => browser.execute(() => window.__probeLog ?? []));
      expect(log.filter((entry) => /connectedCallback|componentWillLoad|componentDidLoad/.test(entry))).toEqual([]);
      expect(log.some((entry) => entry.endsWith('componentDidUpdate'))).toBe(true);
    });

    it('keeps the element when controls are reset', async () => {
      await $('button[aria-label="Reset controls"]').click();
      await expectHeading('Probe');

      expect(await instanceId()).toBe(firstInstance);
      await inPreview(() => expect(probe().shadow$('input')).toHaveValue('typed by user'));
    });

    it('remounts when the story is reloaded', async () => {
      await $('button[aria-label="Reload story"]').click();

      await browser.waitUntil(async () => (await instanceId()) !== firstInstance, {
        timeoutMsg: 'expected "Reload story" to create a new element',
      });
      await inPreview(() => expect(probe().shadow$('input')).toHaveValue(''));
    });
  });
}

declare global {
  interface Window {
    __probeLog?: string[];
  }
}
