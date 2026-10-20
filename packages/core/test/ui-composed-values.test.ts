import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, createPrng, type SpCode } from '../src';
import { uiInitials, uiNumberStep, uiNumberValue, uiPagination, uiPageWindow, uiSortRows } from '../src/ui';

let restore: () => void = () => {};
afterEach(() => restore());

function capture(): Array<{ code: SpCode; message: string }> {
  const seen: Array<{ code: SpCode; message: string }> = [];
  restore = __setDiagnosticSink((code, message) => seen.push({ code, message }));
  return seen;
}

describe('uiSortRows (T-202)', () => {
  const rows = [
    { id: 'a', n: 3, s: 'beta' },
    { id: 'b', n: null, s: 'Alpha' },
    { id: 'c', n: 1, s: 'gamma' },
    { id: 'd', s: 'alpha' },
    { id: 'e', n: 3, s: null },
    { id: 'f', n: 2, s: 'Beta' },
  ];
  const ids = (out: readonly { id: string }[]) => out.map((r) => r.id).join('');

  test('REQ-474 · ascending by a numeric column: ties keep input order, null and missing last in input order', () => {
    expect(ids(uiSortRows(rows, 'n'))).toBe('cfaebd');
  });

  test('REQ-474 · descending reverses the present rows only; nulls stay last, ties keep input order', () => {
    expect(ids(uiSortRows(rows, 'n', 'desc'))).toBe('aefcbd');
  });

  test('REQ-474 · strings compare by code point after lowercasing, locale-free; ties stable', () => {
    expect(ids(uiSortRows(rows, 's'))).toBe('bdafce');
    expect(ids(uiSortRows(rows, 's', 'desc'))).toBe('cafbde');
  });

  test('REQ-474 · numbers sort before strings in a mixed column', () => {
    const mixed = [{ v: 'x' }, { v: 10 }, { v: 'a' }, { v: 2 }];
    expect(uiSortRows(mixed, 'v').map((r) => r.v)).toEqual([2, 10, 'a', 'x']);
  });

  test('REQ-474 · no key keeps the order; the input is never mutated', () => {
    const before = ids(rows);
    expect(ids(uiSortRows(rows, undefined))).toBe(before);
    uiSortRows(rows, 'n', 'desc');
    expect(ids(rows)).toBe(before);
  });

  test('I-34 · for random rows the output is a permutation, nulls last, ordered and stable (fixed seed)', () => {
    const next = createPrng(20261018);
    for (let round = 0; round < 50; round++) {
      const input = Array.from({ length: 40 }, (_, i) => {
        const r = next();
        return { i, v: r < 0.15 ? null : r < 0.5 ? Math.floor(r * 10) : String.fromCharCode(97 + Math.floor(r * 5)) };
      });
      for (const order of ['asc', 'desc'] as const) {
        const out = uiSortRows(input, 'v', order);
        expect([...out].map((r) => r.i).sort((a, b) => a - b)).toEqual(input.map((r) => r.i));
        const firstNull = out.findIndex((r) => r.v === null);
        if (firstNull >= 0) expect(out.slice(firstNull).every((r) => r.v === null)).toBe(true);
        const present = out.filter((r) => r.v !== null);
        for (let k = 1; k < present.length; k++) {
          const [a, b] = [present[k - 1]!, present[k]!];
          const rank = (x: unknown) => (typeof x === 'number' ? 0 : 1);
          const cmp = rank(a.v) - rank(b.v) || (a.v! < b.v! ? -1 : a.v! > b.v! ? 1 : 0);
          const signed = order === 'asc' ? cmp : -cmp;
          expect(signed).toBeLessThanOrEqual(0);
          if (cmp === 0) expect(a.i).toBeLessThan(b.i);
        }
      }
    }
  });
});

