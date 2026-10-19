/** How an overlay opens: `showModal()`, `show()`, or the Popover API (DD-038). */
export type UiOverlayKind = 'modal' | 'dialog' | 'popover';

/** A `<dialog>` or a `[popover]` element, as much of it as this reads; the core has no DOM types. */
export interface UiOverlayElement {
  readonly open?: boolean;
  showModal?(): void;
  show?(): void;
  close?(): void;
  showPopover?(): void;
  hidePopover?(): void;
  matches(selector: string): boolean;
}

/** Whether a popover is showing; an engine that cannot parse the pseudo-class has none showing. */
function showing(element: UiOverlayElement): boolean {
  try {
    return element.matches(':popover-open');
  } catch {
    return false;
  }
}

/**
 * Opens or closes a native overlay as its state says (REQ-491, REQ-492): `showModal()` or `show()`
 * and `close()` for a `<dialog>`, `showPopover()` and `hidePopover()` for a popover, each only when
 * the element is in the other state, so no second `close` or `toggle` event is fired. Without the
 * Popover API the popover stays in the page's flow. Client only, after mount (REQ-502).
 */
export function uiOverlaySync(element: UiOverlayElement, kind: UiOverlayKind, open: boolean): void {
  if (kind === 'popover') {
    if (typeof element.showPopover !== 'function') return;
    if (open !== showing(element)) {
      if (open) element.showPopover();
      else element.hidePopover?.();
    }
    return;
  }
  if (open && !element.open) {
    if (kind === 'modal') element.showModal?.();
    else element.show?.();
  } else if (!open && element.open) element.close?.();
}
