import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, circlePath, roundPathData, type SpCode } from '../src';
import { uiProgressArc, uiRateCount, uiSteps, uiValue } from '../src/ui';
import { arcPath } from '../src/charts/shared/polar';

let restore: () => void = () => {};
afterEach(() => restore());

function capture(): Array<{ code: SpCode; message: string }> {
  const seen: Array<{ code: SpCode; message: string }> = [];
  restore = __setDiagnosticSink((code, message) => seen.push({ code, message }));
  return seen;
}

const TWO_DECIMALS = /^-?\d+(?:\.\d{1,2})?$/;

describe('uiValue (T-136)', () => {
  test('REQ-302 · a value in range and on step is kept, with its exact fraction and no warning', () => {
    const seen = capture();
    expect(uiValue(30, { min: 0, max: 100, step: 1 }, 'Slider')).toEqual({ value: 30, fraction: 0.3, corrected: false });
    expect(uiValue(-5, { min: -10, max: 10, step: 5 }, 'Slider')).toEqual({ value: -5, fraction: 0.25, corrected: false });
    expect(seen).toEqual([]);
  });

  test('REQ-324 · a value out of range is clamped, and warned SP017', () => {
    const seen = capture();
    expect(uiValue(140, { min: 0, max: 100, step: 1 }, 'Slider')).toEqual({ value: 100, fraction: 1, corrected: true });
    expect(uiValue(-3, { min: 0, max: 100, step: 1 }, 'Progress')).toEqual({ value: 0, fraction: 0, corrected: true });
    expect(seen.map((s) => s.code)).toEqual(['SP017', 'SP017']);
    expect(seen[0]?.message).toMatch(/^\[SP017\] Slider: .*\(`value`\)\..*\(REQ-324\)$/);
  });

  test('REQ-324 · a value off step is rounded to the nearest step counted from min, and warned', () => {
    const seen = capture();
    expect(uiValue(7, { min: 1, max: 21, step: 5 }, 'Slider').value).toBe(6);
    expect(uiValue(9, { min: 1, max: 21, step: 5 }, 'Slider').value).toBe(11);
    expect(uiValue(0.3, { min: 0, max: 1, step: 0.1 }, 'Slider')).toEqual({ value: 0.3, fraction: 0.3, corrected: false });
    expect(uiValue(0.36, { min: 0, max: 1, step: 0.1 }, 'Slider').value).toBe(0.4);
    expect(seen.map((s) => s.code)).toEqual(['SP017', 'SP017', 'SP017']);
  });

  test('REQ-324 · a max off the step grid is never passed: the value stays on the grid', () => {
    capture();
    expect(uiValue(10, { min: 0, max: 10, step: 3 }, 'Slider').value).toBe(9);
    expect(uiValue(11, { min: 0, max: 10, step: 3 }, 'Slider').value).toBe(9);
  });

  test('REQ-324 · without a step the value is only clamped (Progress takes any value in 0..100)', () => {
    const seen = capture();
    expect(uiValue(40.5, { min: 0, max: 100 }, 'Progress')).toEqual({ value: 40.5, fraction: 0.41, corrected: false });
    expect(seen).toEqual([]);
  });

  test('REQ-324 · an invalid range falls back to 0..100 step 1, and is warned SP017', () => {
    for (const range of [
      { min: 10, max: 10, step: 1 },
      { min: 10, max: 0, step: 1 },
      { min: 0, max: 100, step: 0 },
      { min: 0, max: 100, step: -2 },
      { min: Number.NaN, max: 100, step: 1 },
      { min: 0, max: Number.POSITIVE_INFINITY, step: 1 },
    ]) {
      const seen = capture();
      expect(uiValue(50, range, 'Slider')).toEqual({ value: 50, fraction: 0.5, corrected: true });
      expect(seen.map((s) => s.code)).toEqual(['SP017']);
    }
  });

  test('REQ-324 · a value that is not a finite number becomes min, and is warned', () => {
    const seen = capture();
    expect(uiValue(Number.NaN, { min: 20, max: 40, step: 1 }, 'Slider')).toEqual({ value: 20, fraction: 0, corrected: true });
    expect(seen.map((s) => s.code)).toEqual(['SP017']);
  });

  test('REQ-302 · I-22 · every fraction is in [0, 1] with at most 2 decimals, exact at the ends', () => {
    capture();
    for (let v = -7; v <= 1007; v += 13) {
      const { fraction } = uiValue(v, { min: 0, max: 997, step: 1 }, 'Slider');
      expect(fraction).toBeGreaterThanOrEqual(0);
      expect(fraction).toBeLessThanOrEqual(1);
      expect(String(fraction)).toMatch(TWO_DECIMALS);
    }
    expect(uiValue(0, { min: 0, max: 997, step: 1 }).fraction).toBe(0);
    expect(uiValue(997, { min: 0, max: 997, step: 1 }).fraction).toBe(1);
  });
});

