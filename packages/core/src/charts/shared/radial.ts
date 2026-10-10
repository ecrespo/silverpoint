/**
 * The grid of the polar line and the polar scatter (REQ-420, REQ-421): a radius scale from 0 with a
 * ring at each tick, and spokes at the angle's natural steps, named at the rim. The grid carries no
 * data (ornament); the angle is in the units of `period`, clockwise from `startAngle`.
 */
import { linearScale, type LinearScale } from '../../scales/scales';
import type { Stroke, TextLabel } from '../../types';
import { circlePath, formatNumber } from './format';
import { RIM_LABELS, pointAt, polarLabel, type PolarFrame } from './polar';

const TURN = 2 * Math.PI;

/** The angle in radians, clockwise from 12 o'clock, of `angle` in units of `period`. */
export function angleOf(angle: number, period: number, startAngle: number): number {
  return (startAngle / 360) * TURN + (angle / period) * TURN;
}

/**
 * A radius scale from 0 to the largest value, niced, with a ring and its value at each tick (the
 * values at 12 o'clock, as the radar's).
 */
export function radialAxis(
  frame: PolarFrame,
  largest: number,
  options: { readonly chart: string; readonly property: string; readonly locale: string; readonly numberFormat: Intl.NumberFormatOptions | undefined },
): { scale: LinearScale; strokes: Stroke[]; labels: TextLabel[] } {
  const scale = linearScale([0, largest > 0 ? largest : 1], [0, frame.radius], { chart: options.chart, property: options.property, padding: 0, nice: true, fromZero: true });
  const strokes: Stroke[] = [];
  const labels: TextLabel[] = [];
  for (const tick of scale.ticks(3)) {
    const r = scale(tick);
    if (r <= 0) continue;
    strokes.push({ d: circlePath(frame.cx, frame.cy, r), role: 'ornament', part: 'grid', paint: 'stroke' });
    // A ring by the rim would put its value under the angle named at 12 o'clock; the inner rings give the scale.
    if (r > frame.radius - RIM_LABELS) continue;
    labels.push({ x: frame.cx + 3, y: frame.cy - r - 2, text: formatNumber(tick, options.locale, options.numberFormat), kind: 'tick', part: 'axis', anchor: 'start' });
  }
  return { scale, strokes, labels };
}

/**
 * Spokes at the angle's steps: one per unit when the period is a whole number up to 24 (months,
 * hours), else every eighth of a turn; each named at the rim in the angle's own units.
 */
export function angleSpokes(frame: PolarFrame, period: number, startAngle: number, locale: string): { strokes: Stroke[]; labels: TextLabel[] } {
  const steps = Number.isInteger(period) && period <= 24 ? period : 8;
  const strokes: Stroke[] = [];
  const labels: TextLabel[] = [];
  for (let k = 0; k < steps; k += 1) {
    const value = (period * k) / steps;
    const angle = angleOf(value, period, startAngle);
    const end = pointAt(frame, angle, frame.radius);
    strokes.push({ d: `M${frame.cx},${frame.cy}L${end.x},${end.y}`, role: 'ornament', part: 'grid' });
    labels.push(polarLabel(frame, angle, frame.radius + 7, formatNumber(value, locale, { maximumFractionDigits: 1 })));
  }
  return { strokes, labels };
}
