/**
 * T-165 · `charts/shared/stats.ts` and `density.ts` (DD-029, REQ-432). Reference values were
 * computed independently with NumPy 2.3.5, by this command (n^(−1/5) unrounded there):
 *
 *   python3 -I -c "import numpy as np; x=np.array([2,4,4,5,7,9,10,12,15,21.]);
 *     print([np.quantile(x,p) for p in (0,.1,.25,.5,.75,.9,1)]); q1,q3=np.quantile(x,[.25,.75]);
 *     s=x.std(ddof=1); h=.9*min(s,(q3-q1)/1.34)*len(x)**-.2; a=np.linspace(x.min()-h,x.max()+h,64);
 *     K=lambda u: np.where(abs(u)<=1,.75*(1-u*u),0); print(s,h,[K((t-x)/h).sum()/(len(x)*h) for t in a])"
 */
import { describe, expect, test } from 'vitest';
import { createPrng } from '../src/render/prng';
import { DENSITY_SAMPLES, kde, silverman } from '../src/charts/shared/density';
import { bins, ecdf, fiveNumber, niceStep, quantile, rank, rootOf, sortedValues, sturges } from '../src/charts/shared/stats';

const X = sortedValues([12, 2, 4, 21, 4, 5, 9, 7, 10, 15]);
const close = (actual: number, expected: number, tolerance = 1e-12) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);