describe('uiRateCount (T-136)', () => {
  test('REQ-324 · a count in 1..10 is kept; outside it is clamped and warned; non-integer rounded', () => {
    const seen = capture();
    expect(uiRateCount(5, 'Rate')).toBe(5);
    expect(uiRateCount(undefined, 'Rate')).toBe(5);
    expect(seen).toEqual([]);
    expect(uiRateCount(0, 'Rate')).toBe(1);
    expect(uiRateCount(14, 'Rate')).toBe(10);
    expect(uiRateCount(3.6, 'Rate')).toBe(4);
    expect(uiRateCount(Number.NaN, 'Rate')).toBe(5);
    expect(seen.map((s) => s.code)).toEqual(['SP017', 'SP017', 'SP017', 'SP017']);
  });
});

describe('uiProgressArc (T-136)', () => {
  const frame = (stroke: number) => ({ cx: 50, cy: 50, radius: 50 - stroke / 2 });

  test('REQ-304 · the track is the exact full circle and the fill the polar engine arc, both encoding', () => {
    const { track, fill } = uiProgressArc(0.72, 8);
    expect(track).toMatchObject({ role: 'encoding', part: 'rule' });
    expect(fill).toMatchObject({ role: 'encoding', part: 'ink' });
    expect(track.d).toBe(roundPathData(circlePath(50, 50, 46)));
    expect(fill.d).toBe(roundPathData(arcPath(frame(8), 46, 0, 0.72 * 2 * Math.PI)));
  });

  test('REQ-304 · the fill starts at 12 o’clock and runs clockwise; 0 draws nothing, 1 the whole ring', () => {
    expect(uiProgressArc(0.25, 10).fill.d).toBe('M50,5A45,45,0,0,1,95,50');
    expect(uiProgressArc(0, 10).fill.d).toBe('');
    const full = uiProgressArc(1, 10).fill.d;
    expect(full.startsWith('M50,5')).toBe(true);
    expect(full.endsWith('50,5')).toBe(true);
    expect(full.match(/A/g)).toHaveLength(2);
  });

  test('REQ-302 · every coordinate carries at most 2 decimals, and a fraction outside [0, 1] is clamped', () => {
    for (const n of uiProgressArc(0.33, 7).fill.d.match(/-?\d+(?:\.\d+)?/g) ?? []) expect(n).toMatch(TWO_DECIMALS);
    expect(uiProgressArc(1.4, 8).fill.d).toBe(uiProgressArc(1, 8).fill.d);
    expect(uiProgressArc(-1, 8).fill.d).toBe('');
  });
});

describe('uiSteps (T-136)', () => {
  const items = ['install', 'import', 'configure', 'publish'].map((key) => ({ key, title: key }));

  test('REQ-302 · statuses derive from current: finish before, process at, wait after', () => {
    const seen = capture();
    expect(uiSteps(items, 2, 'Steps').map((s) => s.status)).toEqual(['finish', 'finish', 'process', 'wait']);
    expect(seen).toEqual([]);
  });

  test('REQ-302 · an explicit status wins over the derived one, so an error must be explicit', () => {
    const withError = items.map((item, i) => (i === 2 ? { ...item, status: 'error' as const } : item));
    expect(uiSteps(withError, 2, 'Steps').map((s) => s.status)).toEqual(['finish', 'finish', 'error', 'wait']);
  });

  test('REQ-304 · each connector carries the status of the step it leads to; the last has none (C-4)', () => {
    expect(uiSteps(items, 2, 'Steps').map((s) => s.connector)).toEqual(['finish', 'process', 'wait', null]);
  });

  test('REQ-324 · a current outside 0..n-1 or not an integer is clamped and rounded, and warned SP017', () => {
    const seen = capture();
    expect(uiSteps(items, 7, 'Steps').map((s) => s.status)).toEqual(['finish', 'finish', 'finish', 'process']);
    expect(uiSteps(items, -2, 'Steps').map((s) => s.status)).toEqual(['process', 'wait', 'wait', 'wait']);
    expect(uiSteps(items, 1.6, 'Steps').map((s) => s.status)).toEqual(['finish', 'finish', 'process', 'wait']);
    expect(seen.map((s) => s.code)).toEqual(['SP017', 'SP017', 'SP017']);
    expect(seen[0]?.message).toContain('`current`');
  });

  test('REQ-325 · steps sharing a key keep the first and warn SP019', () => {
    const seen = capture();
    const steps = uiSteps([...items, { key: 'import', title: 'again' }], 0, 'Steps');
    expect(steps.map((s) => s.key)).toEqual(['install', 'import', 'configure', 'publish']);
    expect(seen.map((s) => s.code)).toEqual(['SP019']);
  });

  test('REQ-302 · no items is an empty list, not an error', () => {
    capture();
    expect(uiSteps([], 0, 'Steps')).toEqual([]);
  });
});