describe('uiPageWindow and uiPagination (T-202)', () => {
  /** Reflex 0.7's `spPageWindow`, the reference of Data Model §2.27. */
  function reference(count: number, current: number, siblings: number) {
    const pages: (number | string)[] = [1];
    const first = Math.max(2, current - siblings);
    const last = Math.min(count - 1, current + siblings);
    if (first > 2) pages.push('start-gap');
    for (let p = first; p <= last; p++) pages.push(p);
    if (last < count - 1) pages.push('end-gap');
    if (count > 1) pages.push(count);
    return pages;
  }

  test('REQ-476 · matches the reference for counts 1..12 × every current × siblings 0..2', () => {
    for (let count = 1; count <= 12; count++)
      for (let current = 1; current <= count; current++)
        for (let siblings = 0; siblings <= 2; siblings++)
          expect(uiPageWindow(count, current, siblings), `${count}/${current}/${siblings}`).toEqual(reference(count, current, siblings));
  });

  test('REQ-476 · reads as a pagination: both gaps in the middle', () => {
    expect(uiPageWindow(20, 10, 1)).toEqual([1, 'start-gap', 9, 10, 11, 'end-gap', 20]);
    expect(uiPageWindow(1, 1, 1)).toEqual([1]);
  });

  test('REQ-476 · pages, current and the start–end of total', () => {
    expect(uiPagination(95, 10, 3)).toEqual({ count: 10, current: 3, start: 21, end: 30, corrected: false });
    expect(uiPagination(95, 10, 10)).toEqual({ count: 10, current: 10, start: 91, end: 95, corrected: false });
    expect(uiPagination(0, 10, 1)).toEqual({ count: 1, current: 1, start: 0, end: 0, corrected: false });
  });

  test('REQ-486 · a current page out of range is clamped and warned SP017', () => {
    const seen = capture();
    expect(uiPagination(95, 10, 14).current).toBe(10);
    expect(uiPagination(95, 10, 0).current).toBe(1);
    expect(uiPagination(95, 10, 2.6).current).toBe(3);
    expect(uiPagination(95, 10, 14).corrected).toBe(true);
    expect(seen.map((s) => s.code)).toEqual(['SP017', 'SP017', 'SP017']);
    expect(seen[0]?.message).toMatch(/^\[SP017\] SpPagination: .*\(`current`\)/);
  });

  test('REQ-486 · an invalid total or page size falls back to 0 and 10, warned SP017', () => {
    const seen = capture();
    expect(uiPagination(-4, 10, 1)).toMatchObject({ count: 1, start: 0, corrected: true });
    expect(uiPagination(30, 0, 2)).toMatchObject({ count: 3, current: 2, start: 11, end: 20, corrected: true });
    expect(uiPagination(Number.NaN, 2.5, 1)).toMatchObject({ count: 1, corrected: true });
    expect(seen.map((s) => s.code)).toEqual(['SP017', 'SP017', 'SP017', 'SP017']);
  });
});

describe('uiNumberValue and uiNumberStep (T-203)', () => {
  test('REQ-485 · a value in range is kept; bounds are reported', () => {
    const seen = capture();
    expect(uiNumberValue(4, { min: 0, max: 10 })).toMatchObject({ value: 4, corrected: false, atMin: false, atMax: false });
    expect(uiNumberValue(0, { min: 0, max: 10 })).toMatchObject({ value: 0, corrected: false, atMin: true, atMax: false });
    expect(uiNumberValue(10, { max: 10 })).toMatchObject({ value: 10, corrected: false, atMin: false, atMax: true });
    expect(seen).toEqual([]);
  });

  test('REQ-485 · null is a valid, empty value', () => {
    expect(uiNumberValue(null, { min: 0, max: 10 })).toMatchObject({ value: null, corrected: false, atMin: false, atMax: false });
  });

  test('REQ-486 · out of range is clamped, off precision rounded, both warned SP017', () => {
    const seen = capture();
    expect(uiNumberValue(14, { min: 0, max: 10 })).toMatchObject({ value: 10, corrected: true, atMax: true });
    expect(uiNumberValue(3.14159, { precision: 2 })).toMatchObject({ value: 3.14, corrected: true });
    expect(uiNumberValue(2.5, { precision: 0 }).value).toBe(3);
    expect(seen.map((s) => s.code)).toEqual(['SP017', 'SP017', 'SP017']);
    expect(seen[0]?.message).toMatch(/^\[SP017\] SpInputNumber: .*\(`value`\)/);
  });

  test('REQ-486 · invalid bounds are ignored and warned SP017; the value is then only rounded', () => {
    const seen = capture();
    expect(uiNumberValue(50, { min: 10, max: 0 }).value).toBe(50);
    expect(uiNumberValue(30, { min: Number.NaN, max: 40 }).value).toBe(30);
    expect(seen.map((s) => s.code)).toEqual(['SP017', 'SP017']);
  });

  test('REQ-485 · stepping adds or subtracts step, then clamps and rounds; from null it starts at min, else 0', () => {
    expect(uiNumberStep(4, 1, { min: 0, max: 5 })).toBe(5);
    expect(uiNumberStep(5, 1, { min: 0, max: 5 })).toBe(5);
    expect(uiNumberStep(0.1, 1, { step: 0.2 })).toBe(0.3);
    expect(uiNumberStep(null, 1, { min: 3, step: 2 })).toBe(5);
    expect(uiNumberStep(null, -1, {})).toBe(-1);
    expect(uiNumberStep(1, -1, { step: 0.25, precision: 1 })).toBe(0.8);
  });

  test('REQ-486 · an invalid step is 1, warned SP017', () => {
    const seen = capture();
    expect(uiNumberStep(2, 1, { step: 0 })).toBe(3);
    expect(seen.map((s) => s.code)).toEqual(['SP017']);
  });
});

describe('uiInitials (T-203)', () => {
  test.each([
    ['Ada Lovelace', 'AL'],
    ['ada', 'A'],
    ['Leonardo da Vinci', 'LD'],
    ['jean-baptiste', 'JB'],
    ['  María   Ñúñez ', 'MÑ'],
    ['', '?'],
    [undefined, '?'],
  ])('REQ-478 · %j → %s', (name, initials) => {
    expect(uiInitials(name)).toBe(initials);
  });
});
