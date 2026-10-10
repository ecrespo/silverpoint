/**
 * T-190 · the field engine the core owns (DD-028): marching squares with saddle resolution and
 * band rings, the Epanechnikov density splat, and the hexagonal and rectangular 2-D bins.
 * REQ-430, REQ-435, REQ-422, REQ-423; I-23.
 */
import { describe, expect, test } from 'vitest';
import { readGrid, readPointCloud } from '../src/charts/shared/contracts';
import { bandRings, contours, densityGrid, hexBins, hexagonPath, isoLines, isoRings, rectBins, ringArea, type ScalarGrid } from '../src/charts/shared/field';
import { CONTOUR_CHART_GRID_DEMO, CONTOUR_CHART_GRID_DEMO_KEYS } from '../src/charts/contour-chart/demo';
import { DENSITY_BIN_CHART_DEMO } from '../src/charts/density-bin-chart/demo';
import { createPrng } from '../src/render/prng';

/** A grid from rows written top to bottom as `rows[j][i]`. */
const gridOf = (rows: readonly (readonly (number | undefined)[])[]): ScalarGrid => ({
  nx: rows[0]?.length ?? 0,
  ny: rows.length,
  values: rows.flat(),
});

const total = (rings: readonly (readonly { x: number; y: number }[])[]) => rings.reduce((s, r) => s + ringArea(r), 0);

const demoGrid = (): ScalarGrid => {
  const k = CONTOUR_CHART_GRID_DEMO_KEYS;
  const grid = readGrid('ContourChart', CONTOUR_CHART_GRID_DEMO, { x: k.xKey, y: k.yKey, value: k.valueKey });
  return { nx: grid.xs.length, ny: grid.ys.length, values: grid.values };
};

