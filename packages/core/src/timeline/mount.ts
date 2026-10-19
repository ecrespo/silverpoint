import { diagnose } from '../diagnostics/diagnose';
import { timelineInk, type TimelineInkHost, type TimelineInkProbe } from './ink';
import type { TimelineData } from './types';

/** TimelineJS's events and the name each framework forwards them under (REQ-514). */
export const TIMELINE_EVENTS = Object.freeze([
  ['change', 'change'],
  ['loaded', 'loaded'],
  ['nav_next', 'navNext'],
  ['nav_previous', 'navPrevious'],
  ['zoom_in', 'zoomIn'],
  ['zoom_out', 'zoomOut'],
  ['back_to_start', 'backToStart'],
] as const);

/** The options TimelineJS receives: `font` and `theme` belong to the skin and are dropped (REQ-514). */
export function timelineOptions(options?: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const { font: _font, theme: _theme, ...rest } = options ?? {};
  return rest;
}

/** As much of TimelineJS's module as `timelineMount` uses. */
export interface TimelineJsModule {
  readonly Timeline: new (element: never, data: TimelineData, options: Record<string, unknown>) => {
    on(event: string, handler: (payload: unknown) => void): unknown;
  };
}

/** The surface `timelineView` drew, found in the page. */
export interface TimelineMountHost extends TimelineInkHost {
  querySelector(selector: string): unknown;
}

export interface TimelineMountOptions {
  readonly load: () => Promise<TimelineJsModule>;
  readonly data: TimelineData;
  readonly options?: Readonly<Record<string, unknown>>;
  readonly inked?: boolean;
  /** One of `TIMELINE_EVENTS`' forwarded names, with a payload only for `change` and `loaded`. */
  readonly emit: (event: string, ...value: unknown[]) => void;
  readonly failed: () => void;
}

/**
 * The client half of `SpTimeline` (REQ-513..REQ-515, DD-042): inks the surface from its probes,
 * loads TimelineJS through the adapter's `load`, builds it in the mount and forwards its events
 * under `TIMELINE_EVENTS`' names. A failed load warns `SP025` and calls `failed`; nothing throws.
 * The returned cleanup cancels a pending load, stops the inking and removes TimelineJS's DOM.
 */
export function timelineMount(host: TimelineMountHost, mount: TimelineMountOptions): () => void {
  const stopInk = timelineInk(host, host.querySelector('.sp-kl-probe') as TimelineInkProbe ?? host, mount.inked);
  const target = host.querySelector('.sp-kl-mount') as { replaceChildren(): void } | null;
  let live = true;
  let built = false;
  mount.load().then(
    ({ Timeline }) => {
      if (!live || !target) return;
      const timeline = new Timeline(target as never, mount.data, timelineOptions(mount.options));
      built = true;
      for (const [name, as] of TIMELINE_EVENTS) {
        timeline.on(name, (payload) => {
          if (name === 'change') mount.emit(as, (payload as { unique_id?: string } | undefined)?.unique_id);
          else if (name === 'loaded') mount.emit(as, payload);
          else mount.emit(as);
        });
      }
    },
    (error: unknown) => {
      if (!live) return;
      diagnose('SP025', 'SpTimeline', { property: 'load', message: error instanceof Error ? error.message : undefined });
      mount.failed();
    },
  );
  return () => {
    live = false;
    stopInk();
    // Only TimelineJS's own DOM: a fallback in the mount belongs to the framework.
    if (built) target?.replaceChildren();
  };
}
