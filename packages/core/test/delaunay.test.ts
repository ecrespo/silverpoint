/**
 * T-190 · the triangulation the core owns (DD-028): Bowyer–Watson on the 2-decimal grid with an
 * exact `orient2d`, an `inCircle` filtered in doubles and settled with `BigInt`, and the Voronoi
 * cells by clipping. REQ-424, REQ-430, REQ-435; I-23.
 */
import { describe, expect, test } from 'vitest';
import { inCircle, orient2d, triangulate, voronoiCells, type Triangulation } from '../src/charts/shared/delaunay';
import { createPrng } from '../src/render/prng';

type P = { x: number; y: number };

const random = createPrng(424);
const RANDOM: P[] = Array.from({ length: 300 }, () => ({ x: Math.round(random() * 60000) / 100, y: Math.round(random() * 40000) / 100 }));
const GRID: P[] = Array.from({ length: 36 }, (_, k) => ({ x: (k % 6) * 20, y: Math.floor(k / 6) * 20 }));
const COLLINEAR: P[] = Array.from({ length: 12 }, (_, k) => ({ x: k * 7.5, y: k * 2.5 }));
const DUPLICATED: P[] = [...RANDOM.slice(0, 40), ...RANDOM.slice(0, 10), { x: RANDOM[3]!.x + 0.001, y: RANDOM[3]!.y }];

const hundredths = (p: P) => ({ x: Math.round(p.x * 100), y: Math.round(p.y * 100) });

/** Every triangle is counter-clockwise and no drawn point lies strictly inside its circumcircle (exact). */
function delaunayProperty(points: readonly P[], { triangles, kept }: Triangulation): void {
  const q = points.map(hundredths);
  for (let t = 0; t < triangles.length; t += 3) {
    const [a, b, c] = [q[triangles[t]!]!, q[triangles[t + 1]!]!, q[triangles[t + 2]!]!];
    expect(orient2d(a, b, c)).toBeGreaterThan(0);
    for (const k of kept) expect(inCircle(a, b, c, q[k]!), `triangle ${t / 3}, point ${k}`).toBeLessThanOrEqual(0);
  }
}

/** Points on the convex hull, collinear ones included (Andrew's monotone chain, exact). */
function hullCount(points: readonly P[]): number {
  const q = [...new Map(points.map(hundredths).map((p) => [`${p.x},${p.y}`, p])).values()].sort((a, b) => a.x - b.x || a.y - b.y);
  const chain = (list: typeof q) => {
    const out: typeof q = [];
    for (const p of list) {
      while (out.length >= 2 && orient2d(out[out.length - 2]!, out[out.length - 1]!, p) < 0) out.pop();
      out.push(p);
    }
    return out;
  };
  return chain(q).length + chain([...q].reverse()).length - 2;
}

const sets = (points: readonly P[], { triangles }: Triangulation) => {
  const key = (k: number) => `${points[k]!.x},${points[k]!.y}`;
  const out: string[] = [];
  for (let t = 0; t < triangles.length; t += 3) out.push([key(triangles[t]!), key(triangles[t + 1]!), key(triangles[t + 2]!)].sort().join('|'));
  return out.sort();
};

describe('T-190 · exact predicates', () => {
  test('REQ-435 · orient2d is the sign of the turn; inCircle the side of the circumcircle', () => {
    expect(orient2d({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 })).toBeGreaterThan(0);
    expect(orient2d({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 20 })).toBe(0);
    const [a, b, c] = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 0, y: 200 }];
    expect(inCircle(a, b, c, { x: 100, y: 100 })).toBeGreaterThan(0);
    expect(inCircle(a, b, c, { x: 200, y: 200 })).toBe(0);
    expect(inCircle(a, b, c, { x: 201, y: 200 })).toBeLessThan(0);
  });

  test('REQ-435 · a co-circular point far from the origin, beyond what doubles settle, is exactly on the circle', () => {
    // A square of odd side 90 000 001: its terms are ~6.6e31, far past a double's 53 bits.
    const s = 90_000_001;
    expect(inCircle({ x: 0, y: 0 }, { x: s, y: 0 }, { x: s, y: s }, { x: 0, y: s })).toBe(0);
    expect(inCircle({ x: 0, y: 0 }, { x: s, y: 0 }, { x: s, y: s }, { x: 1, y: s - 1 })).toBeGreaterThan(0);
    expect(inCircle({ x: 0, y: 0 }, { x: s, y: 0 }, { x: s, y: s }, { x: -1, y: s })).toBeLessThan(0);
    // Four integer points on x² + y² = 5²⁰: in doubles the determinant comes out −4 398 046 511 104.
    expect(inCircle({ x: 740625, y: 9737500 }, { x: -9653287, y: 1476984 }, { x: -740625, y: -9737500 }, { x: 9653287, y: -1476984 })).toBe(0);
  });
});

