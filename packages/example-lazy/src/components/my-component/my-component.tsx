import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import { format } from '../../utils/utils';

type ComplexType = string;

@Component({
  tag: 'my-component',
  styleUrl: 'my-component.css',
  shadow: true,
})
export class MyComponent {
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
  @Prop() last: string;

  /** show radio control for < 5 options */
  @Prop() radioTest?: 'foo' | 'bar' | 'baz';

  /** show select control for >= 5 options */
  @Prop() selectTest?: '1' | '2' | '3' | '4' | '5';

  @Prop() booleanTest: boolean;
  @Prop() numberTest?: number;
  @Prop() stringTest?: string = 'hello';
  @Prop() complexTest?: ComplexType;

  @Event() evalEvent: EventEmitter<void>;

  private getText(): string {
    return format(this.first, this.middle, this.last);
  }

  render() {
    return <div>Hello, World! I'm {this.getText()}</div>;
  }
}

export interface MyComponent {
  first: string;
  middle: string;
  last: string;
}