function shuffled<T>(values: readonly T[], seed: number): T[] {
  const random = createPrng(seed);
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

describe('T-165 · quantiles (Hyndman–Fan type 7, REQ-432)', () => {
  test('REQ-432 · match NumPy\'s default on the reference sample', () => {
    const expected = [2, 3.8, 4.25, 8, 11.5, 15.599999999999998, 21];
    [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].forEach((p, i) => close(quantile(X, p), expected[i] as number));
  });

  test('REQ-432 · n = 1 and all ties return the value', () => {
    expect(quantile([7], 0.3)).toBe(7);
    expect(quantile([3, 3, 3], 0.75)).toBe(3);
  });

  test('REQ-432 · negative values', () => {
    close(quantile(sortedValues([-5, -1, -3]), 0.25), -4);
  });

  test('REQ-432 · the sorted copy leaves its input untouched', () => {
    const input = [3, 1, 2];
    expect(sortedValues(input)).toEqual([1, 2, 3]);
    expect(input).toEqual([3, 1, 2]);
  });
});

describe('T-165 · five-number summary (Tukey, 1.5 IQR)', () => {
  test('REQ-402 · whisker ends are the extreme observations inside the fences', () => {
    expect(fiveNumber(X)).toEqual({ min: 2, q1: 4.25, median: 8, q3: 11.5, max: 21, outliers: [] });
  });

  test('REQ-402 · an observation past the fence is an outlier, and the whisker stops short of it', () => {
    const summary = fiveNumber(sortedValues([1, 2, 3, 4, 5, 6, 7, 8, 9, 40]));
    expect(summary).toEqual({ min: 1, q1: 3.25, median: 5.5, q3: 7.75, max: 9, outliers: [40] });
  });

  test('REQ-402 · a whisker of 0 ends at the box: every observation outside the quartiles is an outlier', () => {
    const summary = fiveNumber(X, 0);
    expect(summary.outliers).toEqual([2, 4, 4, 12, 15, 21]);
    expect([summary.min, summary.max]).toEqual([4.25, 11.5]);
  });

  test('REQ-402 · IQR = 0 and n = 1', () => {
    expect(fiveNumber([4, 4, 4, 4, 9])).toEqual({ min: 4, q1: 4, median: 4, q3: 4, max: 4, outliers: [9] });
    expect(fiveNumber([6])).toEqual({ min: 6, q1: 6, median: 6, q3: 6, max: 6, outliers: [] });
  });

  test('REQ-402 · I-24 · min ≤ q1 ≤ median ≤ q3 ≤ max on random samples', () => {
    const random = createPrng(7);
    for (let run = 0; run < 50; run += 1) {
      const sample = sortedValues(Array.from({ length: 1 + Math.floor(random() * 60) }, () => Math.round((random() - 0.3) * 1000) / 10));
      const s = fiveNumber(sample);
      expect(s.min <= s.q1 && s.q1 <= s.median && s.median <= s.q3 && s.q3 <= s.max).toBe(true);
    }
  });
});

describe('T-165 · bins (Freedman–Diaconis, snapped to a nice step; Sturges at IQR = 0)', () => {
  test('REQ-400 · the default: FD width 6.73 snaps to 5, edges on multiples of 5', () => {
    expect(bins(X)).toEqual([
      { x0: 0, x1: 5, count: 3 },
      { x0: 5, x1: 10, count: 3 },
      { x0: 10, x1: 15, count: 2 },
      { x0: 15, x1: 20, count: 1 },
      { x0: 20, x1: 25, count: 1 },
    ]);
  });

  test('REQ-400 · a count asks for that many equal bins over the niced extent', () => {
    expect(bins(X, 4)).toEqual([
      { x0: 0, x1: 6.25, count: 4 },
      { x0: 6.25, x1: 12.5, count: 4 },
      { x0: 12.5, x1: 18.75, count: 1 },
      { x0: 18.75, x1: 25, count: 1 },
    ]);
  });

  test('REQ-400 · thresholds are the inner edges; the data extent closes the ends', () => {
    expect(bins(X, [5, 10, 15])).toEqual([
      { x0: 2, x1: 5, count: 3 },
      { x0: 5, x1: 10, count: 3 },
      { x0: 10, x1: 15, count: 2 },
      { x0: 15, x1: 21, count: 2 },
    ]);
  });

  test('REQ-400 · IQR = 0 falls back to Sturges', () => {
    expect(sturges(5)).toBe(4);
    expect(sturges(1)).toBe(1);
    expect(sturges(1000)).toBe(11);
    const result = bins([3, 3, 3, 3, 8]);
    expect(result.map((b) => b.x0)).toEqual([3, 4, 5, 6, 7]);
    expect(result.map((b) => b.count)).toEqual([4, 0, 0, 0, 1]);
  });

  test('REQ-400 · a constant sample is one bin of zero width (the recipe pads the domain, SP004)', () => {
    expect(bins([4, 4, 4])).toEqual([{ x0: 4, x1: 4, count: 3 }]);
    expect(bins([])).toEqual([]);
  });

  test('REQ-400 · negative and fractional values', () => {
    const result = bins(sortedValues([-0.42, -0.31, -0.05, 0.02, 0.13, 0.18, 0.29, 0.61]));
    expect(result.reduce((sum, b) => sum + b.count, 0)).toBe(8);
    expect(result[0]?.x0).toBeLessThanOrEqual(-0.42);
    expect(result.at(-1)?.x1).toBeGreaterThanOrEqual(0.61);
  });

  test('REQ-400 · I-24 · counts sum to n; each value is in [x0, x1), the last bin closed', () => {
    const random = createPrng(11);
    for (let run = 0; run < 50; run += 1) {
      const sample = sortedValues(Array.from({ length: 1 + Math.floor(random() * 200) }, () => Math.round(random() * random() * 5000) / 10));
      const result = bins(sample);
      expect(result.reduce((sum, b) => sum + b.count, 0)).toBe(sample.length);
      for (const value of sample) {
        const holder = result.filter((b, i) => value >= b.x0 && (value < b.x1 || (i === result.length - 1 && value <= b.x1)));
        expect(holder).toHaveLength(1);
      }
    }
  });

  test('REQ-400 · the nice ladder: 1, 2, 5 × 10^k, nearest by ratio; exact decimals', () => {
    expect(niceStep(6.73)).toBe(5);
    expect(niceStep(0.0031)).toBe(0.002);
    expect(niceStep(0.0036)).toBe(0.005);
    expect(niceStep(140)).toBe(100);
    expect(niceStep(1)).toBe(1);
  });
});

describe('T-165 · ECDF', () => {
  test('REQ-401 · one step per distinct value, matching NumPy', () => {
    expect(ecdf(X)).toEqual([
      { value: 2, p: 0.1 },
      { value: 4, p: 0.3 },
      { value: 5, p: 0.4 },
      { value: 7, p: 0.5 },
      { value: 9, p: 0.6 },
      { value: 10, p: 0.7 },
      { value: 12, p: 0.8 },
      { value: 15, p: 0.9 },
      { value: 21, p: 1 },
    ]);
  });

  test('REQ-401 · I-24 · non-decreasing and ending at exactly 1; all ties are one step', () => {
    expect(ecdf([5, 5, 5])).toEqual([{ value: 5, p: 1 }]);
    const steps = ecdf(sortedValues(Array.from({ length: 97 }, (_, i) => (i * 37) % 13)));
    expect(steps.every((s, i) => i === 0 || s.p >= (steps[i - 1]?.p ?? 0))).toBe(true);
    expect(steps.at(-1)?.p).toBe(1);
  });
});

describe('T-165 · ranks (competition ranking, DD-029)', () => {
  const rows = [
    { x: 1, series: 'a', value: 10 },
    { x: 1, series: 'b', value: 20 },
    { x: 1, series: 'c', value: 20 },
    { x: 1, series: 'd', value: 5 },
    { x: 2, series: 'a', value: 1 },
  ];
  const order = ['a', 'b', 'c', 'd'];

  test('REQ-409 · descending: equal values share a rank ("1224"); ties are slotted by series order', () => {
    expect(rank(rows, order, 'descending')).toEqual([
      { rank: 3, slot: 3 },
      { rank: 1, slot: 1 },
      { rank: 1, slot: 2 },
      { rank: 4, slot: 4 },
      { rank: 1, slot: 1 },
    ]);
  });

  test('REQ-409 · ascending ranks the lowest first', () => {
    expect(rank(rows, order, 'ascending').slice(0, 4)).toEqual([
      { rank: 2, slot: 2 },
      { rank: 3, slot: 3 },
      { rank: 3, slot: 4 },
      { rank: 1, slot: 1 },
    ]);
  });

  test('REQ-409 · I-23 · ranks do not depend on row order', () => {
    const keyed = (result: { rank: number; slot: number }[], input: typeof rows) =>
      Object.fromEntries(input.map((r, i) => [`${r.x}/${r.series}`, result[i]]));
    const again = shuffled(rows, 3);
    expect(keyed(rank(again, order, 'descending'), again)).toEqual(keyed(rank(rows, order, 'descending'), rows));
  });
});

describe('T-165 · kernel density (Epanechnikov, Silverman)', () => {
  const H = 3.0723855766666124;

  test('REQ-432 · roots go through one correctly rounded power, rounded to 6 significant digits', () => {
    expect(rootOf(10, 5)).toBe(1.58489);
    expect(rootOf(1000, 3)).toBe(10);
    expect(rootOf(1, 5)).toBe(1);
  });

  test('REQ-432 · Silverman\'s bandwidth matches NumPy within the 6-digit rounding of n^(−1/5)', () => {
    close(silverman(X), H, 1e-5);
  });

  test('REQ-432 · Silverman falls back when the spread is 0, never returning 0', () => {
    expect(silverman([4, 4, 4, 4])).toBeGreaterThan(0);
    expect(silverman([0, 0])).toBeGreaterThan(0);
  });

  test('REQ-432 · 64 samples over the domain, matching NumPy point for point', () => {
    const density = kde(X, H, [2 - H, 21 + H]);
    expect(density).toHaveLength(DENSITY_SAMPLES);
    expect(DENSITY_SAMPLES).toBe(64);
    close(density[0]?.at ?? Number.NaN, 2 - H);
    close(density.at(-1)?.at ?? Number.NaN, 21 + H);
    const reference: Record<number, number> = { 0: 0, 10: 0.07821446690362144, 20: 0.057503970884308406, 32: 0.046683727331005655, 63: 5.420330539191442e-18 };
    for (const [i, value] of Object.entries(reference)) close(density[Number(i)]?.value ?? Number.NaN, value);
  });

  test('REQ-432 · integrates to about 1 (trapezoid, NumPy: 0.99933)', () => {
    const density = kde(X, H, [2 - H, 21 + H]);
    let area = 0;
    for (let i = 1; i < density.length; i += 1) {
      const a = density[i - 1] as { at: number; value: number };
      const b = density[i] as { at: number; value: number };
      area += ((b.at - a.at) * (a.value + b.value)) / 2;
    }
    close(area, 0.9993342808498109, 1e-9);
  });

  test('REQ-432 · I-23 · order-independent: a shuffled sample gives deep-equal densities', () => {
    const raw = [12, 2, 4, 21, 4, 5, 9, 7, 10, 15];
    const a = kde(sortedValues(raw), silverman(sortedValues(raw)), [0, 25]);
    const b = kde(sortedValues(shuffled(raw, 5)), silverman(sortedValues(shuffled(raw, 5))), [0, 25]);
    expect(b).toEqual(a);
  });
});
