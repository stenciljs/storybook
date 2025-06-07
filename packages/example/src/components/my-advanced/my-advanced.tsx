import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { format } from '../../utils/utils';

/**
 * @slot - Content of the component
 */
@Component({
  tag: 'my-advanced',
  styleUrl: 'my-advanced.css',
  shadow: false,
})
export class MyAdvanced {
  /**
   * The first name
   */
  @Prop() first: string;

  /**
   * The middle name
   */
  @Prop() middle: string;

  /**
   * The last name
   */
  @Prop() last: string |string[];

  /**
   * The render function
   */
  @Prop() customFormat: (first: string, middle: string, last: string[]) => JSX.Element;

  /**
   * The step to increment the clicked counter
   */
  @Prop() step: number = 1;

  /**
   * Whether to show the button
   */
  @Prop() hideButton: boolean = false;

  /**
   * The clicked counter
   */
  @State() clicked: number = 0;


  @Event() myClick: EventEmitter<number>;

  private handleClick() {
    this.clicked += this.step;
    this.myClick.emit(this.clicked);
  }

  private getText():JSX.Element {
    const last = Array.isArray(this.last) ? this.last : [this.last];
    if (this.customFormat) {
      return this.customFormat(this.first, this.middle, last);
    }
    return format(this.first, this.middle, last.join(' '));
  }

  render() {
    return <Host>
      <div>Hello, World! I'm {this.getText()}</div>
      <div class="my-advanced-slot">
        <slot><img src="https://www.freeiconspng.com/uploads/no-image-icon-0.png" alt="photo" /></slot>
      </div>
      {!this.hideButton && <button onClick={() => this.handleClick()}>Click me {this.clicked}</button>}
    </Host>;
  }
}
