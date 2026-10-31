/**
 * The deck's DOM helpers (T-270): scaling (DD-051, REQ-617), chart slots (REQ-592) and the
 * pending fragments of the current slide (DD-057, REQ-597).
 */
import type { ChartFenceSpec } from '../types';

const DEFAULT_SLIDE_WIDTH = 1280;

/** The slide width from the first slide's `viewBox` (1280 at 16:9, 960 at 4:3). */
function slideWidth(root: ParentNode): number {
  const viewBox = root.querySelector('svg[data-marpit-svg]')?.getAttribute('viewBox')?.split(/\s+/);
  const width = Number(viewBox?.[2]);
  return Number.isFinite(width) && width > 0 ? width : DEFAULT_SLIDE_WIDTH;
}

/**
 * Observes the viewport with one ResizeObserver and writes `--sp-deck-scale` on it, with
 * `data-sp-scaled` so `deck.css` fixes each slide at its size and scales it (DD-051). Without
 * ResizeObserver the server markup's native `viewBox` scaling stays.
 */
export function applyScaling(viewport: HTMLElement): () => void {
  if (typeof ResizeObserver !== 'function') return () => {};
  const base = slideWidth(viewport);
  const observer = new ResizeObserver((entries) => {
    const width = entries[entries.length - 1]?.contentRect.width ?? 0;
    // A hidden deck measures 0: keep the last scale instead of collapsing the slides.
    if (width <= 0) return;
    viewport.style.setProperty('--sp-deck-scale', String(Math.round((width / base) * 10_000) / 10_000));
  });
  viewport.setAttribute('data-sp-scaled', '');
  observer.observe(viewport);
  return () => {
    observer.disconnect();
    viewport.removeAttribute('data-sp-scaled');
    viewport.style.removeProperty('--sp-deck-scale');
  };
}

export interface FoundSlot {
  readonly element: HTMLElement;
  readonly slotId: string;
  readonly spec: ChartFenceSpec;
}

/** The chart slots to hydrate, in document order. An error figure carries no spec and is not one. */
export function findChartSlots(root: ParentNode): FoundSlot[] {
  const found: FoundSlot[] = [];
  for (const element of root.querySelectorAll<HTMLElement>('[data-sp-slot][data-sp-spec]')) {
    let spec: unknown;
    try {
      spec = JSON.parse(element.getAttribute('data-sp-spec')!);
    } catch {
      continue;
    }
    if (!spec || typeof spec !== 'object' || Array.isArray(spec) || typeof (spec as ChartFenceSpec).chart !== 'string') continue;
    found.push({ element, slotId: element.getAttribute('data-sp-slot')!, spec: spec as ChartFenceSpec });
  }
  return found;
}

/** Shows the fragments `1..step` of slide `page` and keeps the others pending (REQ-597). */
export function applyFragments(root: ParentNode, page: number, step: number): void {
  const slide = root.querySelectorAll('.sp-deck-slide')[page - 1];
  if (!slide) return;
  for (const fragment of slide.querySelectorAll('[data-marpit-fragment]')) {
    const k = Number(fragment.getAttribute('data-marpit-fragment'));
    fragment.toggleAttribute('data-sp-pending', !(k <= step));
  }
}
