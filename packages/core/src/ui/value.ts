import { diagnose } from '../diagnostics/diagnose';
import { round2 } from '../render/round';

/** A linear value's domain. Without `step` the value is only clamped (Progress). */
export interface UiRange {
  readonly min: number;
  readonly max: number;
  readonly step?: number;
}

export interface UiValue {
  /** The value to render: clamped, on its step. */
  readonly value: number;
  /** Where it sits along its range, in [0, 1] with 2 decimals (DD-025, I-22). */
  readonly fraction: number;
  /** The input was not drawable as given. */
  readonly corrected: boolean;
}

const DEFAULT_RANGE: UiRange = { min: 0, max: 100, step: 1 };

function warn(component: string, property: string, message: string): void {
  if (process.env.NODE_ENV !== 'production') diagnose('SP017', component, { property, message });
}

/** Removes the binary noise that `min + n * step` leaves (`0.30000000000000004`). */
const tidy = (x: number): number => Number.parseFloat(x.toPrecision(12));

function validRange(range: UiRange, component: string): UiRange {
  const { min, max, step } = range;
  const stepOk = step === undefined || (Number.isFinite(step) && step > 0);
  if (Number.isFinite(min) && Number.isFinite(max) && min < max && stepOk) return range;
  warn(component, 'min', `The range ${min}..${max} step ${step} is not valid; 0..100 step 1 is used.`);
  return DEFAULT_RANGE;
}

/**
 * A value on its range: clamped, rounded to the nearest step counted from `min` (never past `max`
 * when `max` is off the step grid), and its exact fraction. Anything corrected warns `SP017`
 * (REQ-324). Pure apart from the development warning.
 */
export function uiValue(value: number, range: UiRange, component = 'UiValue'): UiValue {
  const valid = validRange(range, component);
  const { min, max, step } = valid;
  let next = Number.isFinite(value) ? Math.min(Math.max(value, min), max) : min;
  if (step !== undefined) {
    const steps = Math.min(Math.round((next - min) / step), Math.floor(tidy((max - min) / step)));
    next = tidy(min + steps * step);
  }
  const corrected = valid !== range || next !== value;
  if (next !== value) warn(component, 'value', `${value} is drawn as ${next}.`);
  return { value: next, fraction: round2((next - min) / (max - min)), corrected };
}

/** A Rate's `count`: an integer in 1..10, default 5; anything else corrected with `SP017`. */
export function uiRateCount(count: number | undefined, component = 'SpRate'): number {
  if (count === undefined) return 5;
  const next = Number.isFinite(count) ? Math.min(Math.max(Math.round(count), 1), 10) : 5;
  if (next !== count) warn(component, 'count', `${count} is drawn as ${next}.`);
  return next;
}
