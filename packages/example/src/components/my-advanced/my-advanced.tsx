import { Component, Event, EventEmitter, Host, Method, Prop, State, h } from '@stencil/core';
import { format } from '../../utils/utils';

/**
 * My Advanced component does many things
 *
 * @slot default - additional content of the component
 * @cssprop --my-advanced-slot-color - color of the slot
 * @csspart my-advanced-slot - the slot container
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
  @Prop({reflect: true}) first: string;

  /**
   * The middle name
   */
  @Prop() middle: string;

  /**
   * The last name
   */
  @Prop() last: string |string[];

  /**
   * A custom format function for the name
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
  @State() private clicked: number = 0;

  /**
   * A method to get "foo"
   */
  @Method()
  public async getFoo(): Promise<"foo"> {
    return 'foo';
  }

  /**
 * A method that does something
 */
  @Method()
  public async doSomething() {
    console.log('doSomething');
  }

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
      <div class="my-advanced-slot" part="my-advanced-slot">
        <slot><img src="https://www.freeiconspng.com/uploads/no-image-icon-0.png" alt="photo" /></slot>
      </div>
      {!this.hideButton && <button onClick={() => this.handleClick()}>Click me {this.clicked}</button>}
    </Host>;
  }
}
