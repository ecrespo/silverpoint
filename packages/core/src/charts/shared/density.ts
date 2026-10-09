import { quantile, rootOf } from './stats';

/**
 * Kernel density of the violin and ridgeline charts (DD-029, REQ-432): the Epanechnikov kernel,
 * `K(u) = ¾(1 − u²)` on `|u| ≤ 1`, is polynomial, so the density sum needs only correctly rounded
 * operations and Node and every browser produce the same samples (REQ-435). A Gaussian kernel
 * would call `Math.exp`, which ECMAScript does not require to be correctly rounded.
 */

/** Points at which a density is evaluated, over the shared value domain. */
export const DENSITY_SAMPLES = 64;

/** A density sample. */
export interface DensityPoint {
  readonly at: number;
  readonly value: number;
}

/**
 * Silverman's rule of thumb, `0.9 · min(σ, IQR/1.34) · n^(−1/5)`, of a sorted sample. When the
 * spread is 0 it falls back to σ, then to |x₀|, then to 1 (as R's `bw.nrd0`), so it is never 0.
 */
export function silverman(sorted: readonly number[]): number {
  const n = sorted.length;
  let sum = 0;
  for (const v of sorted) sum += v;
  const mean = sum / n;
  let squares = 0;
  for (const v of sorted) squares += (v - mean) * (v - mean);
  const sigma = n > 1 ? Math.sqrt(squares / (n - 1)) : 0;
  const iqr = quantile(sorted, 0.75) - quantile(sorted, 0.25);
  let spread = Math.min(sigma, iqr / 1.34);
  if (!(spread > 0)) spread = sigma > 0 ? sigma : Math.abs(sorted[0] ?? 0) || 1;
  return (0.9 * spread) / rootOf(n, 5);
}

/**
 * The Epanechnikov density of a sorted sample at `samples` evenly spaced points of `domain`, both
 * ends included. Terms are summed in ascending order of the observations.
 */
export function kde(sorted: readonly number[], bandwidth: number, domain: readonly [number, number], samples = DENSITY_SAMPLES): DensityPoint[] {
  const [lo, hi] = domain;
  const n = sorted.length;
  const scale = n * bandwidth;
  const points: DensityPoint[] = [];
  let first = 0;
  for (let k = 0; k < samples; k += 1) {
    const at = k === samples - 1 ? hi : lo + (k * (hi - lo)) / (samples - 1);
    while (first < n && (sorted[first] as number) < at - bandwidth) first += 1;
    let sum = 0;
    for (let i = first; i < n; i += 1) {
      const u = (at - (sorted[i] as number)) / bandwidth;
      if (u < -1) break;
      if (u <= 1) sum += 0.75 * (1 - u * u);
    }
    points.push({ at, value: n > 0 ? sum / scale : 0 });
  }
  return points;
}
