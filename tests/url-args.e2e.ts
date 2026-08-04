import { $, browser, expect } from '@wdio/globals';

/**
 * Regression tests for URL ?args= parameter handling.
 *
 * Before the fix in packages/plugin/src/docs/infer-type.ts:
 *   - scalar props (string/number/boolean) got type `other` due to `in` being
 *     used on an array, so Storybook couldn't coerce URL arg values.
 *   - union/enum props got type `other` instead of `enum`, causing Storybook's
 *     mapArgsToTypes to drop them as INCOMPATIBLE.
 *   - plain-type props mapped to options:[undefined], which also blocked coercion.
 *
 * Each test navigates to the iframe URL with ?args= and asserts the component
 * actually renders with those values — the only way to confirm the full pipeline
 * (argtype inference → URL param parsing → prop binding) is working end-to-end.
 */
describe('URL ?args= parameter handling', () => {
  it('applies a scalar string arg from the URL to the rendered component', async () => {
    await browser.url('/iframe.html?id=mycomponent--primary&args=first:Gyles');
    await $('my-component').waitForExist();

    const text = await $('my-component').getText();
    expect(text).toContain('Gyles');
  });

  it('applies a union/radio enum arg from the URL to the rendered component', async () => {
    await browser.url('/iframe.html?id=mycomponent--primary&args=radioTest:baz');
    const el = await $('my-component');
    await el.waitForExist();

    const radioVal = await browser.execute((node) => (node as any).radioTest, await el.getElement());
    expect(radioVal).toBe('baz');
  });

  it('applies both scalar and enum args together from the URL', async () => {
    await browser.url('/iframe.html?id=mycomponent--primary&args=first:Gyles;radioTest:baz');
    const el = await $('my-component');
    await el.waitForExist();

    const text = await el.getText();
    expect(text).toContain('Gyles');

    const radioVal = await browser.execute((node) => (node as any).radioTest, await el.getElement());
    expect(radioVal).toBe('baz');
  });
});
