import { createPrng } from '../../render/prng';

/**
 * The network layout (DD-030, REQ-426): Fruchterman–Reingold over a fixed number of iterations,
 * the temperature cooling linearly to 0, then fitted to the unit square. The start is a square grid, its
 * cells dealt to the nodes by the chart's seed, so no trigonometry is needed; inside the
 * iterations only `+ − × ÷` and `Math.sqrt` are used, so Node and every browser produce the same
 * coordinates (REQ-435, I-27).
 */

export interface LayoutLink {
  readonly source: number;
  readonly target: number;
}

/** The step a node may take in the first iteration, as a share of the square's side. */
const START_TEMPERATURE = 0.1;
/** Two nodes closer than this (squared) are pushed apart along x, the lower index leftwards. */
const COINCIDENT = 1e-12;

export function layoutNetwork(
  count: number,
  links: readonly LayoutLink[],
  options: { readonly iterations: number; readonly seed: number },
): { x: number; y: number }[] {
  const side = Math.ceil(Math.sqrt(count));
  // Fisher–Yates with the seeded PRNG: node `v` starts in cell `cells[v]`.
  const random = createPrng(options.seed);
  const cells = Array.from({ length: count }, (_, k) => k);
  for (let k = count - 1; k > 0; k -= 1) {
    const r = Math.floor(random() * (k + 1));
    const swap = cells[k] as number;
    cells[k] = cells[r] as number;
    cells[r] = swap;
  }
  const xs = new Float64Array(count);
  const ys = new Float64Array(count);
  cells.forEach((cell, v) => {
    xs[v] = ((cell % side) + 0.5) / side;
    ys[v] = (Math.floor(cell / side) + 0.5) / side;
  });

  const pulls = links.filter((l) => l.source !== l.target);
  // The ideal distance of FR for the unit area; its square is what repulsion needs.
  const k2 = 1 / Math.max(count, 1);
  const k = Math.sqrt(k2);
  const dx = new Float64Array(count);
  const dy = new Float64Array(count);
  for (let it = 0; it < options.iterations; it += 1) {
    const temperature = START_TEMPERATURE * (1 - it / options.iterations);
    dx.fill(0);
    dy.fill(0);
    // Repulsion k²/d along the unit vector: (Δ / d) · k² / d = Δ · k² / d².
    for (let a = 0; a < count; a += 1) {
      const xa = xs[a] as number;
      const ya = ys[a] as number;
      let sx = dx[a] as number;
      let sy = dy[a] as number;
      for (let b = a + 1; b < count; b += 1) {
        let ex = xa - (xs[b] as number);
        let ey = ya - (ys[b] as number);
        let d2 = ex * ex + ey * ey;
        if (d2 < COINCIDENT) {
          ex = -1e-6;
          ey = 0;
          d2 = 1e-12;
        }
        const f = k2 / d2;
        const fx = ex * f;
        const fy = ey * f;
        sx += fx;
        sy += fy;
        dx[b] = (dx[b] as number) - fx;
        dy[b] = (dy[b] as number) - fy;
      }
      dx[a] = sx;
      dy[a] = sy;
    }
    // Attraction d²/k along the unit vector: Δ · d / k.
    for (const { source, target } of pulls) {
      const ex = (xs[source] as number) - (xs[target] as number);
      const ey = (ys[source] as number) - (ys[target] as number);
      const f = Math.sqrt(ex * ex + ey * ey) / k;
      dx[source] = (dx[source] as number) - ex * f;
      dy[source] = (dy[source] as number) - ey * f;
      dx[target] = (dx[target] as number) + ex * f;
      dy[target] = (dy[target] as number) + ey * f;
    }
    // Each node moves along its displacement, at most the temperature. No wall stops it: walls
    // pile the outer nodes along the edges; the layout is fitted to the square at the end.
    for (let v = 0; v < count; v += 1) {
      const mx = dx[v] as number;
      const my = dy[v] as number;
      const length = Math.sqrt(mx * mx + my * my);
      if (!(length > 0)) continue;
      const step = Math.min(length, temperature) / length;
      xs[v] = (xs[v] as number) + mx * step;
      ys[v] = (ys[v] as number) + my * step;
    }
  }
  const fit = fitter(xs);
  const fitY = fitter(ys);
  return Array.from(xs, (x, v) => ({ x: fit(x), y: fitY(ys[v] as number) }));
}

/** Maps an axis' extent onto 0–1; a single position goes to the middle. */
function fitter(values: Float64Array): (v: number) => number {
  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  for (const v of values) {
    low = Math.min(low, v);
    high = Math.max(high, v);
  }
  return high > low ? (v) => (v - low) / (high - low) : () => 0.5;
}
