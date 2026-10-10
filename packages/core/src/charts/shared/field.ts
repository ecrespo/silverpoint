/**
 * The field engine of the contour and density-bin charts (DD-028, REQ-430): marching squares,
 * the Epanechnikov density splat and the 2-D bins, all owned. Only correctly rounded operations
 * are used (`+ − × ÷`, `Math.sqrt`, comparisons), so Node and every browser produce the same
 * coordinates (REQ-435).
 */

/** A regular grid of values, row-major: `values[j * nx + i]`; `undefined` is a hole. */
export interface ScalarGrid {
  readonly nx: number;
  readonly ny: number;
  readonly values: readonly (number | undefined)[];
}

export interface GridPoint {
  readonly x: number;
  readonly y: number;
}

/** A closed ring in grid coordinates (`x` along `i`, `y` along `j`); the first point is not repeated. */
export type Ring = readonly GridPoint[];

/** A crossing of a level on a grid edge; `exact` when both ends of the edge are values. */
interface Crossing extends GridPoint {
  readonly exact: boolean;
}

/**
 * The rings bounding `{ value ≥ level }` (marching squares). The grid is read as padded by a ring
 * of holes, so every ring closes; a hole is below every level, its crossing put on the value
 * beside it. A saddle is resolved by the cell's centre, the mean of its corners. Rings are
 * oriented: walking along one, the region is always on the same side, so a hole turns the other
 * way and a region fills under the non-zero rule.
 */
export function isoRings(grid: ScalarGrid, level: number): Ring[] {
  return trace(grid, level).map(plain);
}

/**
 * The iso-lines at `level`: the rings' runs between exact crossings, so the grid's border and a
 * hole's edge, which bound the region but are not at the level, are not drawn. A closed line
 * repeats its first point at its end.
 */
export function isoLines(grid: ScalarGrid, level: number): GridPoint[][] {
  return linesOf(trace(grid, level));
}

/**
 * The rings of the band `[low, high)`: the region above `low` with the region above `high`
 * turned the other way inside it. Their signed areas sum to the band's.
 */
export function bandRings(grid: ScalarGrid, low: number, high?: number): Ring[] {
  return band(isoRings(grid, low), high === undefined ? undefined : isoRings(grid, high));
}

/** One level's contour: its region's rings, its iso-lines, and its band up to the next level. */
export interface Contour {
  readonly level: number;
  readonly rings: readonly Ring[];
  readonly lines: readonly GridPoint[][];
  readonly band: readonly Ring[];
}

/** The contours of increasing `levels`, each level traced once (REQ-445). */
export function contours(grid: ScalarGrid, levels: readonly number[]): Contour[] {
  const traced = levels.map((level) => trace(grid, level));
  const rings = traced.map((t) => t.map(plain));
  return levels.map((level, k) => ({
    level,
    rings: rings[k] as Ring[],
    lines: linesOf(traced[k] as Crossing[][]),
    band: band(rings[k] as Ring[], rings[k + 1]),
  }));
}

const plain = (ring: readonly Crossing[]): Ring => ring.map(({ x, y }) => ({ x, y }));

function band(outer: readonly Ring[], inner: readonly Ring[] | undefined): Ring[] {
  return inner === undefined ? [...outer] : [...outer, ...inner.map((ring) => [...ring].reverse())];
}

function linesOf(rings: readonly Crossing[][]): GridPoint[][] {
  const lines: GridPoint[][] = [];
  for (const ring of rings) {
    const n = ring.length;
    const breakAt = ring.findIndex((p, k) => !p.exact || !(ring[(k + 1) % n] as Crossing).exact);
    if (breakAt < 0) {
      lines.push([...plain(ring), { x: (ring[0] as Crossing).x, y: (ring[0] as Crossing).y }]);
      continue;
    }
    // Walk once round from the first break, cutting at every segment with an inexact end.
    let run: GridPoint[] = [];
    for (let s = 1; s <= n; s += 1) {
      const a = ring[(breakAt + s) % n] as Crossing;
      const b = ring[(breakAt + s + 1) % n] as Crossing;
      if (a.exact && b.exact) {
        if (run.length === 0) run.push({ x: a.x, y: a.y });
        run.push({ x: b.x, y: b.y });
      } else if (run.length > 0) {
        lines.push(run);
        run = [];
      }
    }
    if (run.length > 0) lines.push(run);
  }
  return lines;
}

/** Signed area of a ring (shoelace). */
export function ringArea(ring: Ring): number {
  let twice = 0;
  for (let k = 0; k < ring.length; k += 1) {
    const a = ring[k] as GridPoint;
    const b = ring[(k + 1) % ring.length] as GridPoint;
    twice += a.x * b.y - b.x * a.y;
  }
  return twice / 2;
}