describe('T-190 · marching squares', () => {
  test('REQ-423 · a single peak: one ring, the diamond through the four edge midpoints', () => {
    const rings = isoRings(gridOf([[0, 0, 0], [0, 1, 0], [0, 0, 0]]), 0.5);
    expect(rings).toHaveLength(1);
    const points = (rings[0] ?? []).map((p) => `${p.x},${p.y}`).sort();
    expect(points).toEqual(['0.5,1', '1,0.5', '1,1.5', '1.5,1']);
    expect(Math.abs(ringArea(rings[0] ?? []))).toBeCloseTo(0.5, 12);
  });

  test('REQ-423 · every iso-line vertex lies on a cell edge and interpolates to its level', () => {
    const grid = demoGrid();
    expect(grid.nx * grid.ny).toBe(1200);
    const at = (i: number, j: number) => grid.values[j * grid.nx + i] as number;
    for (const level of [-0.5, 0, 0.4, 0.9]) {
      const lines = isoLines(grid, level);
      expect(lines.length, `level ${level}`).toBeGreaterThan(0);
      for (const line of lines) {
        for (const { x, y } of line) {
          const onColumn = Number.isInteger(x);
          expect(onColumn || Number.isInteger(y), `${x},${y}`).toBe(true);
          // Linear along the edge the vertex lies on.
          const value = onColumn
            ? at(x, Math.floor(y)) + (y - Math.floor(y)) * (at(x, Math.ceil(y)) - at(x, Math.floor(y)))
            : at(Math.floor(x), y) + (x - Math.floor(x)) * (at(Math.ceil(x), y) - at(Math.floor(x), y));
          expect(value).toBeCloseTo(level, 9);
        }
      }
    }
  });

  test('REQ-423 · a saddle is resolved by the cell centre: joined above it, apart below it', () => {
    const saddle = gridOf([[1, 0], [0, 1]]);
    expect(isoRings(saddle, 0.5)).toHaveLength(1);
    expect(isoRings(saddle, 0.6)).toHaveLength(2);
  });

  test('REQ-423 · rings are oriented: a hole turns the other way, so a filled region needs no fill rule', () => {
    const rings = isoRings(gridOf([[1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 0, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1]]), 0.5);
    expect(rings).toHaveLength(2);
    const areas = rings.map(ringArea).sort((a, b) => Math.abs(b) - Math.abs(a));
    expect(Math.abs(areas[0] as number)).toBeCloseTo(16, 12);
    expect(Math.abs(areas[1] as number)).toBeCloseTo(0.5, 12);
    expect(Math.sign(areas[0] as number)).toBe(-Math.sign(areas[1] as number));
    expect(Math.abs(total(rings))).toBeCloseTo(15.5, 12);
  });

  test('REQ-423 · filled bands: their areas sum to the region above the lowest level, the whole grid below every value', () => {
    const grid = demoGrid();
    const levels = [-0.6, -0.2, 0.2, 0.6, 1];
    const bands = levels.map((level, k) => total(bandRings(grid, level, levels[k + 1])));
    for (const area of bands) expect(area * Math.sign(total(isoRings(grid, -10)))).toBeGreaterThanOrEqual(-1e-9);
    expect(bands.reduce((s, a) => s + a, 0)).toBeCloseTo(total(isoRings(grid, levels[0] as number)), 9);
    expect(Math.abs(total(isoRings(grid, -10)))).toBeCloseTo((grid.nx - 1) * (grid.ny - 1), 9);
  });

  test('REQ-423 · a hole is below every level: the cells round it are cut on the diagonal, and no NaN', () => {
    const rows = Array.from({ length: 5 }, (_, j) => Array.from({ length: 5 }, (_, i) => (i === 2 && j === 2 ? undefined : 1)));
    const rings = isoRings(gridOf(rows), 0);
    expect(Math.abs(total(rings))).toBeCloseTo(16 - 2, 12);
    expect(JSON.stringify(rings)).not.toMatch(/NaN|null/);
    // The edge of a hole is not an iso-line: nothing is drawn at a level every value is above.
    expect(isoLines(gridOf(rows), 0)).toEqual([]);
  });

  test('REQ-445 · contours traces each level once: its rings, its lines and its band are the ones above', () => {
    const grid = demoGrid();
    const levels = [-0.2, 0.4, 1.2];
    const traced = contours(grid, levels);
    expect(traced.map((c) => c.level)).toEqual(levels);
    traced.forEach((c, k) => {
      expect(c.rings).toEqual(isoRings(grid, levels[k] as number));
      expect(c.lines).toEqual(isoLines(grid, levels[k] as number));
      expect(c.band).toEqual(bandRings(grid, levels[k] as number, levels[k + 1]));
    });
  });

  test('REQ-435 · I-23 · the rings are a pure function of the grid', () => {
    const grid = demoGrid();
    expect(JSON.stringify(isoRings(grid, 0.3))).toBe(JSON.stringify(isoRings({ ...grid, values: [...grid.values] }, 0.3)));
  });
});

describe('T-190 · density splat', () => {
  const cloud = () => readPointCloud('ContourChart', DENSITY_BIN_CHART_DEMO, { x: 'x', y: 'y' });

  test('REQ-432 · the Epanechnikov density of the demo integrates to 1 over a domain that holds it', () => {
    const points = cloud();
    const grid = densityGrid(points, { x: [-20, 120], y: [-20, 120] }, 141, 141, { x: 6, y: 6 });
    const sum = grid.values.reduce((s: number, v) => s + (v ?? 0), 0);
    expect(sum).toBeCloseTo(1, 2);
    expect(grid.values.every((v) => v !== undefined && v >= 0)).toBe(true);
  });

  test('REQ-432 · a node farther than the bandwidth from every point is 0', () => {
    const grid = densityGrid([{ x: 0, y: 0 }], { x: [0, 10], y: [0, 10] }, 11, 11, { x: 2, y: 2 });
    expect(grid.values[0]).toBeGreaterThan(0);
    expect(grid.values[2]).toBe(0);
    expect(grid.values[2 * 11]).toBe(0);
  });

  test('REQ-435 · I-23 · shuffling the points leaves every value identical to the last bit', () => {
    const points = cloud();
    const random = createPrng(190);
    const shuffled = points.map((p) => [random(), p] as const).sort((a, b) => a[0] - b[0]).map(([, p]) => p);
    const options = [{ x: [0, 100], y: [0, 100] }, 40, 30, { x: 5, y: 7 }] as const;
    expect(densityGrid(shuffled, ...options).values).toEqual(densityGrid(points, ...options).values);
  });
});

