import { describe, expect, test } from 'vitest';
import {
  deriveSeed,
  fnv1a32,
  lineChart,
  parseGeometry,
  resolveSeed,
  round2,
  roundGeometry,
  roundPathData,
  serializeGeometry,
  type Geometry,
  type RecipeContext,
} from '../src';

const context: RecipeContext = {
  id: 'sp-line-chart-demo',
  width: 320,
  locale: 'en',
  emptyState: { text: 'No data', rule: true },
  domainPadding: 0.1,
};

function numbersIn(geometry: Geometry): number[] {
  const json = serializeGeometry(geometry);
  const found: number[] = [];
  JSON.parse(json, (_key, value: unknown) => {
    if (typeof value === 'number') found.push(value);
    if (typeof value === 'string') {
      for (const token of value.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []) found.push(Number(token));
    }
    return value;
  });
  return found;
}

describe('serialisation', () => {
  test('REQ-011 · geometry survives a JSON round trip without loss', () => {
    const { geometry } = lineChart.build({}, context);
    const roundTripped = JSON.parse(JSON.stringify(geometry));
    expect(roundTripped).toEqual(geometry);
    expect(parseGeometry(serializeGeometry(geometry))).toEqual(geometry);
  });

  test('REQ-011 · geometry carries no functions', () => {
    const { geometry } = lineChart.build({}, context);
    const walk = (value: unknown): void => {
      expect(typeof value).not.toBe('function');
      if (value && typeof value === 'object') Object.values(value).forEach(walk);
    };
    walk(geometry);
  });
});

describe('rounding', () => {
  test('REQ-002 · round2 keeps at most 2 decimals and never emits -0', () => {
    expect(round2(1.23456)).toBe(1.23);
    expect(round2(-0.001)).toBe(0);
    expect(Object.is(round2(-0.001), -0)).toBe(false);
    expect(round2(10)).toBe(10);
    expect(roundPathData('M1.23456,2.5L-3.14159,4e-7C1,2,3,4,5.555,6')).toBe('M1.23,2.5L-3.14,0C1,2,3,4,5.56,6');
  });

  test('REQ-002 · no emitted coordinate carries more than 2 decimals', () => {
    const { geometry } = lineChart.build({ title: 'Throughput', value: 1284.5678 }, context);
    for (const value of numbersIn(geometry)) {
      expect(Math.abs(value * 100 - Math.round(value * 100))).toBeLessThan(1e-6);
    }
  });

  test('REQ-002 · hit-area boxes are rounded to 2 decimals as well', () => {
    const box = { x: 0, y: 0, width: 1, height: 1 };
    const rounded = roundGeometry({
      viewBox: box,
      plot: box,
      strokes: [],
      labels: [],
      defs: [],
      hitAreas: [{ seriesKey: 's', index: 0, datum: {}, value: 1, x: 1.234, y: 5.678, box: { x: 0.123, y: 1.005, width: 2.555, height: 3.14159 } }],
    });
    expect(rounded.hitAreas[0]?.box).toEqual({ x: 0.12, y: 1, width: 2.56, height: 3.14 });
  });

  test('REQ-002 · roundGeometry is idempotent', () => {
    const { geometry } = lineChart.build({}, context);
    expect(roundGeometry(geometry)).toEqual(geometry);
  });
});

describe('seed', () => {
  test('REQ-003 · the same identifier always derives the same seed', () => {
    expect(deriveSeed('sp-line-chart-a')).toBe(deriveSeed('sp-line-chart-a'));
    expect(resolveSeed(undefined, 'x')).toBe(deriveSeed('x'));
    expect(resolveSeed(42, 'x')).toBe(42);
    expect(resolveSeed('seed', 'x')).toBe(fnv1a32('seed'));
    expect(resolveSeed(-1, 'x')).toBe(4294967295);
  });

  // Changing the derivation is a major change (DD-006): these pairs are frozen.
  test.each([
    ['', 2166136261],
    ['a', 3826002220],
    ['foobar', 3214735720],
    ['sp-line-chart-demo', 2738029426],
    ['hélice ✎', 1472852164],
  ])('REQ-003 · frozen FNV-1a pair %j → %i', (input, expected) => {
    expect(fnv1a32(input)).toBe(expected);
  });

  test('REQ-005 · the same render requested twice produces identical output', () => {
    const a = lineChart.build({ title: 'Twice' }, context);
    const b = lineChart.build({ title: 'Twice' }, context);
    expect(serializeGeometry(a.geometry)).toBe(serializeGeometry(b.geometry));
  });
});
