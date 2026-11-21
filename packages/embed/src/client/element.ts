/**
 * `<silverpoint-chart>` (REQ-645, DD-070): the spec from a JSON child or the `spec` property,
 * attributes over its fields, light DOM by default. Upgraded at its start tag the element is still
 * empty (PoC F-P1), so it waits for its JSON child and reads it once it parses.
 */
import { MOUNTED, mount, type ChartMount, type MountOptions } from './mount';
import { jsonChild } from './mount-all';
import type { ChartSpec } from '../spec/types';
import { validateSpec } from '../spec/validate';

export const ELEMENT_NAME = 'silverpoint-chart';

const FIELDS = ['chart', 'ground', 'substrate', 'mode', 'palette', 'width', 'height'] as const;
const OBSERVED = [...FIELDS, 'styles', 'fonts'];

function overrides(element: Element): Partial<Record<(typeof FIELDS)[number], string | number>> {
  const out: Partial<Record<(typeof FIELDS)[number], string | number>> = {};
  for (const name of FIELDS) {
    const value = element.getAttribute(name);
    if (value === null) continue;
    out[name] = name === 'width' || name === 'height' ? Number(value) : value;
  }
  return out;
}

/** The class, built lazily so a DOM-less runtime never touches `HTMLElement` (DD-061). */
function elementClass(): CustomElementConstructor {
  return class SilverpointChart extends HTMLElement {
    static get observedAttributes(): string[] {
      return OBSERVED;
    }
    private handle: ChartMount | null = null;
    private own: ChartSpec | string | undefined;
    private waiting: MutationObserver | null = null;
    private late: ReturnType<typeof setTimeout> | undefined;

    get spec(): ChartSpec | string | undefined {
      return this.own;
    }
    set spec(value: ChartSpec | string | undefined) {
      this.own = value;
      if (this.isConnected) this.render();
    }
    get mounted(): ChartMount | null {
      return this.handle;
    }

    connectedCallback(): void {
      if (this.handle) return;
      if (!this.render()) this.wait();
    }

    disconnectedCallback(): void {
      this.waiting?.disconnect();
      this.waiting = null;
      clearTimeout(this.late);
      this.handle?.destroy();
      this.handle = null;
    }

    attributeChangedCallback(): void {
      if (this.handle) this.render();
    }

    /** The spec with the attributes over it, or `undefined` while it has not arrived. */
    private resolved(): ChartSpec | string | undefined {
      const source = this.own ?? jsonChild(this);
      if (source === undefined) return undefined;
      const parsed = typeof source === 'string' ? validateSpec(source) : undefined;
      if (typeof source === 'string' && parsed && !parsed.ok && parsed.error.kind === 'json') return source;
      const value = typeof source === 'string' ? (parsed!.ok ? parsed!.value : (JSON.parse(source) as ChartSpec)) : source;
      return { ...value, ...overrides(this) } as ChartSpec;
    }

    /** Draws or redraws; false when there is nothing complete to draw yet. */
    private render(): boolean {
      const spec = this.resolved();
      if (spec === undefined) return false;
      if (typeof spec === 'string' && this.own === undefined && document.readyState === 'loading') return false;
      const options: MountOptions = {
        ...(this.getAttribute('styles') === 'none' ? { styles: 'none' as const } : {}),
        ...(this.getAttribute('fonts') === 'none' || this.getAttribute('fonts') === 'embedded' ? { fonts: this.getAttribute('fonts') as 'none' | 'embedded' } : {}),
      };
      if (this.handle) this.handle.update(spec);
      else {
        const into = this.hasAttribute('shadow') ? (this.shadowRoot ?? this.attachShadow({ mode: 'open' })) : undefined;
        this.handle = mount(this, spec, { ...options, ...(into ? { into } : {}) });
      }
      this.waiting?.disconnect();
      this.waiting = null;
      return true;
    }

    /** Waits for a JSON child that parses (F-P1); after parsing ends, a broken one is shown as an error. */
    private wait(): void {
      this.waiting?.disconnect();
      this.waiting = new MutationObserver(() => {
        const spec = this.resolved();
        if (spec === undefined) return;
        if (typeof spec !== 'string') return void this.render();
        clearTimeout(this.late);
        if (document.readyState !== 'loading') this.late = setTimeout(() => this.isConnected && !this.handle && typeof this.resolved() === 'string' && this.renderBroken(), 0);
      });
      this.waiting.observe(this, { childList: true, subtree: true, characterData: true });
    }

    private renderBroken(): void {
      const spec = this.resolved();
      if (spec === undefined) return;
      this.handle = mount(this, spec);
      this.waiting?.disconnect();
      this.waiting = null;
    }
  };
}

/** Defines the element; idempotent, and a no-op without `customElements`. */
export function defineElement(name: string = ELEMENT_NAME): void {
  if (typeof customElements === 'undefined' || customElements.get(name)) return;
  customElements.define(name, elementClass());
}

export { MOUNTED };
