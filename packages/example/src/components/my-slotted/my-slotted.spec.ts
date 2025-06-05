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
            Hello, World!
            <hr />
          </div>
        </mock:shadow-root>
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
            Hello there
            <hr />
            <div style={{background: 'pink'}}>
              <div slot="another">another</div>
            </div>
          </div>
        </mock:shadow-root>
      </my-slotted>
    `);
  });
});
