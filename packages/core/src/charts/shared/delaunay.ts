/**
 * The Delaunay triangulation and its Voronoi dual (DD-028, REQ-424), owned. Points are snapped to
 * the 2-decimal output grid, so they are integers in hundredths, and inserted in `(x, y, index)`
 * order (Bowyer–Watson). The predicates are exact: each is evaluated in doubles with an error
 * bound and, when the bound cannot settle its sign, again with `BigInt`. Degenerate inputs —
 * duplicates, collinear and co-circular points — are handled by the predicates, never by
 * perturbation, so Node and every browser produce the same mesh (REQ-435).
 */

interface Point {
  readonly x: number;
  readonly y: number;
}

/** Relative error bounds of the double evaluations, with a margin over Shewchuk's. */
const ORIENT_BOUND = 1e-15;
const CIRCLE_BOUND = 1e-14;

/**
 * Twice the signed area of `a, b, c` for integer coordinates: positive when they turn
 * counter-clockwise (y up), 0 when collinear; exact in sign.
 */
export function orient2d(a: Point, b: Point, c: Point): number {
  const left = (b.x - a.x) * (c.y - a.y);
  const right = (b.y - a.y) * (c.x - a.x);
  const det = left - right;
  if (Math.abs(det) > ORIENT_BOUND * (Math.abs(left) + Math.abs(right))) return det;
  const big = (BigInt(b.x) - BigInt(a.x)) * (BigInt(c.y) - BigInt(a.y)) - (BigInt(b.y) - BigInt(a.y)) * (BigInt(c.x) - BigInt(a.x));
  return big === 0n ? 0 : big > 0n ? 1 : -1;
}

/**
 * For counter-clockwise `a, b, c` with integer coordinates: positive when `d` is strictly inside
 * their circumcircle, 0 on it, negative outside; exact in sign.
 */
export function inCircle(a: Point, b: Point, c: Point, d: Point): number {
  // Translating by `d` is exact: the coordinates are integers.
  const adx = a.x - d.x;
  const ady = a.y - d.y;
  const bdx = b.x - d.x;
  const bdy = b.y - d.y;
  const cdx = c.x - d.x;
  const cdy = c.y - d.y;
  const alift = adx * adx + ady * ady;
  const blift = bdx * bdx + bdy * bdy;
  const clift = cdx * cdx + cdy * cdy;
  const bc = bdx * cdy - cdx * bdy;
  const ca = cdx * ady - adx * cdy;
  const ab = adx * bdy - bdx * ady;
  const det = alift * bc + blift * ca + clift * ab;
  const permanent =
    alift * (Math.abs(bdx * cdy) + Math.abs(cdx * bdy)) + blift * (Math.abs(cdx * ady) + Math.abs(adx * cdy)) + clift * (Math.abs(adx * bdy) + Math.abs(bdx * ady));
  if (Math.abs(det) > CIRCLE_BOUND * permanent) return det;
  const [Ax, Ay, Bx, By, Cx, Cy] = [adx, ady, bdx, bdy, cdx, cdy].map((v) => BigInt(v)) as [bigint, bigint, bigint, bigint, bigint, bigint];
  const big = (Ax * Ax + Ay * Ay) * (Bx * Cy - Cx * By) + (Bx * Bx + By * By) * (Cx * Ay - Ax * Cy) + (Cx * Cx + Cy * Cy) * (Ax * By - Bx * Ay);
  return big === 0n ? 0 : big > 0n ? 1 : -1;
}

export interface Triangulation {
  /** Three indices of the input per triangle, counter-clockwise in hundredths (y up). */
  readonly triangles: readonly number[];
  /** The mesh's edges once each, `[u, v]` with `u < v`, sorted. */
  readonly edges: readonly (readonly [number, number])[];
  /** The indices drawn, ascending: the first of each point on the 2-decimal grid. */
  readonly kept: readonly number[];
  /** The indices dropped as repeating a kept point, ascending. */
  readonly duplicates: readonly number[];
}