function trace(grid: ScalarGrid, level: number): Crossing[][] {
  const { nx, ny, values } = grid;
  const value = (i: number, j: number) => (i < 0 || j < 0 || i >= nx || j >= ny ? undefined : values[j * nx + i]);
  const inside = (v: number | undefined) => v !== undefined && v >= level;
  // Edges of the padded grid: a key per edge, so a crossing is computed once and shared by the two
  // cells either side of it (their segments then meet to the last bit).
  const width = nx + 2;
  const edgeKey = (i: number, j: number, vertical: boolean) => ((j + 1) * width + (i + 1)) * 2 + (vertical ? 1 : 0);
  const crossings = new Map<number, Crossing>();
  const crossing = (i: number, j: number, vertical: boolean): number => {
    const key = edgeKey(i, j, vertical);
    if (!crossings.has(key)) {
      const i1 = vertical ? i : i + 1;
      const j1 = vertical ? j + 1 : j;
      const a = value(i, j);
      const b = value(i1, j1);
      let f: number;
      if (a === undefined) f = 1;
      else if (b === undefined) f = 0;
      else f = (level - a) / (b - a);
      crossings.set(key, { x: i + f * (i1 - i), y: j + f * (j1 - j), exact: a !== undefined && b !== undefined });
    }
    return key;
  };

  // Which vertices of the padded grid are inside, so a cell all in or all out costs four reads.
  const status = new Uint8Array(width * (ny + 2));
  for (let j = 0; j < ny; j += 1) for (let i = 0; i < nx; i += 1) if (inside(values[j * nx + i])) status[(j + 1) * width + i + 1] = 1;

  // Segments, each from an exit (inside to outside, walking a cell clockwise) to an entry.
  const next = new Map<number, number>();
  for (let j = -1; j < ny; j += 1) {
    for (let i = -1; i < nx; i += 1) {
      const top = (j + 1) * width + i + 1;
      const sum = (status[top] as number) + (status[top + 1] as number) + (status[top + width + 1] as number) + (status[top + width] as number);
      if (sum === 0 || sum === 4) continue;
      const corners = [value(i, j), value(i + 1, j), value(i + 1, j + 1), value(i, j + 1)];
      const ins = corners.map(inside);
      // The cell's edges clockwise: top, right, bottom (right to left), left (bottom to top).
      const edges: (() => number)[] = [() => crossing(i, j, false), () => crossing(i + 1, j, true), () => crossing(i, j + 1, false), () => crossing(i, j, true)];
      const exits: number[] = [];
      const entries: number[] = [];
      for (let k = 0; k < 4; k += 1) {
        if (ins[k] && !ins[(k + 1) % 4]) exits.push(k);
        if (!ins[k] && ins[(k + 1) % 4]) entries.push(k);
      }
      if (exits.length === 0) continue;
      let centre = false;
      if (exits.length === 2 && corners.every((c) => c !== undefined)) {
        centre = ((corners[0] as number) + (corners[1] as number) + (corners[2] as number) + (corners[3] as number)) / 4 >= level;
      }
      for (const exit of exits) {
        // Joined through the centre: the next entry clockwise; apart: the one before.
        let entry = entries[0] as number;
        if (exits.length === 2) {
          const after = entries.find((e) => e > exit) ?? (entries[0] as number);
          const before = [...entries].reverse().find((e) => e < exit) ?? (entries.at(-1) as number);
          entry = centre ? after : before;
        }
        next.set((edges[exit] as () => number)(), (edges[entry] as () => number)());
      }
    }
  }

  const rings: Crossing[][] = [];
  const seen = new Set<number>();
  for (const start of [...next.keys()].sort((a, b) => a - b)) {
    if (seen.has(start)) continue;
    const ring: Crossing[] = [];
    let at: number | undefined = start;
    while (at !== undefined && !seen.has(at)) {
      seen.add(at);
      const point = crossings.get(at) as Crossing;
      const last = ring.at(-1);
      // Crossings put on the same value (beside a hole or the border) collapse into one.
      if (!last || last.x !== point.x || last.y !== point.y) ring.push(point);
      at = next.get(at);
    }
    while (ring.length > 1 && (ring[0] as Crossing).x === (ring.at(-1) as Crossing).x && (ring[0] as Crossing).y === (ring.at(-1) as Crossing).y) ring.pop();
    if (ring.length >= 3) rings.push(ring);
  }
  return rings;
}

/**
 * The density of a point cloud on a regular grid of `nx × ny` nodes spanning `domain`, with the
 * product Epanechnikov kernel `¾(1 − u²) · ¾(1 − v²)` and bandwidths in data units (DD-029): a
 * splat, polynomial, summed over the points in `(x, y)` order so the result does not depend on the
 * order of the rows (I-23). Rows run along `y`, ascending.
 */
