import { Component, h } from '@stencil/core';

/**
 * @slot default - place content here
 * @slot another - place content here
 */
@Component({
  tag: 'my-slotted',
  styleUrl: 'my-slotted.css',
  shadow: true,
})
export class MySlotted {
  render() {
    return (
      <div>
        <slot />
        <hr/>
        <div style={{background: 'pink'}}><slot name="another"/></div>
      </div>
    );
  }
}