/** Bowyer–Watson inside a super-triangle far beyond the points, removed at the end. */
export function triangulate(points: readonly Point[]): Triangulation {
  const n = points.length;
  const q = points.map((p) => ({ x: Math.round(p.x * 100), y: Math.round(p.y * 100) }));
  const order = q.map((_, k) => k).sort((a, b) => (q[a] as Point).x - (q[b] as Point).x || (q[a] as Point).y - (q[b] as Point).y || a - b);
  const kept: number[] = [];
  const duplicates: number[] = [];
  order.forEach((k, s) => {
    const prev = s > 0 ? (q[order[s - 1] as number] as Point) : undefined;
    const p = q[k] as Point;
    if (prev && prev.x === p.x && prev.y === p.y) duplicates.push(k);
    else kept.push(k);
  });
  duplicates.sort((a, b) => a - b);

  const sortedKept = [...kept].sort((a, b) => a - b);
  if (kept.length < 3) return { triangles: [], edges: chain(kept), kept: sortedKept, duplicates };

  // The super-triangle: vertices n, n + 1, n + 2, a million spans away.
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const k of kept) {
    const p = q[k] as Point;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const span = Math.max(maxX - minX, maxY - minY, 1) * 1_000_000;
  const mx = Math.floor((minX + maxX) / 2);
  const my = Math.floor((minY + maxY) / 2);
  const vertex: Point[] = [...q, { x: mx - 3 * span, y: my - span }, { x: mx + 3 * span, y: my - span }, { x: mx, y: my + 3 * span }];
  const width = n + 3;

  const corners: number[] = [];
  const alive: boolean[] = [];
  const owner = new Map<number, number>();
  const add = (a: number, b: number, c: number): number => {
    const t = alive.length;
    corners.push(a, b, c);
    alive.push(true);
    owner.set(a * width + b, t);
    owner.set(b * width + c, t);
    owner.set(c * width + a, t);
    return t;
  };
  const remove = (t: number) => {
    alive[t] = false;
    const [a, b, c] = [corners[3 * t] as number, corners[3 * t + 1] as number, corners[3 * t + 2] as number];
    for (const [u, v] of [[a, b], [b, c], [c, a]] as const) if (owner.get(u * width + v) === t) owner.delete(u * width + v);
  };
  const at = (k: number) => vertex[k] as Point;

  let last = add(n, n + 1, n + 2);
  for (const k of kept) {
    const p = at(k);
    // Walk from the last triangle made towards the point (a visibility walk ends in a Delaunay mesh).
    let t = last;
    for (let steps = 0; steps <= alive.length; steps += 1) {
      let moved = false;
      for (let e = 0; e < 3; e += 1) {
        const a = corners[3 * t + e] as number;
        const b = corners[3 * t + ((e + 1) % 3)] as number;
        if (orient2d(at(a), at(b), p) < 0) {
          const across = owner.get(b * width + a);
          if (across !== undefined) {
            t = across;
            moved = true;
            break;
          }
        }
      }
      if (!moved) break;
    }
    // The cavity: the triangle holding the point, and every triangle reached across an edge whose
    // circumcircle holds it strictly.
    const cavity = new Set([t]);
    const stack = [t];
    const boundary: [number, number][] = [];
    while (stack.length > 0) {
      const u = stack.pop() as number;
      for (let e = 0; e < 3; e += 1) {
        const a = corners[3 * u + e] as number;
        const b = corners[3 * u + ((e + 1) % 3)] as number;
        const across = owner.get(b * width + a);
        if (across !== undefined && !cavity.has(across)) {
          const [x, y, z] = [corners[3 * across] as number, corners[3 * across + 1] as number, corners[3 * across + 2] as number];
          if (inCircle(at(x), at(y), at(z), p) > 0) {
            cavity.add(across);
            stack.push(across);
            continue;
          }
        }
        if (across === undefined || !cavity.has(across)) boundary.push([a, b]);
      }
    }
    for (const u of cavity) remove(u);
    // An edge first seen as boundary may have joined the cavity later: keep only true borders.
    for (const [a, b] of boundary) {
      const across = owner.get(b * width + a);
      if (across !== undefined && cavity.has(across)) continue;
      last = add(a, b, k);
    }
  }

  const triangles: number[] = [];
  for (let t = 0; t < alive.length; t += 1) {
    if (!alive[t]) continue;
    const tri = [corners[3 * t] as number, corners[3 * t + 1] as number, corners[3 * t + 2] as number];
    if (tri.some((v) => v >= n)) continue;
    triangles.push(...tri);
  }
  const sides = new Map<string, readonly [number, number]>();
  for (let t = 0; t < triangles.length; t += 3) {
    for (let e = 0; e < 3; e += 1) {
      const u = triangles[t + e] as number;
      const v = triangles[t + ((e + 1) % 3)] as number;
      const edge = [Math.min(u, v), Math.max(u, v)] as const;
      sides.set(`${edge[0]},${edge[1]}`, edge);
    }
  }
  const edges = triangles.length === 0 ? chain(kept) : [...sides.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { triangles, edges, kept: sortedKept, duplicates };
}

/** Points with no triangle — two, or all on one line — are joined in `(x, y)` order. */
function chain(order: readonly number[]): [number, number][] {
  const edges: [number, number][] = [];
  for (let s = 1; s < order.length; s += 1) {
    const u = order[s - 1] as number;
    const v = order[s] as number;
    edges.push([Math.min(u, v), Math.max(u, v)]);
  }
  return edges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

/**
 * The Voronoi cell of each kept point inside `rect`: the rectangle clipped (Sutherland–Hodgman) by
 * the half-plane nearer the site than each of its mesh neighbours. Keyed by the site's index, in
 * `kept` order.
 */
export function voronoiCells(
  points: readonly Point[],
  mesh: Triangulation,
  rect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
): Map<number, Point[]> {
  const neighbours = new Map<number, number[]>(mesh.kept.map((k) => [k, []]));
  for (const [u, v] of mesh.edges) {
    neighbours.get(u)?.push(v);
    neighbours.get(v)?.push(u);
  }
  const cells = new Map<number, Point[]>();
  for (const k of mesh.kept) {
    const s = points[k] as Point;
    let cell: Point[] = [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height },
    ];
    for (const m of neighbours.get(k) ?? []) {
      const o = points[m] as Point;
      // Keep the side of the bisector nearer `s`: (p − mid) · (o − s) ≤ 0.
      const nx = o.x - s.x;
      const ny = o.y - s.y;
      const offset = (nx * (o.x + s.x) + ny * (o.y + s.y)) / 2;
      const side = (p: Point) => p.x * nx + p.y * ny - offset;
      const clipped: Point[] = [];
      for (let e = 0; e < cell.length; e += 1) {
        const a = cell[e] as Point;
        const b = cell[(e + 1) % cell.length] as Point;
        const sa = side(a);
        const sb = side(b);
        if (sa <= 0) clipped.push(a);
        if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
          const f = sa / (sa - sb);
          clipped.push({ x: a.x + f * (b.x - a.x), y: a.y + f * (b.y - a.y) });
        }
      }
      cell = clipped;
    }
    cells.set(k, cell);
  }
  return cells;
}
