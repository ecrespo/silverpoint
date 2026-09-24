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

/** A consumer-supplied tone, rounded and held to 0-4. */
export function toneLevel(raw: number): ToneLevel {
  return Math.min(Math.max(Math.round(raw), 0), 4) as ToneLevel;
}

/** A value outside what the chart can draw: it is corrected or dropped, and warned (SP002). */
export function warnValue(chart: string, property: string, message: string): void {
  if (process.env.NODE_ENV !== 'production') diagnose('SP002', chart, { property, message });
}
