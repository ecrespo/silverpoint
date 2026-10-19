import { TIMELINE_EVENTS, timelineMount, timelineView, type SpTimelineProps as CoreProps, type TimelineJsModule } from '@silverpoint/core/timeline';
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useUi, type UiCellProps } from './ui/base';
import { renderUi } from './ui/render';

export interface SpTimelineProps extends CoreProps, UiCellProps {
  /** The slide shown changed; TimelineJS's `unique_id` of it. */
  readonly onChange?: (uniqueId: string | undefined) => void;
  readonly onLoaded?: (payload: unknown) => void;
  readonly onNavNext?: () => void;
  readonly onNavPrevious?: () => void;
  readonly onZoomIn?: () => void;
  readonly onZoomOut?: () => void;
  readonly onBackToStart?: () => void;
  /** Rendered in the mount when `@knight-lab/timelinejs` cannot be loaded (REQ-515). Empty by default. */
  readonly fallback?: ReactNode;
}

type Handlers = Pick<SpTimelineProps, 'onChange' | 'onLoaded' | 'onNavNext' | 'onNavPrevious' | 'onZoomIn' | 'onZoomOut' | 'onBackToStart'>;

/** `navNext` → `onNavNext`: the prop each of `TIMELINE_EVENTS` reaches. */
const HANDLER = Object.fromEntries(TIMELINE_EVENTS.map(([, as]) => [as, `on${as[0]!.toUpperCase()}${as.slice(1)}`])) as Record<string, keyof Handlers>;

/**
 * TimelineJS's module without its package entry, which imports a Less stylesheet no consumer bundler
 * loads; the literal path lets the consumer's bundler split it into a chunk of its own.
 */
// @ts-expect-error TimelineJS ships no types; the module is read as `TimelineJsModule`.
const load = () => import('@knight-lab/timelinejs/src/js/timeline/Timeline.js') as Promise<TimelineJsModule>;

/** `SpTimeline`: TimelineJS inked by the ground, loaded on the client only (REQ-510..REQ-515). */
export function SpTimeline({ dashboardCell, fallback, onChange, onLoaded, onNavNext, onNavPrevious, onZoomIn, onZoomOut, onBackToStart, ...props }: SpTimelineProps) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const handlers = useRef<Handlers>({});
  handlers.current = { onChange, onLoaded, onNavNext, onNavPrevious, onZoomIn, onZoomOut, onBackToStart };
  const { data, options, inkedFrames } = props;
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    return timelineMount(host, {
      load,
      data,
      options,
      inked: inkedFrames,
      emit: (event, ...value) => (handlers.current[HANDLER[event]!] as ((...value: unknown[]) => void) | undefined)?.(...value),
      failed: () => setFailed(true),
    });
  }, [data, options, inkedFrames]);
  return renderUi(timelineView(props, useUi(props, dashboardCell), { failed }), { root: { ref }, slots: { fallback } }) as ReactElement;
}
