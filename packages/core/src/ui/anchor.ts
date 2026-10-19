import { uiPlace, type UiAlign, type UiSide } from './place';

/** A measured rectangle, in viewport pixels. */
interface UiRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** The window an overlay is placed in, as much of it as this reads; the core has no DOM types. */
interface UiAnchorView {
  readonly innerWidth: number;
  readonly innerHeight: number;
  addEventListener(type: string, listener: () => void, options?: boolean | { readonly capture?: boolean; readonly passive?: boolean }): void;
  removeEventListener(type: string, listener: () => void, options?: boolean | { readonly capture?: boolean }): void;
  /** Absent in an engine without it: the overlay is then placed on scroll and resize only. */
  readonly ResizeObserver?: new (callback: () => void) => { observe(target: never): void; disconnect(): void };
}

/** The trigger an overlay hangs from. */
export interface UiAnchorTarget {
  getBoundingClientRect(): UiRect;
  closest(selector: string): { getAttribute(name: string): string | null } | null;
}

/** The overlay: measured, then given `--sp-ui-x`, `--sp-ui-y` and `data-side`. */
export interface UiAnchorFloating {
  getBoundingClientRect(): UiRect;
  setAttribute(name: string, value: string): void;
  readonly style: { setProperty(name: string, value: string): void };
  readonly ownerDocument: { readonly defaultView: UiAnchorView | null } | null;
}

export interface UiAnchorOptions {
  readonly side: UiSide;
  readonly align: UiAlign;
  /** Gap between the trigger and the overlay, px (`6`). */
  readonly offset?: number;
  /** Least distance to the viewport's edges, px (`8`). */
  readonly padding?: number;
}

/**
 * The DOM side of an anchored overlay, as `uiRovingFocus` is for REQ-315 (REQ-493): measures the
 * trigger and the overlay, places it with `uiPlace` in the nearest `dir`, and writes `--sp-ui-x`,
 * `--sp-ui-y` and `data-side`; again on every scroll and resize, and whenever the trigger or the
 * overlay changes size (a web font replacing its fallback), until the returned cleanup runs.
 * Client only, on open.
 */
export function uiAnchor(anchor: UiAnchorTarget, floating: UiAnchorFloating, options: UiAnchorOptions): () => void {
  const view = floating.ownerDocument?.defaultView;
  if (!view) return () => {};
  const place = () => {
    const { width, height } = floating.getBoundingClientRect();
    const at = uiPlace({
      anchor: anchor.getBoundingClientRect(),
      floating: { width, height },
      viewport: { width: view.innerWidth, height: view.innerHeight },
      side: options.side,
      align: options.align,
      offset: options.offset ?? 6,
      padding: options.padding ?? 8,
      dir: anchor.closest('[dir]')?.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr',
    });
    floating.style.setProperty('--sp-ui-x', `${at.x}px`);
    floating.style.setProperty('--sp-ui-y', `${at.y}px`);
    floating.setAttribute('data-side', at.side);
  };
  place();
  // Capturing, so the scroll of any scroller between the trigger and the window re-places too.
  view.addEventListener('scroll', place, { capture: true, passive: true });
  view.addEventListener('resize', place);
  const sized = view.ResizeObserver ? new view.ResizeObserver(place) : undefined;
  sized?.observe(anchor as never);
  sized?.observe(floating as never);
  return () => {
    view.removeEventListener('scroll', place, { capture: true });
    view.removeEventListener('resize', place);
    sized?.disconnect();
  };
}
