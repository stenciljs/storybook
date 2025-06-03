import { newE2EPage } from '@stencil/core/testing';

describe('my-slotted', () => {
  it('renders', async () => {
    const page = await newE2EPage();

    await page.setContent('<my-slotted>hello</my-slotted>');
    const element = await page.find('my-slotted');
    expect(element).toHaveClass('hydrated');
  });
});
