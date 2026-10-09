/**
 * The beeswarm's packing (DD-030, REQ-405): not iterative, and a pure function of the positions,
 * the radius and the side the seed picks. Points are placed in ascending order along the value
 * axis; each takes the smallest offset across it at which it touches no placed point. Candidates
 * are the axis itself and the exact tangencies with each nearby placed point, `y ± √(4r² − dx²)`,
 * so only `+ − × ÷` and `Math.sqrt` are used (REQ-435).
 */

/**
 * Offsets across the axis for points at sorted positions `xs` (px), of radius `r`. Off-axis
 * placements alternate sides, starting on `side` (1 or −1): of two equally small offsets, a point
 * takes the side opposite to the last point placed off the axis.
 */
export function packSwarm(xs: readonly number[], r: number, side: 1 | -1): number[] {
  const reach = 2 * r;
  const touch = reach * reach;
  // Below this a squared distance counts as touching: tangent candidates carry rounding error.
  const slack = touch * 1e-12;
  const ys: number[] = [];
  let prefer: number = side;
  let first = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const x = xs[i] as number;
    while (first < i && x - (xs[first] as number) >= reach) first += 1;
    const fits = (y: number) => {
      for (let j = first; j < i; j += 1) {
        const dx = x - (xs[j] as number);
        const dy = y - (ys[j] as number);
        if (dx * dx + dy * dy < touch - slack) return false;
      }
      return true;
    };
    // The smallest offset that fits wins; of two equal ones, the preferred side. Candidates are
    // tried in that order and the first that fits is taken, so a dense column costs one pass.
    let best = 0;
    if (!fits(0)) {
      const candidates: number[] = [];
      for (let j = first; j < i; j += 1) {
        const dx = x - (xs[j] as number);
        const rise = Math.sqrt(Math.max(touch - dx * dx, 0));
        candidates.push((ys[j] as number) + rise, (ys[j] as number) - rise);
      }
      candidates.sort((a, b) => (a < 0 ? -a : a) - (b < 0 ? -b : b) || b * prefer - a * prefer);
      best = candidates.find(fits) ?? 0;
    }
    ys.push(best);
    if (best !== 0) prefer = best > 0 ? -1 : 1;
  }
  return ys;
}
