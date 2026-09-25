import type { Accessor, Datum, Rect, Stroke, TextLabel, ToneLevel } from '../../types';
import { diagnose } from '../../diagnostics/diagnose';
import { PLOT_INSET } from './cartesian';
import { finite, rectPath, warnValue } from './cells';
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

/** `labelRoom` keeps a margin around the circle for names printed outside it. */
export function polarFrame(area: Rect, labelRoom = 0): PolarFrame {
  return {
    cx: area.x + area.width / 2,
    cy: area.y + area.height / 2,
    radius: Math.max(Math.min(area.width, area.height) / 2 - PLOT_INSET - labelRoom, 1),
  };
}

/** Room outside a circle for the names printed around it. */
export const RIM_LABELS = 14;

/**
 * Names around the rim, one per slot at its middle angle, thinned so no more than `most` are
 * printed; the table and the readout name every slot.
 */
export function rimLabels(frame: PolarFrame, entries: readonly { readonly angle: number; readonly text: string }[], most = 24): TextLabel[] {
  const step = Math.max(1, Math.ceil(entries.length / most));
  return entries.filter((_, i) => i % step === 0).map((e) => polarLabel(frame, e.angle, frame.radius + 8, e.text));
}

/** The point at `angle` on the circle of radius `r`. */
export function pointAt(frame: PolarFrame, angle: number, r: number): { x: number; y: number } {
  return { x: frame.cx + r * Math.sin(angle), y: frame.cy - r * Math.cos(angle) };
}

/** Below this sweep an arc has no extent to draw. */
const EPSILON = 1e-9;

const at = (frame: PolarFrame, angle: number, r: number) => {
  const p = pointAt(frame, angle, r);
  return `${p.x},${p.y}`;
};

/** An arc command of at most half a turn from the current point to `end` along radius `r`. */
function arcTo(frame: PolarFrame, r: number, end: number, clockwise: boolean): string {
  return `A${r},${r},0,0,${clockwise ? 1 : 0},${at(frame, end, r)}`;
}

/**
 * An arc along radius `r` from `start` to `end` that never degenerates: past half a turn it is drawn
 * as two halves, so a sweep near a full turn never rounds to an arc that ends where it starts.
 */
function sweep(frame: PolarFrame, r: number, start: number, end: number, clockwise: boolean): string {
  if (Math.abs(end - start) <= Math.PI) return arcTo(frame, r, end, clockwise);
  const middle = (start + end) / 2;
  return arcTo(frame, r, middle, clockwise) + arcTo(frame, r, end, clockwise);
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
  nameKey: Accessor<string | number>,
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
    const given = read(nameKey, datum, index);
    if (given === undefined || given === null || given === '') warnValue(chart, accessorName(nameKey, 'name'), `Row ${index} has no name; it is shown as "—".`);
    const raw = formatCategory(given, locale);
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

const RING_TONES: readonly ToneLevel[] = [1, 2, 3, 4];

/**
 * The tone of sector `index` of `count` around a closed ring: the ramp in turn, and the last sector
 * never repeats the first, its neighbour across 12 o'clock. Tone only repeats what the legend and
 * the printed shares say (REQ-124).
 */
export function ringTone(index: number, count: number): ToneLevel {
  const tone = RING_TONES[index % RING_TONES.length] as ToneLevel;
  if (count > 1 && index === count - 1 && tone === RING_TONES[0]) return RING_TONES[2] as ToneLevel;
  return tone;
}

/**
 * The tones of a ring's sectors, counted over the drawn ones only: a zero sector is not drawn, so it
 * must not hold a place in the ramp, or two drawn neighbours could share a tone. A zero sector takes
 * the tone its place would have, for its legend swatch.
 */
export function ringTones(values: readonly number[]): ToneLevel[] {
  const drawn = values.filter((v) => v > 0).length;
  let k = 0;
  return values.map((v) => (v > 0 ? ringTone(k++, drawn) : ringTone(Math.min(k, Math.max(drawn - 1, 0)), drawn)));
}

/** Height of one legend row. */
const LEGEND_ROW = 14;

export interface SectorLegendEntry {
  readonly name: string;
  readonly share: string;
  readonly tone: ToneLevel;
}

/**
 * A legend column: a toned swatch (ornament: it carries no data), the sector's name and its share,
 * in the ring's clockwise order. Rows that do not fit end in "+N more"; the table lists them all.
 */
export function sectorLegend(area: Rect, entries: readonly SectorLegendEntry[]): { strokes: Stroke[]; labels: TextLabel[] } {
  const strokes: Stroke[] = [];
  const labels: TextLabel[] = [];
  const fits = Math.max(Math.floor(area.height / LEGEND_ROW), 1);
  const shown = entries.length > fits ? fits - 1 : entries.length;
  const top = area.y + (area.height - Math.min(entries.length, fits) * LEGEND_ROW) / 2;
  entries.slice(0, shown).forEach((entry, row) => {
    const y = top + row * LEGEND_ROW;
    strokes.push({ d: rectPath({ x: area.x, y: y + 3, width: 9, height: 7 }), role: 'ornament', part: 'ink', tone: entry.tone });
    labels.push({ x: area.x + 14, y: y + 10, text: entry.name, kind: 'tick', part: 'text', anchor: 'start' });
    labels.push({ x: area.x + area.width, y: y + 10, text: entry.share, kind: 'tick', part: 'axis', anchor: 'end' });
  });
  if (shown < entries.length) {
    labels.push({ x: area.x + 14, y: top + shown * LEGEND_ROW + 10, text: `+${entries.length - shown} more`, kind: 'tick', part: 'axis', anchor: 'start' });
  }
  return { strokes, labels };
}
