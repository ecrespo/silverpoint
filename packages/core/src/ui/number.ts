import { diagnose } from '../diagnostics/diagnose';

/** The bounds, step and decimals of a number field; any of them may be absent. */
export interface UiNumberRange {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  /** Decimals the value is rounded to. */
  readonly precision?: number;
}

export interface UiNumberValue {
  /** The value to render; `null` for an empty field. */
  readonly value: number | null;
  readonly corrected: boolean;
  /** The value sits on a bound: that stepper is disabled (REQ-485). */
  readonly atMin: boolean;
  readonly atMax: boolean;
}

function warn(component: string, property: string, message: string): void {
  if (process.env.NODE_ENV !== 'production') diagnose('SP017', component, { property, message });
}

/** Removes the binary noise that `0.1 + 0.2` leaves. */
const tidy = (x: number): number => Number.parseFloat(x.toPrecision(12));

/** The range as drawn: invalid bounds, step or precision left out, warned `SP017` (Data Model §2.27). */
function valid(range: UiNumberRange, component: string): UiNumberRange {
  const drop = (property: string, value: unknown, as: string): undefined => {
    warn(component, property, `${value} is ${as}.`);
    return undefined;
  };
  let min = range.min !== undefined && !Number.isFinite(range.min) ? drop('min', range.min, 'ignored') : range.min;
  let max = range.max !== undefined && !Number.isFinite(range.max) ? drop('max', range.max, 'ignored') : range.max;
  if (min !== undefined && max !== undefined && min > max) min = max = drop('min', `The bounds ${min}..${max}`, 'ignored');
  const { step: s, precision: p } = range;
  const step = s !== undefined && !(Number.isFinite(s) && s > 0) ? (drop('step', s, 'drawn as 1') ?? 1) : s;
  const precision = p !== undefined && !(Number.isInteger(p) && p >= 0 && p <= 15) ? drop('precision', p, 'ignored') : p;
  return { min, max, step, precision };
}

function clamp(value: number, { min, max, precision }: UiNumberRange): number {
  let next = value;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  if (precision !== undefined) next = Math.round(tidy(next * 10 ** precision)) / 10 ** precision;
  return tidy(next);
}

/** A number field's value clamped to `min`/`max` and rounded to `precision`; `null` stays `null` (REQ-485, REQ-486). */
export function uiNumberValue(value: number | null, range: UiNumberRange, component = 'SpInputNumber'): UiNumberValue {
  const r = valid(range, component);
  if (value === null) return { value: null, corrected: false, atMin: false, atMax: false };
  const next = Number.isFinite(value) ? clamp(value, r) : clamp(r.min ?? 0, r);
  if (next !== value) warn(component, 'value', `${value} is drawn as ${next}.`);
  return { value: next, corrected: next !== value, atMin: r.min !== undefined && next <= r.min, atMax: r.max !== undefined && next >= r.max };
}

/** One stepper press: `value ± step` from the value, else from `min ?? 0`, then clamped and rounded (REQ-485). */
export function uiNumberStep(value: number | null, direction: 1 | -1, range: UiNumberRange, component = 'SpInputNumber'): number {
  const r = valid(range, component);
  const base = value !== null && Number.isFinite(value) ? value : (r.min ?? 0);
  return clamp(base + direction * (r.step ?? 1), r);
}
