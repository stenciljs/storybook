import { $, browser, expect } from '@wdio/globals';
import { Key } from 'webdriverio';

function getPropInput(label: string, inputTagName = 'textarea') {
  return $(`span=${label}`).parentElement().parentElement().$(inputTagName);
}

async function setPropInput(label: string, value: string, inputTagName = 'textarea') {
  const input = getPropInput(label, inputTagName);
  await input.click();
  await browser.keys([Key.Ctrl, 'a']);
  await browser.keys([Key.Backspace]);
  await input.setValue(value);
}

describe('StencilJS Storybook', () => {
  before(async () => {
    await browser.url(`/?path=/story/mycomponent--primary`);

    /**
     * not ideal but this guarantees that we switch to the right frame
     */
    await browser.pause(3000);
  });

  afterEach(async () => {
    await browser.switchFrame(null);
  });

  it('should render the component', async () => {
    await browser.switchFrame(() => Boolean(document.querySelector('my-component')));

    await expect($('my-component')).toBeExisting();
    await expect($('my-component')).toMatchSnapshot();
  });

  it('update the component when I update the props', async () => {
    await setPropInput('first', 'Jane');
    await setPropInput('middle', 'Doe');
    await setPropInput('last', 'Smith');

    await browser.switchFrame(() => Boolean(document.querySelector('my-component')));
    await expect($('my-component')).toMatchSnapshot();
  });

  it('should render the component with slots as strings', async () => {
    await browser.url(`/?path=/story/myslotted--strings`);
    await browser.pause(3000);
    await browser.switchFrame(() => Boolean(document.querySelector('my-slotted')));

    await expect($('my-slotted')).toBeExisting();
    await expect($('my-slotted')).toMatchSnapshot();
  });

  it('should render the component with slots as elements', async () => {
    await browser.url(`/?path=/story/myslotted--elements`);
    await browser.pause(3000);
    await browser.switchFrame(() => Boolean(document.querySelector('my-slotted')));

    await expect($('my-slotted')).toBeExisting();
    await expect($('my-slotted')).toMatchSnapshot();
  });

  it('should render the component with slots as fragments', async () => {
    await browser.url(`/?path=/story/myslotted--fragments`);
    await browser.pause(3000);
    await browser.switchFrame(() => Boolean(document.querySelector('my-slotted')));

    await expect($('my-slotted')).toBeExisting();
    await expect($('my-slotted')).toMatchSnapshot();
  });
});
