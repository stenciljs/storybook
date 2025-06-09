import { newSpecPage } from '@stencil/core/testing';
import { MySlotted } from './my-slotted';

describe('my-slotted', () => {
  it('renders', async () => {
    const { root } = await newSpecPage({
      components: [MySlotted],
      html: '<my-slotted>Hello, World!</my-slotted>',
    });
    expect(root).toEqualHtml(`
      <my-slotted>
        <mock:shadow-root>
          <div>
            <slot></slot>
            <hr />
            <div style="background: pink;">
              <slot name="another"></slot>
            </div>
          </div>
        </mock:shadow-root>
        Hello, World!
      </my-slotted>
    `);
  });

  it('renders with values', async () => {
    const { root } = await newSpecPage({
      components: [MySlotted],
      html: `<my-slotted>Hello there <div slot="another">another</div></my-slotted>`,
    });
    expect(root).toEqualHtml(`
      <my-slotted>
        <mock:shadow-root>
          <div>
            <slot></slot>
            <hr />
            <div style="background: pink;">
              <slot name="another"></slot>
            </div>
          </div>
        </mock:shadow-root>
        Hello there
        <div slot="another">another</div>
      </my-slotted>
    `);
  });
});