describe('T-190 · 2-D bins', () => {
  const random = createPrng(422);
  const points = Array.from({ length: 2000 }, (_, index) => ({ x: random() * 300, y: random() * 200, index }));

  test('REQ-422 · I-24 · hexagonal bins: counts sum to n, each point in the hexagon of the nearest centre', () => {
    const bins = hexBins(points, 14, { x: 0, y: 0 });
    expect(bins.reduce((s, b) => s + b.count, 0)).toBe(points.length);
    // Every lattice centre within two rows and columns of the point, bins or not.
    const r = 14 / Math.sqrt(3);
    const near = (p: { x: number; y: number }) => {
      const row = Math.round(p.y / (1.5 * r));
      const out: [number, number][] = [];
      for (let j = row - 2; j <= row + 2; j += 1) {
        const column = Math.round(p.x / 14);
        for (let i = column - 2; i <= column + 2; i += 1) out.push([(i + (j & 1) / 2) * 14, j * 1.5 * r]);
      }
      return out;
    };
    for (const bin of bins) {
      for (const k of bin.indices) {
        const p = points[k] as { x: number; y: number };
        const own = (p.x - bin.cx) ** 2 + (p.y - bin.cy) ** 2;
        for (const [cx, cy] of near(p)) expect(own).toBeLessThanOrEqual((p.x - cx) ** 2 + (p.y - cy) ** 2 + 1e-9);
      }
    }
  });

  test('REQ-422 · hexagonal bins are ordered by row then column, and their cells name them', () => {
    const bins = hexBins(points, 14, { x: 0, y: 0 });
    for (let k = 1; k < bins.length; k += 1) {
      const a = bins[k - 1] as (typeof bins)[number];
      const b = bins[k] as (typeof bins)[number];
      expect(a.row < b.row || (a.row === b.row && a.column < b.column)).toBe(true);
    }
  });

  test('REQ-422 · NFR §7 · a hexagon of size w is w across its flats, pointy at top and bottom, its flats written as V', () => {
    const d = hexagonPath(10, 20, 14);
    expect(d).toMatch(/^M[^L]+L[^V]+V[^L]+L[^L]+L[^V]+V[^Z]+Z$/);
    // The vertices, a V keeping the x before it.
    const xy: (readonly [number, number])[] = [];
    for (const [, command, args] of d.matchAll(/([MLV])([^MLVZ]+)/g)) {
      const values = (args as string).split(',').map(Number);
      xy.push(command === 'V' ? [(xy.at(-1) as [number, number])[0], values[0] as number] : [values[0] as number, values[1] as number]);
    }
    expect(xy).toHaveLength(6);
    expect(Math.max(...xy.map(([x]) => x)) - Math.min(...xy.map(([x]) => x))).toBeCloseTo(14, 9);
    expect(Math.min(...xy.map(([, y]) => y))).toBeCloseTo(20 - 14 / Math.sqrt(3), 9);
  });

  test('REQ-422 · I-24 · rectangular bins: counts sum to n, each point inside its square', () => {
    const bins = rectBins(points, 14, { x: 0, y: 0 });
    expect(bins.reduce((s, b) => s + b.count, 0)).toBe(points.length);
    for (const bin of bins) {
      for (const k of bin.indices) {
        const p = points[k] as { x: number; y: number };
        expect(Math.abs(p.x - bin.cx)).toBeLessThanOrEqual(7);
        expect(Math.abs(p.y - bin.cy)).toBeLessThanOrEqual(7);
      }
    }
  });
});
