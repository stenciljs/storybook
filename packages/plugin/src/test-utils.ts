/**
 * A plain custom element standing in for a compiled Stencil component in unit
 * tests. It records how often it is connected and which properties are set,
 * and can optionally expose a controllable `componentOnReady()`.
 */
export class TestProbe extends HTMLElement {
  static created = 0;
  static connected = 0;
  static disconnected = 0;

  readonly instance = ++TestProbe.created;
  propSets: string[] = [];
  private values: Record<string, unknown> = {};

  connectedCallback() {
    TestProbe.connected++;
  }

  disconnectedCallback() {
    TestProbe.disconnected++;
  }

  static reset() {
    TestProbe.created = 0;
    TestProbe.connected = 0;
    TestProbe.disconnected = 0;
  }
}

// Accessors on the prototype, like Stencil defines for each @Prop, so that
// Stencil's vdom treats them as properties rather than attributes.
for (const prop of ['label', 'disabled', 'count', 'config', 'items']) {
  Object.defineProperty(TestProbe.prototype, prop, {
    configurable: true,
    get(this: any) {
      return this.values[prop];
    },
    set(this: any, value: unknown) {
      this.propSets.push(prop);
      this.values[prop] = value;
    },
  });
}

export interface TestProbe {
  label?: string;
  disabled?: boolean;
  count?: number;
  config?: Record<string, unknown>;
  items?: string[];
}

if (!customElements.get('test-probe')) {
  customElements.define('test-probe', TestProbe);
}

/** Custom element with a `componentOnReady()` the test resolves by hand. */
export class TestLazy extends HTMLElement {
  static resolveReady: (() => void) | undefined;
  private ready = new Promise<void>((resolve) => (TestLazy.resolveReady = resolve));
  componentOnReady() {
    return this.ready;
  }
}

if (!customElements.get('test-lazy')) {
  customElements.define('test-lazy', TestLazy);
}
