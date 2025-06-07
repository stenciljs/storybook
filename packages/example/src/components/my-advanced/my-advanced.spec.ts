import { newSpecPage } from '@stencil/core/testing';
import { MyAdvanced } from './my-advanced';

describe('my-advanced', () => {
  it('renders', async () => {
    const { root } = await newSpecPage({
      components: [MyAdvanced],
      html: '<my-advanced></my-advanced>',
    });
    expect(root).toEqualHtml(`
      <my-advanced>
        <mock:shadow-root>
          <div>
            Hello, World! I'm
          </div>
        </mock:shadow-root>
      </my-advanced>
    `);
  });

  it('renders with values', async () => {
    const { root } = await newSpecPage({
      components: [MyAdvanced],
      html: `<my-advanced first="Stencil" middle="'Don't call me a framework'" last="JS"></my-advanced>`,
    });
    expect(root).toEqualHtml(`
      <my-advanced first="Stencil" middle="'Don't call me a framework'" last="JS">
        <mock:shadow-root>
          <div>
            Hello, World! I'm Stencil 'Don't call me a framework' JS
          </div>
        </mock:shadow-root>
      </my-advanced>
    `);
  });
});
