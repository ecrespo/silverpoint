import { afterNextRender, DestroyRef, ElementRef, inject, Injectable, signal, type Signal } from '@angular/core';
import { checkTypeface, FORCED_PRECISION_QUERY } from '@silverpoint/core';

/**
 * Instance-id tokens, counted per application: the server render and the hydrating client
 * each start from zero, so both derive the same ids (REQ-103).
 */
@Injectable({ providedIn: 'root' })
export class SilverpointIds {
  private count = 0;

  next(): string {
    const token = `ng${this.count}`;
    this.count += 1;
    return token;
  }
}

const forced = signal(false);
let watching = false;

/**
 * Whether the environment forces `precision` (REQ-123): one signal shared by every chart, read
 * after the first render so server and client agree on the initial markup.
 */
export function injectForcedPrecision(): Signal<boolean> {
  afterNextRender(() => {
    if (typeof matchMedia !== 'function') return;
    const query = matchMedia(FORCED_PRECISION_QUERY);
    const update = () => forced.set(query.matches);
    update();
    if (watching) return;
    watching = true;
    query.addEventListener?.('change', update);
  });
  return forced.asReadonly();
}

/** Width of the chart root, measured with ResizeObserver; `undefined` until measured (REQ-009). */
export function injectMeasuredWidth(enabled: () => boolean): Signal<number | undefined> {
  const width = signal<number | undefined>(undefined);
  const host = inject<ElementRef<HTMLElement>>(ElementRef);
  const destroy = inject(DestroyRef);
  afterNextRender(() => {
    if (!enabled() || typeof ResizeObserver !== 'function') return;
    const target = host.nativeElement.querySelector<HTMLElement>('.sp-root') ?? host.nativeElement;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) width.set(entry.contentRect.width);
    });
    observer.observe(target);
    destroy.onDestroy(() => observer.disconnect());
  });
  return width.asReadonly();
}

/** Reports SP013 when the display typeface fails to load; never blocks the render (REQ-032). */
export function injectTypefaceCheck(chart: string): void {
  afterNextRender(() => {
    if (typeof document !== 'undefined' && document.fonts) void checkTypeface(document.fonts, chart);
  });
}
