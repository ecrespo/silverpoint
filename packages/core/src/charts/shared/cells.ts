import { diagnose } from '../../diagnostics/diagnose';
import type { Rect, ToneLevel } from '../../types';

/** Closed path of a rectangle, clockwise from its top-left corner. */
export function rectPath(rect: Rect): string {
  const { x, y, width, height } = rect;
  return `M${x},${y}H${x + width}V${y + height}H${x}Z`;
}

/** A rectangle shrunk by `by` on every side, never below zero size. */
export function inset(rect: Rect, by: number): Rect {
  return {
    x: rect.x + by,
    y: rect.y + by,
    width: Math.max(rect.width - 2 * by, 0),
    height: Math.max(rect.height - 2 * by, 0),
  };
}

/** A finite number, or `undefined`. */
export function finite(raw: unknown): number | undefined {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
}

/**
 * Tonal level of a value normalised to 0-1: none at or below 0, then quarters (Data Model §3.4).
 * The tone always repeats a value the chart also prints or draws by length or size (REQ-124).
 */
export function toneOf(ratio: number): ToneLevel {
  if (!(ratio > 0)) return 0;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * Side of a mark, as a share of its slot, per tone: where a value cannot be printed, its size
 * carries the level the tone shows, so it survives `precision` mode (REQ-124). The heatmap's cells
 * when their values do not fit, the density bins always.
 */
export const TONE_SCALE: Readonly<Record<ToneLevel, number>> = { 0: 0.4, 1: 0.55, 2: 0.7, 3: 0.85, 4: 1 };

/** A consumer-supplied tone, rounded and held to 0-4. */
export function toneLevel(raw: number): ToneLevel {
  return Math.min(Math.max(Math.round(raw), 0), 4) as ToneLevel;
}

/** A value outside what the chart can draw: it is corrected or dropped, and warned (SP002). */
export function warnValue(chart: string, property: string, message: string): void {
  if (process.env.NODE_ENV !== 'production') diagnose('SP002', chart, { property, message });
}

const RING_TONES: readonly ToneLevel[] = [1, 2, 3, 4];

/**
 * The tone of sector `index` of `count` around a closed ring: the ramp in turn, and the last sector
 * never repeats the first, its neighbour across 12 o'clock. Tone only repeats what the legend and
 * the printed shares say (REQ-124). Every chart with categories tones them this way — a ring, a
 * waffle, a mosaic, a hierarchy's first level, a network's groups (DD-032, REQ-440).
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
