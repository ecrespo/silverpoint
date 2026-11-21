/** Shared helpers of the embed client's DOM tests. */
import { afterEach } from 'vitest';

let hosts: HTMLElement[] = [];
afterEach(() => {
  for (const host of hosts) host.remove();
  hosts = [];
  document.adoptedStyleSheets = [];
  for (const style of document.querySelectorAll('style[data-sp-embed]')) style.remove();
});

/** A host element appended to the body, removed after the test. */
export function host(tag = 'div'): HTMLElement {
  const element = document.createElement(tag);
  document.body.append(element);
  hosts.push(element);
  return element;
}

/** Lays the drawing out at its viewBox size at the page origin, as the adapters' tests do. */
export function layOut(scope: ParentNode): void {
  const svg = scope.querySelector('svg.sp-chart') as SVGSVGElement;
  const [, , width, height] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width, height, x: 0, y: 0, right: width, bottom: height, toJSON() {} }) as DOMRect;
}

export function key(element: HTMLElement, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event;
}

export function pointer(element: HTMLElement, type: string, x: number, y: number): void {
  element.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerType: 'mouse', bubbles: true }));
}

/** Makes every markup-parsing entry point throw for the duration of `run` (REQ-637). */
export function forbidMarkup<T>(run: () => T): T {
  const proto = Element.prototype as unknown as Record<string, unknown>;
  const saved: [object, string, PropertyDescriptor | undefined][] = [];
  const block = (target: object, name: string, kind: 'set' | 'value') => {
    const descriptor = Object.getOwnPropertyDescriptor(target, name);
    saved.push([target, name, descriptor]);
    const thrower = () => {
      throw new Error(`REQ-637 · ${name} used`);
    };
    Object.defineProperty(target, name, kind === 'set' ? { configurable: true, get: descriptor?.get, set: thrower } : { configurable: true, value: thrower, writable: true });
  };
  block(proto, 'innerHTML', 'set');
  block(proto, 'outerHTML', 'set');
  block(proto, 'insertAdjacentHTML', 'value');
  block(globalThis, 'DOMParser', 'value');
  block(Range.prototype, 'createContextualFragment', 'value');
  try {
    return run();
  } finally {
    for (const [target, name, descriptor] of saved.reverse()) {
      if (descriptor) Object.defineProperty(target, name, descriptor);
      else delete (target as Record<string, unknown>)[name];
    }
  }
}
