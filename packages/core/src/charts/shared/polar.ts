import type { Accessor, Datum, Rect, TextLabel } from '../../types';
import { diagnose } from '../../diagnostics/diagnose';
import { PLOT_INSET } from './cartesian';
import { finite, warnValue } from './cells';
import { accessorName, formatCategory, read } from './format';

/**
 * The polar frame (T-071): a circle centred in the drawing area. Angles are radians measured
 * clockwise from 12 o'clock — d3-shape's convention — so a sweep reads like a clock face.
 */
export interface PolarFrame {
  readonly cx: number;
  readonly cy: number;
  /** Largest radius that fits the area's shorter side, inset so no stroke is clipped. */
  readonly radius: number;
}

export function polarFrame(area: Rect): PolarFrame {
  return {
    cx: area.x + area.width / 2,
    cy: area.y + area.height / 2,
    radius: Math.max(Math.min(area.width, area.height) / 2 - PLOT_INSET, 1),
  };
}

/** The point at `angle` on the circle of radius `r`. */
export function pointAt(frame: PolarFrame, angle: number, r: number): { x: number; y: number } {
  return { x: frame.cx + r * Math.sin(angle), y: frame.cy - r * Math.cos(angle) };
}

const TAU = 2 * Math.PI;
/** Below this sweep an arc has no extent to draw. */
const EPSILON = 1e-9;

const at = (frame: PolarFrame, angle: number, r: number) => {
  const p = pointAt(frame, angle, r);
  return `${p.x},${p.y}`;
};

/** An arc command from the current point to `end` along radius `r`, in the given direction. */
function arcTo(frame: PolarFrame, r: number, start: number, end: number, clockwise: boolean): string {
  const large = Math.abs(end - start) > Math.PI ? 1 : 0;
  return `A${r},${r},0,${large},${clockwise ? 1 : 0},${at(frame, end, r)}`;
}

/** An arc along radius `r` from `start` to `end` that never degenerates: a full turn is two halves. */
function sweep(frame: PolarFrame, r: number, start: number, end: number, clockwise: boolean): string {
  if (Math.abs(end - start) < TAU - EPSILON) return arcTo(frame, r, start, end, clockwise);
  const middle = (start + end) / 2;
  return arcTo(frame, r, start, middle, clockwise) + arcTo(frame, r, middle, end, clockwise);
}

/** An open arc along one radius, from `start` to `end` (clockwise when `end > start`). */
export function arcPath(frame: PolarFrame, r: number, start: number, end: number): string {
  if (Math.abs(end - start) < EPSILON || r <= 0) return '';
  return `M${at(frame, start, r)}${sweep(frame, r, start, end, end > start)}`;
}

export interface SectorShape {
  readonly inner: number;
  readonly outer: number;
  readonly start: number;
  readonly end: number;
}

/**
 * A closed ring slice: out along the outer arc, across, and back along the inner arc. With no
 * inner radius it is a wedge from the centre. The arcs are exact SVG arcs, never polylines.
 */
export function sectorPath(frame: PolarFrame, shape: SectorShape): string {
  const { inner, outer, start, end } = shape;
  if (Math.abs(end - start) < EPSILON || outer <= 0) return '';
  const clockwise = end > start;
  const outerArc = `M${at(frame, start, outer)}${sweep(frame, outer, start, end, clockwise)}`;
  if (inner <= 0) return `${outerArc}L${frame.cx},${frame.cy}Z`;
  return `${outerArc}L${at(frame, end, inner)}${sweep(frame, inner, end, start, !clockwise)}Z`;
}

/** Half-width of the band around the poles where a label is centred rather than side-anchored. */
const POLE = 0.1;

/** A label on the circle of radius `r` at `angle`, anchored so it reads away from the circle. */
export function polarLabel(frame: PolarFrame, angle: number, r: number, text: string, kind: TextLabel['kind'] = 'tick'): TextLabel {
  const p = pointAt(frame, angle, r);
  const side = Math.sin(angle);
  const anchor = side > POLE ? 'start' : side < -POLE ? 'end' : 'middle';
  // Baseline a third of the cap height below the point, so the text sits centred on it.
  return { x: p.x, y: p.y + 3, text, kind, part: 'axis', anchor };
}

export interface Sector {
  readonly index: number;
  readonly datum: Datum;
  readonly name: string;
  readonly value: number;
}

/**
 * Reads a sector series (Data Model §2.2): a value must be finite and `≥ 0` — a negative angle does
 * not exist — or the row is warned `SP002` and dropped; a repeated name is made unique.
 */
export function readSectors(
  data: readonly Datum[],
  nameKey: Accessor<string>,
  valueKey: Accessor<number | null | undefined>,
  chart: string,
  locale: string,
): Sector[] {
  const valueName = accessorName(valueKey, 'value');
  const seen = new Map<string, number>();
  const sectors: Sector[] = [];
  data.forEach((datum, index) => {
    const value = finite(read(valueKey, datum, index));
    if (value === undefined || value < 0) {
      warnValue(chart, valueName, `Row ${index} has a ${valueName} of ${String(read(valueKey, datum, index))}; a sector needs a finite value ≥ 0, so it is omitted.`);
      return;
    }
    const raw = formatCategory(read(nameKey, datum, index), locale);
    const count = (seen.get(raw) ?? 0) + 1;
    seen.set(raw, count);
    if (count > 1) warnValue(chart, accessorName(nameKey, 'name'), `The name "${raw}" repeats; row ${index} is shown as "${raw} (${count})".`);
    sectors.push({ index, datum, name: count > 1 ? `${raw} (${count})` : raw, value });
  });
  return sectors;
}

/** Sectors a polar chart draws before it recommends aggregation (API Spec §12). */
export const SECTORS_PER_CHART = 60;

/** Warns SP008 above the polar ceiling; the chart is still drawn in full (REQ-096). */
export function checkSectors(chart: string, property: string, count: number): void {
  if (process.env.NODE_ENV === 'production' || count <= SECTORS_PER_CHART) return;
  diagnose('SP008', chart, { property, message: `${count} sectors; the ceiling is ${SECTORS_PER_CHART}.` });
}
