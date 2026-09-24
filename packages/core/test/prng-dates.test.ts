import { describe, expect, test } from 'vitest';
import { addDays, createPrng, isoDate, parseIsoDate, weekday } from '../src';

describe('seeded PRNG', () => {
  test('REQ-005 · the same seed yields the same sequence', () => {
    const a = createPrng(1592);
    const b = createPrng(1592);
    expect(Array.from({ length: 20 }, () => a())).toEqual(Array.from({ length: 20 }, () => b()));
  });

  test('REQ-005 · values lie in [0, 1) and different seeds diverge', () => {
    const values = Array.from({ length: 1000 }, createPrng(7));
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
    expect(createPrng(1)()).not.toBe(createPrng(2)());
  });

  test('REQ-004 · a frozen sequence: changing the generator changes demo data, never a patch', () => {
    const next = createPrng(1592);
    expect([next(), next(), next()].map((v) => Math.round(v * 1e6))).toEqual(FROZEN);
  });
});

describe('UTC date helpers', () => {
  test('REQ-005 · ISO dates round-trip and step by whole days in UTC', () => {
    const day = parseIsoDate('2026-06-30');
    expect(isoDate(day)).toBe('2026-06-30');
    expect(isoDate(addDays(day, 1))).toBe('2026-07-01');
    expect(isoDate(addDays(day, -181))).toBe('2025-12-31');
  });

  test('REQ-005 · across a DST change the step is still exactly one day', () => {
    expect(isoDate(addDays(parseIsoDate('2026-03-28'), 2))).toBe('2026-03-30');
    expect(isoDate(addDays(parseIsoDate('2026-10-24'), 2))).toBe('2026-10-26');
  });

  test('REQ-005 · weekday is computed in UTC, 0 = Sunday', () => {
    expect(weekday(parseIsoDate('2026-06-30'))).toBe(2);
  });

  test('REQ-008 · an invalid ISO date parses to NaN rather than throwing', () => {
    expect(Number.isNaN(parseIsoDate('not-a-date'))).toBe(true);
  });
});

// Frozen from the first run: mulberry32, seed 1592.
const FROZEN = [316898, 199560, 573400];
