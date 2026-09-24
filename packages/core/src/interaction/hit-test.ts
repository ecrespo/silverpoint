import { round2 } from '../render/round';
import type { ActiveItem, Geometry, HitArea, Rect, Stroke } from '../types';
import { circlePath } from '../charts/shared/format';

export type PointerKind = 'mouse' | 'pen' | 'touch';

/** Minimum touch target, in px (REQ-144). */
export const MIN_TOUCH_TARGET = 24;

function toActiveItem(hit: HitArea): ActiveItem {
  return {
    seriesKey: hit.seriesKey,
    index: hit.index,
    datum: hit.datum,
    value: hit.value,
    point: { x: hit.x, y: hit.y },
  };
}

function inside(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

/** Smallest horizontal distance between neighbouring hit areas of the same series. */
function spacing(hitAreas: readonly HitArea[]): number {
  let smallest = Number.POSITIVE_INFINITY;
  for (let i = 1; i < hitAreas.length; i += 1) {
    const previous = hitAreas[i - 1] as HitArea;
    const current = hitAreas[i] as HitArea;
    if (previous.seriesKey !== current.seriesKey) continue;
    const gap = Math.abs(current.x - previous.x);
    if (gap > 0 && gap < smallest) smallest = gap;
  }
  return smallest;
}

/**
 * Resolves the active item as a pure function of a pointer position, in SVG space, and the
 * geometry — no DOM involved (REQ-140).
 *
 * A pointer inside an item's box resolves to that item. Otherwise a mouse or pen resolves to the
 * item nearest along x, then along y. Touch resolves by
 * proximity and only within a target at least 24 px wide (REQ-144). A point outside the
 * drawing area resolves to `null`.
 */
export function resolveActive(
  geometry: Geometry,
  pointer: Readonly<{ x: number; y: number }>,
  kind: PointerKind = 'mouse',
): ActiveItem | null {
  if (!Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) return null;
  if (!inside(geometry.plot, pointer.x, pointer.y)) return null;
  // An item with an area wins when the pointer is inside it; of nested areas, the smallest.
  let boxed: HitArea | undefined;
  for (const hit of geometry.hitAreas) {
    if (!hit.box || !inside(hit.box, pointer.x, pointer.y)) continue;
    if (!boxed?.box || hit.box.width * hit.box.height < boxed.box.width * boxed.box.height) boxed = hit;
  }
  if (boxed) return toActiveItem(boxed);
  let best: HitArea | undefined;
  let bestDx = Number.POSITIVE_INFINITY;
  let bestDy = Number.POSITIVE_INFINITY;
  for (const hit of geometry.hitAreas) {
    const dx = Math.abs(hit.x - pointer.x);
    const dy = Math.abs(hit.y - pointer.y);
    if (dx < bestDx || (dx === bestDx && dy < bestDy)) {
      best = hit;
      bestDx = dx;
      bestDy = dy;
    }
  }
  if (!best) return null;
  if (kind === 'touch') {
    const reach = Math.max(MIN_TOUCH_TARGET / 2, spacing(geometry.hitAreas) / 2);
    if (bestDx > reach) return null;
  }
  return toActiveItem(best);
}

/**
 * Converts a client-space pointer position into SVG space, given the rendered bounding box of
 * the `<svg>` element. Adapters pass numbers; the arithmetic stays here (Art. 2).
 */
export function toSvgPoint(
  client: Readonly<{ x: number; y: number }>,
  box: Readonly<{ left: number; top: number; width: number; height: number }>,
  viewBox: Rect,
): { x: number; y: number } {
  if (box.width <= 0 || box.height <= 0) return { x: Number.NaN, y: Number.NaN };
  return {
    x: viewBox.x + ((client.x - box.left) * viewBox.width) / box.width,
    y: viewBox.y + ((client.y - box.top) * viewBox.height) / box.height,
  };
}

/** Keys that move the active item (REQ-122). */
export const NAVIGATION_KEYS: readonly string[] = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End', 'Escape'];

/**
 * Keyboard traversal of the data points, as a pure function (REQ-122). Right and down move to
 * the next point of the series, left and up to the previous one, Home and End to its ends,
 * Escape clears. On a grid — every item carries a `cell` — the arrows move by column and row
 * instead. Returns `undefined` for a key that is not a navigation key.
 */
export function stepActive(
  geometry: Geometry,
  current: ActiveItem | null,
  key: string,
): ActiveItem | null | undefined {
  if (!NAVIGATION_KEYS.includes(key)) return undefined;
  if (key === 'Escape') return null;
  const grid = geometry.hitAreas.length > 0 && geometry.hitAreas.every((hit) => hit.cell !== undefined);
  if (grid) return stepGrid(geometry.hitAreas, current, key);
  const seriesKey = current?.seriesKey ?? geometry.hitAreas[0]?.seriesKey;
  const points = geometry.hitAreas.filter((hit) => hit.seriesKey === seriesKey);
  if (points.length === 0) return null;
  const position = current ? points.findIndex((hit) => hit.index === current.index) : -1;
  let next: number;
  switch (key) {
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = points.length - 1;
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      next = position < 0 ? 0 : Math.min(position + 1, points.length - 1);
      break;
    default:
      next = position < 0 ? 0 : Math.max(position - 1, 0);
  }
  return toActiveItem(points[next] as HitArea);
}

/**
 * Grid traversal. Home and End reach the start and end of the current row, as in a spreadsheet;
 * with nothing active they reach the first and last cell in reading order.
 */
function stepGrid(hits: readonly HitArea[], current: ActiveItem | null, key: string): ActiveItem | null {
  const order = [...hits].sort((a, b) => (a.cell?.row ?? 0) - (b.cell?.row ?? 0) || (a.cell?.column ?? 0) - (b.cell?.column ?? 0));
  const here = current ? hits.find((hit) => hit.seriesKey === current.seriesKey && hit.index === current.index) : undefined;
  if (!here?.cell) return toActiveItem((key === 'End' ? order.at(-1) : order[0]) as HitArea);
  if (key === 'Home' || key === 'End') {
    const row = order.filter((hit) => hit.cell?.row === here.cell?.row);
    return toActiveItem((key === 'End' ? row.at(-1) : row[0]) as HitArea);
  }
  // An arrow moves to the nearest cell in its direction along the same row or column, so a
  // missing value is stepped over rather than walling off the items behind it (REQ-122).
  const horizontal = key === 'ArrowRight' || key === 'ArrowLeft';
  const sign = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;
  const { column, row } = here.cell;
  let next: HitArea | undefined;
  for (const hit of hits) {
    if (!hit.cell) continue;
    const along = horizontal ? hit.cell.column - column : hit.cell.row - row;
    const across = horizontal ? hit.cell.row - row : hit.cell.column - column;
    if (across !== 0 || along * sign <= 0) continue;
    const best = next?.cell ? Math.abs(horizontal ? next.cell.column - column : next.cell.row - row) : Number.POSITIVE_INFINITY;
    if (Math.abs(along) < best) next = hit;
  }
  return toActiveItem(next ?? here);
}

/** Readout of an active item, positioned as percentages of the viewBox (REQ-141). */
export interface Readout {
  readonly heading: string;
  readonly text: string;
  readonly left: string;
  readonly top: string;
  /** Sentence announced to assistive technology (REQ-122). */
  readonly announcement: string;
  /** Marker drawn over the active point. */
  readonly marker: Stroke;
}

/**
 * Builds the readout of an active item from the chart's own tabular alternative, so the
 * readout, the table and the announcement always say the same.
 */
export function readout(
  model: { readonly geometry: Geometry; readonly table: { readonly columns: readonly string[]; readonly rows: readonly (readonly string[])[] } },
  active: ActiveItem,
): Readout {
  const { geometry, table } = model;
  const column = Math.max(table.columns.indexOf(active.seriesKey), 1);
  const row = table.rows[active.index] ?? [];
  const heading = row[0] ?? '';
  const value = row[column] ?? String(active.value);
  const { viewBox } = geometry;
  const percent = (part: number, whole: number) => `${whole > 0 ? round2((part / whole) * 100) : 0}%`;
  return {
    heading,
    text: `${active.seriesKey}: ${value}`,
    left: percent(active.point.x - viewBox.x, viewBox.width),
    top: percent(active.point.y - viewBox.y, viewBox.height),
    announcement: `${table.columns[0] ?? ''} ${heading}, ${active.seriesKey} ${value}`,
    marker: { d: circlePath(active.point.x, active.point.y, 6), role: 'ornament', part: 'ink', paint: 'stroke' },
  };
}
