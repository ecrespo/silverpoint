/**
 * `@silverpoint/core/timeline`: the framework-neutral half of `SpTimeline` (DD-042) — its server
 * markup and the probe reader. TimelineJS itself is the adapters' optional peer, never imported here.
 */
export type * from './types';
export { TIMELINE_FRAMES, TIMELINE_TONES, timelineInk, type TimelineInkHost, type TimelineInkProbe } from './ink';
export { timelineView } from './view';