export function densityGrid(
  points: readonly GridPoint[],
  domain: { readonly x: readonly [number, number]; readonly y: readonly [number, number] },
  nx: number,
  ny: number,
  bandwidth: { readonly x: number; readonly y: number },
): ScalarGrid & { readonly values: readonly number[] } {
  const [x0, x1] = domain.x;
  const [y0, y1] = domain.y;
  const dx = nx > 1 ? (x1 - x0) / (nx - 1) : 1;
  const dy = ny > 1 ? (y1 - y0) / (ny - 1) : 1;
  const hx = bandwidth.x;
  const hy = bandwidth.y;
  const values = new Float64Array(nx * ny);
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const scale = sorted.length * hx * hy;
  for (const p of sorted) {
    const iLow = Math.max(0, Math.ceil((p.x - hx - x0) / dx));
    const iHigh = Math.min(nx - 1, Math.floor((p.x + hx - x0) / dx));
    const jLow = Math.max(0, Math.ceil((p.y - hy - y0) / dy));
    const jHigh = Math.min(ny - 1, Math.floor((p.y + hy - y0) / dy));
    // The kernel's two factors, once per column and per row of the point's footprint.
    const across: number[] = [];
    for (let i = iLow; i <= iHigh; i += 1) {
      const u = (x0 + i * dx - p.x) / hx;
      across.push(u < -1 || u > 1 ? 0 : 0.75 * (1 - u * u));
    }
    for (let j = jLow; j <= jHigh; j += 1) {
      const v = (y0 + j * dy - p.y) / hy;
      if (v < -1 || v > 1) continue;
      const kv = (0.75 * (1 - v * v)) / scale;
      const row = j * nx;
      for (let i = iLow; i <= iHigh; i += 1) values[row + i] = (values[row + i] as number) + (across[i - iLow] as number) * kv;
    }
  }
  return { nx, ny, values: Array.from(values) };
}

/** A 2-D bin: its centre, its place (row, then column), the points in it by index. */
export interface Bin2D {
  readonly cx: number;
  readonly cy: number;
  readonly column: number;
  readonly row: number;
  readonly count: number;
  readonly indices: readonly number[];
}

interface Indexed extends GridPoint {
  readonly index: number;
}

function collect(points: readonly Indexed[], place: (p: Indexed) => { column: number; row: number; cx: number; cy: number }): Bin2D[] {
  const bins = new Map<string, { column: number; row: number; cx: number; cy: number; indices: number[] }>();
  for (const p of points) {
    const at = place(p);
    const key = `${at.row},${at.column}`;
    const bin = bins.get(key);
    if (bin) bin.indices.push(p.index);
    else bins.set(key, { ...at, indices: [p.index] });
  }
  return [...bins.values()]
    .sort((a, b) => a.row - b.row || a.column - b.column)
    .map((b) => ({ cx: b.cx, cy: b.cy, column: b.column, row: b.row, count: b.indices.length, indices: b.indices.sort((x, y) => x - y) }));
}

/**
 * Hexagonal bins, pointy-top, `size` px across the flats, the lattice anchored at `origin`. A
 * point goes to the nearer of the two candidate centres, so each hexagon is exactly the set of
 * points nearest its centre.
 */
export function hexBins(points: readonly Indexed[], size: number, origin: GridPoint): Bin2D[] {
  const r = size / Math.sqrt(3);
  const dy = 1.5 * r;
  const centre = (column: number, row: number) => ({ column, row, cx: origin.x + (column + (row & 1) / 2) * size, cy: origin.y + row * dy });
  return collect(points, (p) => {
    // The rectangle of rows `row` and `row + 1` holds the point: its centre is one of four.
    const row = Math.floor((p.y - origin.y) / dy);
    let best = centre(0, 0);
    let distance = Number.POSITIVE_INFINITY;
    for (const j of [row, row + 1]) {
      const column = Math.round((p.x - origin.x) / size - (j & 1) / 2);
      for (const i of [column - 1, column, column + 1]) {
        const c = centre(i, j);
        const d = (p.x - c.cx) * (p.x - c.cx) + (p.y - c.cy) * (p.y - c.cy);
        if (d < distance) {
          distance = d;
          best = c;
        }
      }
    }
    return best;
  });
}

/** Square bins of side `size` px, anchored at `origin`. */
export function rectBins(points: readonly Indexed[], size: number, origin: GridPoint): Bin2D[] {
  return collect(points, (p) => {
    const column = Math.floor((p.x - origin.x) / size);
    const row = Math.floor((p.y - origin.y) / size);
    return { column, row, cx: origin.x + (column + 0.5) * size, cy: origin.y + (row + 0.5) * size };
  });
}

/**
 * A pointy-top hexagon `size` px across the flats, centred at `(cx, cy)`; its two vertical sides
 * are written as `V`, so a cloud of bins weighs less (NFR §7).
 */
export function hexagonPath(cx: number, cy: number, size: number): string {
  const r = size / Math.sqrt(3);
  const h = size / 2;
  return `M${cx},${cy - r}L${cx + h},${cy - r / 2}V${cy + r / 2}L${cx},${cy + r}L${cx - h},${cy + r / 2}V${cy - r / 2}Z`;
}
