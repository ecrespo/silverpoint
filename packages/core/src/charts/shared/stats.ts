/**
 * Statistics of the distribution charts (DD-029, REQ-432). Every function takes a sorted copy of
 * the values, returns plain data and rounds nothing: geometry is rounded where it is emitted
 * (REQ-002). Inside every sum and loop only correctly rounded operations are used (`+ − × ÷`,
 * `Math.sqrt`, comparisons), so Node and every browser agree to the last bit (REQ-435); the one
 * power is `rootOf`, rounded before use.
 */

/** An ascending copy of `values`; the input is left untouched. */
export function sortedValues(values: readonly number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

/**
 * `n^(1/k)`, through the one `Math.pow` call DD-029 allows, rounded to 6 significant digits so
 * a last-bit difference between engines cannot reach the drawing (A-03).
 */
export function rootOf(n: number, k: number): number {
  // eslint-disable-next-line silverpoint/no-transcendental -- DD-029: the single reviewed power, rounded to 6 digits.
  return Number(Math.pow(n, 1 / k).toPrecision(6));
}

/** Quantile `p` of a sorted sample by linear interpolation, Hyndman–Fan type 7 (R's and NumPy's default). */
export function quantile(sorted: readonly number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return Number.NaN;
  const h = (n - 1) * p;
  const lo = Math.floor(h);
  const a = sorted[lo] as number;
  if (lo >= n - 1) return sorted[n - 1] as number;
  const b = sorted[lo + 1] as number;
  return a + (b - a) * (h - lo);
}

/** The box plot's summary: quartiles, median, and whisker ends as `min` and `max` (Data Model §2.15). */
export interface FiveNumber {
  /** The lowest observation at or above the lower fence, never above `q1`. */
  readonly min: number;
  readonly q1: number;
  readonly median: number;
  readonly q3: number;
  /** The highest observation at or below the upper fence, never below `q3`. */
  readonly max: number;
  /** Observations past the fences, ascending. */
  readonly outliers: readonly number[];
}

/** Tukey's summary of a sorted, non-empty sample, whiskers at `whisker` × IQR (1.5 by default). */
export function fiveNumber(sorted: readonly number[], whisker = 1.5): FiveNumber {
  const q1 = quantile(sorted, 0.25);
  const median = quantile(sorted, 0.5);
  const q3 = quantile(sorted, 0.75);
  const reach = (q3 - q1) * whisker;
  const low = q1 - reach;
  const high = q3 + reach;
  const inside = sorted.filter((v) => v >= low && v <= high);
  // An interpolated quartile can lie past the last observation inside its fence; the whisker
  // then has no length, and stops at the box (I-24).
  return {
    min: Math.min(inside[0] ?? q1, q1),
    q1,
    median,
    q3,
    max: Math.max(inside.at(-1) ?? q3, q3),
    outliers: sorted.filter((v) => v < low || v > high),
  };
}

/** A step of the 1-2-5 ladder as an exact ratio: the step is `num / den`, both whole. */
interface Step {
  readonly num: number;
  readonly den: number;
}

const value = (step: Step) => step.num / step.den;
/** The `k`-th multiple of a step, correctly rounded from the exact decimal. */
const multiple = (step: Step, k: number) => (k * step.num) / step.den;

/**
 * The 1-2-5 × 10^k step nearest `width` by ratio (`ceil`: the smallest one at or above it). Powers
 * of ten are built by whole multiplications, so every step is an exact decimal (no `Math.log10`).
 */
function ladder(width: number, ceil = false): Step {
  let num = 1;
  let den = 1;
  while (num / den > width) {
    if (num > 1) num /= 10;
    else den *= 10;
  }
  while ((num * 10) / den <= width) {
    if (den > 1) den /= 10;
    else num *= 10;
  }
  const candidates = [1, 2, 5, 10].map((m) => ({ num: num * m, den }));
  if (ceil) return candidates.find((c) => value(c) >= width) as Step;
  let best = candidates[0] as Step;
  let worst = Number.POSITIVE_INFINITY;
  for (const c of candidates) {
    const ratio = value(c) > width ? value(c) / width : width / value(c);
    if (ratio < worst) {
      worst = ratio;
      best = c;
    }
  }
  return best;
}

/** The nice step nearest `width`: 1, 2 or 5 × 10^k. */
export function niceStep(width: number): number {
  return value(ladder(width));
}

/** Sturges' bin count, `⌈log₂ n⌉ + 1`, by doubling. */
export function sturges(n: number): number {
  let bits = 0;
  for (let reach = 1; reach < n; reach *= 2) bits += 1;
  return bits + 1;
}

/** A bin: `x0` inclusive, `x1` exclusive except on the last bin (Data Model §2.15). */
export interface Bin {
  readonly x0: number;
  readonly x1: number;
  readonly count: number;
}

/** Bins drawn at most: past it the step widens, so a long tail cannot ask for millions of bins. */
const MAX_BINS = 1000;

/** Edges on multiples of `step` that cover `[min, max]`. */
function steppedEdges(min: number, max: number, step: Step): number[] {
  let k = Math.floor((min * step.den) / step.num);
  while (multiple(step, k) > min) k -= 1;
  while (multiple(step, k + 1) <= min) k += 1;
  const edges = [multiple(step, k)];
  while ((edges.at(-1) as number) < max) edges.push(multiple(step, k + edges.length));
  return edges;
}

/** The edges of `bins` for a sorted sample with a non-zero span. */
function edgesOf(sorted: readonly number[], spec: number | readonly number[] | undefined): number[] {
  const min = sorted[0] as number;
  const max = sorted.at(-1) as number;
  const span = max - min;
  if (Array.isArray(spec)) {
    const thresholds = spec as readonly number[];
    const edges = [...thresholds];
    if (min < (edges[0] as number)) edges.unshift(min);
    if (max > (edges.at(-1) as number)) edges.push(max);
    return edges;
  }
  if (typeof spec === 'number') {
    const step = ladder(span / spec, true);
    const lo = steppedEdges(min, min, step)[0] as number;
    let hi = lo;
    for (let k = 1; hi < max; k += 1) hi = lo + multiple(step, k);
    return Array.from({ length: spec + 1 }, (_, i) => (i === spec ? hi : lo + (i * (hi - lo)) / spec));
  }
  const iqr = quantile(sorted, 0.75) - quantile(sorted, 0.25);
  const width = iqr > 0 ? (2 * iqr) / rootOf(sorted.length, 3) : span / sturges(sorted.length);
  return steppedEdges(min, max, ladder(Math.max(width, span / MAX_BINS)));
}

/**
 * Bins of a sorted sample (REQ-400, REQ-432). Omitted, Freedman–Diaconis' width `2·IQR·n^(−1/3)`
 * (Sturges' count when the IQR is 0), snapped to the nearest nice step so the edges fall on axis
 * ticks. A number asks for that many equal bins over the extent niced to a step; an array gives
 * the edges, closed by the data's extent when the sample reaches past them.
 */
export function bins(sorted: readonly number[], spec?: number | readonly number[]): Bin[] {
  if (sorted.length === 0) return [];
  const min = sorted[0] as number;
  const max = sorted.at(-1) as number;
  if (max === min && !Array.isArray(spec)) return [{ x0: min, x1: max, count: sorted.length }];
  const edges = edgesOf(sorted, spec);
  const counts = new Array<number>(edges.length - 1).fill(0);
  const last = counts.length - 1;
  let b = 0;
  for (const v of sorted) {
    while (b < last && v >= (edges[b + 1] as number)) b += 1;
    counts[b] = (counts[b] as number) + 1;
  }
  return counts.map((count, i) => ({ x0: edges[i] as number, x1: edges[i + 1] as number, count }));
}

/** A step of the empirical cumulative distribution: the share of observations at or below `value`. */
export interface EcdfStep {
  readonly value: number;
  readonly p: number;
}

/** The ECDF of a sorted sample: one step per distinct value, ending at exactly 1 (REQ-401). */
export function ecdf(sorted: readonly number[]): EcdfStep[] {
  const n = sorted.length;
  const steps: EcdfStep[] = [];
  sorted.forEach((v, i) => {
    if (i + 1 < n && sorted[i + 1] === v) return;
    steps.push({ value: v, p: (i + 1) / n });
  });
  return steps;
}

/** A rank and the line's slot at one x: ties share a rank, and are slotted by series order. */
export interface Rank {
  readonly rank: number;
  readonly slot: number;
}

/**
 * Competition ranks ("1224") of long-format rows, per x (REQ-409, DD-029). `descending` gives rank
 * 1 to the highest value. Equal values share a rank; for the drawing only, ties are slotted by the
 * series' first appearance (`seriesOrder`), so the result does not depend on row order (I-23).
 */
export function rank(
  rows: readonly { readonly x: unknown; readonly series: string; readonly value: number }[],
  seriesOrder: readonly string[],
  order: 'descending' | 'ascending',
): Rank[] {
  const position = new Map(seriesOrder.map((s, i) => [s, i]));
  const sign = order === 'descending' ? -1 : 1;
  const groups = new Map<string, number[]>();
  rows.forEach((row, i) => {
    const key = `${typeof row.x}:${String(row.x)}`;
    const group = groups.get(key);
    if (group) group.push(i);
    else groups.set(key, [i]);
  });
  const result = new Array<Rank>(rows.length);
  for (const members of groups.values()) {
    const sorted = [...members].sort((a, b) => {
      const ra = rows[a] as (typeof rows)[number];
      const rb = rows[b] as (typeof rows)[number];
      return sign * (ra.value - rb.value) || (position.get(ra.series) ?? 0) - (position.get(rb.series) ?? 0);
    });
    sorted.forEach((i, slot) => {
      const v = (rows[i] as (typeof rows)[number]).value;
      const better = sorted.findIndex((j) => (rows[j] as (typeof rows)[number]).value === v);
      result[i] = { rank: better + 1, slot: slot + 1 };
    });
  }
  return result;
}
