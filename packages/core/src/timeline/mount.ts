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

/** TimelineJS's container. */
interface TimelineMountBox {
  remove(): void;
}

/** The surface's mount, as much of it as `timelineMount` uses. */
interface TimelineMountTarget {
  append(child: never): void;
  readonly ownerDocument: { createElement(tag: 'div'): TimelineMountBox } | null;
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
 * under `TIMELINE_EVENTS`' names, with a copy of the data. A load that fails, or a TimelineJS that
 * throws as it is built, warns `SP025` and calls `failed`; nothing throws.
 * TimelineJS is built in a container of its own inside the mount, since it rewrites its container's
 * `className`; the returned cleanup cancels a pending load, stops the inking and removes that container.
 */
export function timelineMount(host: TimelineMountHost, mount: TimelineMountOptions): () => void {
  const stopInk = timelineInk(host, host.querySelector('.sp-kl-probe') as TimelineInkProbe ?? host, mount.inked);
  const target = host.querySelector('.sp-kl-mount') as TimelineMountTarget | null;
  let live = true;
  /** TimelineJS's container: a `<div>` of its own, which it may restyle; the mount stays the framework's. */
  let box: TimelineMountBox | undefined;
  const fail = (error: unknown) => {
    if (!live) return;
    // Whatever TimelineJS wrote before it threw goes with its container: the mount is the fallback's.
    box?.remove();
    box = undefined;
    diagnose('SP025', 'SpTimeline', { property: 'load', message: error instanceof Error ? error.message : undefined });
    mount.failed();
  };
  mount
    .load()
    .then(({ Timeline }) => {
      if (!live || !target?.ownerDocument) return;
      box = target.ownerDocument.createElement('div');
      target.append(box as never);
      // TimelineJS writes into its data (each slide's `unique_id`): a copy, never the consumer's.
      const timeline = new Timeline(box as never, structuredClone(mount.data), timelineOptions(mount.options));
      for (const [name, as] of TIMELINE_EVENTS) {
        timeline.on(name, (payload) => {
          if (name === 'change') mount.emit(as, (payload as { unique_id?: string } | undefined)?.unique_id);
          else if (name === 'loaded') mount.emit(as, payload);
          else mount.emit(as);
        });
      }
    })
    .catch(fail);
  return () => {
    live = false;
    stopInk();
    box?.remove();
  };
}
