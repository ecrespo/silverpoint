import type { ActiveItem, Geometry } from '../types';

/**
 * What `onRootChange` carries when a node of a `SunburstChart` or a `SquarifiedTreemap` is
 * activated (REQ-439, API delta §4): the node's id, or, for the drawn root, the id its centre or
 * frame returns to — `null` for the data root, which has nothing above it. The adapters map their
 * `select` through it and keep no root of their own (REQ-108, I-30).
 *
 * The node is read where `geometry`, the drawing as it is now, has the item: the shared reducer
 * keeps an item by its place, so after the consumer passes a new `rootId` back the item's own
 * summary may still be the old drawing's.
 */
export function rootChangeOf(geometry: Geometry, item: ActiveItem): string | null {
  const hit = geometry.hitAreas.find((h) => h.seriesKey === item.seriesKey && h.index === item.index);
  const summary = (hit?.datum ?? item.datum) as { readonly id?: unknown; readonly path?: readonly unknown[]; readonly up?: string | null };
  if ('up' in summary) return summary.up ?? null;
  // The data root drawn as root: its path is itself alone.
  if ((summary.path?.length ?? 0) <= 1) return null;
  return String(summary.id);
}
