import { Component, Element, Event, EventEmitter, Prop, State, h } from '@stencil/core';

declare global {
  interface Window {
    __probeLog?: string[];
  }
}

let instanceCounter = 0;

/**
 * Diagnostic component for checking how the Storybook renderer treats a
 * component when args change. It has internal state (`open`, `draft`), records
 * every lifecycle call to `window.__probeLog`, and stamps each instance with a
 * unique `data-instance` id so tests can check element identity.
 */
@Component({
  tag: 'my-probe',
  styleUrl: 'my-probe.css',
  shadow: true,
})
export class MyProbe {
  @Element() el!: HTMLElement;

  /** Heading text */
  @Prop() label: string = 'Probe';

  /** Disables the toggle button and the input */
  @Prop() disabled: boolean = false;

  /** Number shown next to the heading */
  @Prop() count: number = 0;

  /** Object prop, must be set as a property */
  @Prop() config: { color: string; size: 'small' | 'large' } = { color: 'teal', size: 'small' };

  /** Array prop, must be set as a property */
  @Prop() items: string[] = [];

  /** Internal state: whether the panel is expanded */
  @State() open = false;

  /** Internal state: what the user typed */
  @State() draft = '';

  /** Fires when the panel is toggled */
  @Event() probeToggle!: EventEmitter<boolean>;

  private instance = ++instanceCounter;

  private log(hook: string) {
    const entry = `my-probe#${this.instance} ${hook}`;
    (window.__probeLog ??= []).push(entry);
    console.log(`[probe] ${entry}`);
  }

  connectedCallback() {
    this.el.dataset.instance = String(this.instance);
    this.log('connectedCallback');
  }

  disconnectedCallback() {
    this.log('disconnectedCallback');
  }

  componentWillLoad() {
    this.log('componentWillLoad');
  }

  componentDidLoad() {
    this.log('componentDidLoad');
  }

  componentWillUpdate() {
    this.log('componentWillUpdate');
  }

  componentDidUpdate() {
    this.log('componentDidUpdate');
  }

  private toggle = () => {
    this.open = !this.open;
    this.probeToggle.emit(this.open);
  };

  private onInput = (ev: Event) => {
    this.draft = (ev.target as HTMLInputElement).value;
  };

  render() {
    const config = this.config ?? { color: 'gray', size: 'small' };
    return (
      <section class={{ probe: true, [`probe--${config.size}`]: true }} style={{ borderColor: config.color }}>
        <h2 part="heading">
          {this.label} <span class="count">{this.count}</span>
        </h2>
        <button type="button" disabled={this.disabled} onClick={this.toggle} aria-expanded={String(this.open)}>
          {this.open ? 'Close' : 'Open'}
        </button>
        <input disabled={this.disabled} value={this.draft} onInput={this.onInput} placeholder="Type something" />
        {this.open && (
          <ul class="items">
            {(this.items ?? []).map(item => (
              <li>{item}</li>
            ))}
          </ul>
        )}
        <slot />
      </section>
    );
  }
}