describe('T-190 · Bowyer–Watson', () => {
  test('REQ-424 · a square is two triangles; with its centre, four', () => {
    expect(triangulate([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]).triangles).toHaveLength(6);
    expect(triangulate([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 5, y: 5 }]).triangles).toHaveLength(12);
  });

  test.each([
    ['random', RANDOM],
    ['grid-aligned', GRID],
    ['duplicated', DUPLICATED],
  ] as const)('REQ-424 · %s points: empty circumcircles (exact), and 2n − 2 − h triangles', (_name, points) => {
    const result = triangulate(points);
    delaunayProperty(points, result);
    expect(result.triangles.length / 3).toBe(2 * result.kept.length - 2 - hullCount(points));
  });

  test('REQ-424 · collinear points make no triangle; every point is kept', () => {
    const result = triangulate(COLLINEAR);
    expect(result.triangles).toEqual([]);
    expect(result.kept).toHaveLength(COLLINEAR.length);
  });

  test('REQ-424 · a duplicate on the 2-decimal grid is dropped, the first row kept', () => {
    const result = triangulate(DUPLICATED);
    expect(result.kept).toHaveLength(40);
    expect(result.kept).toEqual([...result.kept].sort((a, b) => a - b));
    expect(result.duplicates).toEqual([40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50]);
  });

  test('REQ-424 · edges are the triangles\' sides once each, and a point\'s degree counts them', () => {
    const result = triangulate(RANDOM);
    const sides = new Set<string>();
    for (let t = 0; t < result.triangles.length; t += 3) {
      for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
        const u = result.triangles[t + a]!;
        const v = result.triangles[t + b]!;
        sides.add(`${Math.min(u, v)}-${Math.max(u, v)}`);
      }
    }
    expect(result.edges.map(([u, v]) => `${u}-${v}`).sort()).toEqual([...sides].sort());
    expect(result.edges.every(([u, v]) => u < v)).toBe(true);
  });

  test.each([
    ['random', RANDOM],
    ['co-circular (grid)', GRID],
  ] as const)('REQ-435 · I-23 · %s: the triangulation does not depend on the order of the points', (_name, points) => {
    const shuffled = points.map((p) => [random(), p] as const).sort((a, b) => a[0] - b[0]).map(([, p]) => p);
    expect(sets(shuffled, triangulate(shuffled))).toEqual(sets(points, triangulate(points)));
  });
});

describe('T-190 · Voronoi by clipping', () => {
  const rect = { x: 0, y: 0, width: 600, height: 400 };
  const polygonArea = (cell: readonly P[]) => {
    let twice = 0;
    cell.forEach((a, k) => {
      const b = cell[(k + 1) % cell.length]!;
      twice += a.x * b.y - b.x * a.y;
    });
    return Math.abs(twice / 2);
  };

  test('REQ-424 · the cells tile the plot, and every corner of a cell is no nearer another site', () => {
    const tri = triangulate(RANDOM);
    const cells = voronoiCells(RANDOM, tri, rect);
    expect(cells.size).toBe(tri.kept.length);
    let area = 0;
    const nearer: string[] = [];
    for (const [site, cell] of cells) {
      area += polygonArea(cell);
      const s = RANDOM[site]!;
      for (const corner of cell) {
        const own = (corner.x - s.x) ** 2 + (corner.y - s.y) ** 2;
        for (const k of tri.kept) {
          const o = RANDOM[k]!;
          if (own > (corner.x - o.x) ** 2 + (corner.y - o.y) ** 2 + 1e-6) nearer.push(`${site}: ${corner.x},${corner.y} is nearer ${k}`);
        }
      }
    }
    expect(nearer).toEqual([]);
    expect(area).toBeCloseTo(rect.width * rect.height, 3);
  });

  test('REQ-424 · collinear sites still get cells, the strips between their bisectors', () => {
    const tri = triangulate(COLLINEAR);
    const cells = voronoiCells(COLLINEAR, tri, { x: -10, y: -10, width: 120, height: 60 });
    expect([...cells.values()].reduce((s, c) => s + polygonArea(c), 0)).toBeCloseTo(120 * 60, 3);
  });
});
