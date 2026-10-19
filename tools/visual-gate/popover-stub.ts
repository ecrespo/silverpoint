/**
 * The Popover API for adapter tests in happy-dom, which has none (T-215): `showPopover()`,
 * `hidePopover()`, `:popover-open` and the `toggle` event with `newState`, as the platform gives
 * them. `light(element)` hides a popover as a click outside or Escape does. Test-only.
 */
export function stubPopoverApi(): { restore(): void; light(element: Element): void } {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  const shown = new WeakSet<Element>();
  const matches = Element.prototype.matches;
  const toggle = (element: Element, newState: 'open' | 'closed') =>
    element.dispatchEvent(Object.assign(new Event('toggle'), { oldState: newState === 'open' ? 'closed' : 'open', newState }));
  const hide = (element: Element) => {
    if (!shown.has(element)) return;
    shown.delete(element);
    toggle(element, 'closed');
  };
  proto.showPopover = function showPopover(this: HTMLElement) {
    if (shown.has(this)) throw new DOMException('Already showing', 'InvalidStateError');
    shown.add(this);
    toggle(this, 'open');
  };
  proto.hidePopover = function hidePopover(this: HTMLElement) {
    hide(this);
  };
  Element.prototype.matches = function (this: Element, selector: string) {
    return selector === ':popover-open' ? shown.has(this) : matches.call(this, selector);
  };
  return {
    restore() {
      delete proto.showPopover;
      delete proto.hidePopover;
      Element.prototype.matches = matches;
    },
    light: hide,
  };
}
