/**
 * T-191..T-194 · the field charts of wave 3 (REQ-422..REQ-425): `DensityBinChart`, `ContourChart`,
 * `DelaunayChart` and `VectorFieldChart`. Each meets the second catalog's contract (support/),
 * then its own.
 */
import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, type ChartModel, type Datum, type SpCode } from '../src';
import { contourChart } from '../src/charts/contour-chart/contour-chart';
import { delaunayChart } from '../src/charts/delaunay-chart/delaunay-chart';
import { densityBinChart } from '../src/charts/density-bin-chart/density-bin-chart';
import { vectorFieldChart } from '../src/charts/vector-field-chart/vector-field-chart';
import { context, heightened, R, secondCatalogContract, type Case } from './support/second-catalog-contract';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

const CLOUD = { data: [{ px: 1, py: 1 }, { px: 1, py: 1 }, { px: 9, py: 9 }, { px: 5, py: 2 }, { px: 5, py: 2 }, { px: 5, py: 2 }], xKey: 'px', yKey: 'py' };
/** A 4 × 3 grid rising to the right. */
const GRID = {
  data: [0, 1, 2].flatMap((gy) => [0, 1, 2, 3].map((gx) => ({ gx, gy, gv: gx + gy / 2 }))),
  source: 'grid' as const,
  xKey: 'gx',
  yKey: 'gy',
  valueKey: 'gv',
  levels: [1.5, 2.5],
};
const SITES = {
  data: [
    { nm: 'A', sx: 0, sy: 0 },
    { nm: 'B', sx: 10, sy: 0 },
    { nm: 'C', sx: 10, sy: 8 },
    { nm: 'D', sx: 0, sy: 8 },
    { nm: 'E', sx: 4, sy: 3 },
    { nm: 'F', sx: 7, sy: 5 },
  ],
  xKey: 'sx',
  yKey: 'sy',
  labelKey: 'nm',
};
const VECTORS = {
  data: [0, 1].flatMap((vy) => [0, 1, 2].map((vx) => ({ vx, vy, vu: vx - 1, vv: vy + 0.5 }))),
  xKey: 'vx',
  yKey: 'vy',
  uKey: 'vu',
  vKey: 'vv',
};

const at = (d: Datum) => `${String(d.x)}, ${String(d.y)}`;
const CASES: Case[] = [
  { recipe: R(densityBinChart), consumer: CLOUD, items: 3, hostile: [{ px: 'x', py: 2 }], labelOf: at },
  { recipe: R(contourChart), consumer: GRID, items: 2, hostile: [{ gx: 9, gy: 9, gv: 'x' }], labelOf: (d) => String(d.level) },
  { recipe: R(delaunayChart), consumer: SITES, items: 6, hostile: [{ nm: 'bad', sx: 'x', sy: 1 }], labelOf: (d) => String(d.nm), rawDatum: true },
  { recipe: R(vectorFieldChart), consumer: VECTORS, items: 6, hostile: [{ vx: 0, vy: 0, vu: 'x', vv: 1 }], labelOf: at },
];

secondCatalogContract(CASES);

const toned = (model: ChartModel) => model.geometry.strokes.filter((s) => s.role === 'encoding' && s.tone !== undefined);
const texts = (model: ChartModel) => model.geometry.labels.map((l) => l.text);
const column = (model: ChartModel, name: string) => model.table.rows.map((r) => r[model.table.columns.indexOf(name)] as string);

describe('DensityBinChart (T-191)', () => {
  test('REQ-422 · I-24 · the demo: hexagonal bins whose counts sum to the 1 200 points, toned by count', () => {
    const model = densityBinChart.build({}, context);
    expect(column(model, 'count').reduce((s, c) => s + Number(c), 0)).toBe(1200);
    const counts = model.geometry.hitAreas.map((h) => h.value);
    const max = Math.max(...counts);
    const densest = model.geometry.hitAreas.find((h) => h.value === max);
    // Seven-sided paths: a hexagon is M plus five L and Z.
    expect(toned(model).every((s) => (s.d.match(/L/g) ?? []).length === 5)).toBe(true);
    expect(toned(model).some((s) => s.tone === 4)).toBe(true);
    expect(heightened(model)[0]?.d).toBe(toned(model)[model.geometry.hitAreas.indexOf(densest as never)]?.d);
  });

  test('REQ-422 · rectangular bins and their size; an invalid size is the default, warned SP021', () => {
    const rect = densityBinChart.build({ binShape: 'rect' }, context);
    expect(toned(rect).every((s) => /^M[^L]+H[^V]+V[^H]+H[^Z]+Z$/.test(s.d))).toBe(true);
    const fine = densityBinChart.build({ binSize: 7 }, context);
    expect(fine.geometry.hitAreas.length).toBeGreaterThan(densityBinChart.build({}, context).geometry.hitAreas.length);
    const seen = capture();
    expect(densityBinChart.build({ binSize: -3 }, context).geometry.hitAreas.length).toBe(densityBinChart.build({}, context).geometry.hitAreas.length);
    expect(seen).toContain('SP021');
  });

  test('REQ-440 · REQ-124 · a key names the count range of each tone', () => {
    const model = densityBinChart.build(CLOUD, context);
    // Counts 1..3: tone 1 holds none (≤ 0.75), so the key lists what is drawn.
    expect(texts(model)).toEqual(expect.arrayContaining(['1', '2', '3']));
  });

  test('REQ-443 · above 10 000 points SP008, still drawn', () => {
    const seen = capture();
    const data = Array.from({ length: 10_001 }, (_, k) => ({ x: k % 97, y: k % 89 }));
    expect(densityBinChart.build({ data, xKey: 'x', yKey: 'y' }, context).geometry.hitAreas.length).toBeGreaterThan(0);
    expect(seen).toContain('SP008');
  });
});

describe('ContourChart (T-192)', () => {
  test('REQ-423 · the grid demo: levels at the nice ticks inside its range, a filled band per level toned up the ramp', () => {
    const model = contourChart.build({ source: 'grid' }, context);
    expect(model.geometry.hitAreas.map((h) => h.value)).toEqual([0, 2, 4, 6]);
    expect(toned(model).map((s) => s.tone)).toEqual([1, 2, 3, 4]);
    expect(heightened(model)[0]?.d).toBe(toned(model).at(-1)?.d);
    for (const t of ['0', '2', '4', '6']) expect(model.table.rows.map((r) => r[0])).toContain(t);
  });

  test('REQ-423 · unfilled: the iso-lines alone, no tone; the highest level\'s line heightened', () => {
    const model = contourChart.build({ source: 'grid', filled: false }, context);
    expect(toned(model)).toEqual([]);
    expect(heightened(model)).toHaveLength(1);
  });

  test('REQ-423 · REQ-432 · the points demo: density as a share of its peak, levels printed as percentages', () => {
    const model = contourChart.build({}, context);
    expect(model.table.rows.map((r) => r[0])).toEqual(['20%', '40%', '60%', '80%']);
    expect(model.description).toMatch(/Epanechnikov/);
    expect(contourChart.build({ levels: 2 }, context).table.rows.map((r) => r[0])).toEqual(['33%', '67%']);
  });

  test('REQ-433 · levels not increasing are the default, warned SP021', () => {
    const seen = capture();
    expect(contourChart.build({ source: 'grid', levels: [3, 1] }, context).geometry.hitAreas.map((h) => h.value)).toEqual([0, 2, 4, 6]);
    expect(seen).toContain('SP021');
  });

  test('REQ-423 · Data Model §2.24 · a missing cell is a hole: drawn round, no NaN', () => {
    const data = GRID.data.filter((d) => !(d.gx === 1 && d.gy === 1));
    const model = contourChart.build({ ...GRID, data }, context);
    expect(JSON.stringify(model.geometry)).not.toMatch(/NaN/);
    expect(model.geometry.hitAreas.length).toBeGreaterThan(0);
  });

  test('REQ-443 · above 60 × 60 grid cells SP008', () => {
    const seen = capture();
    const data = Array.from({ length: 61 * 60 }, (_, k) => ({ x: k % 61, y: Math.floor(k / 61), value: k % 7 }));
    contourChart.build({ source: 'grid', data, xKey: 'x', yKey: 'y', valueKey: 'value' }, context);
    expect(seen).toContain('SP008');
  });
});

describe('DelaunayChart (T-193)', () => {
  test('REQ-424 · the demo: 60 points, the mesh as one secondary stroke, the busiest point heightened', () => {
    const model = delaunayChart.build({}, context);
    expect(model.geometry.hitAreas).toHaveLength(60);
    expect(model.geometry.strokes.filter((s) => s.part === 'ink-secondary' && s.role === 'encoding')).toHaveLength(1);
    const max = Math.max(...model.geometry.hitAreas.map((h) => h.value));
    // A tie goes to the lowest x, then y, in data units.
    const busiest = model.geometry.hitAreas
      .filter((h) => h.value === max)
      .sort((a, b) => Number(a.datum.x) - Number(b.datum.x) || Number(a.datum.y) - Number(b.datum.y))[0] as { x: number; y: number };
    expect(heightened(model)[0]?.d).toMatch(new RegExp(`^M${busiest.x - 3.5},${busiest.y}A`));
  });

  test('REQ-424 · a rectangle round two points: triangles ABE, ADE, BCF, BEF, DEF, CDF (by hand), so these degrees', () => {
    const model = delaunayChart.build(SITES, context);
    expect(column(model, 'degree')).toEqual(['3', '4', '3', '4', '4', '4']);
    // Four tie at 4: the one of lowest x, then y, is heightened, whatever the row order — D.
    const b = model.geometry.hitAreas[3] as { x: number; y: number };
    expect(heightened(model)[0]?.d).toMatch(new RegExp(`^M${b.x - 3.5},${b.y}A`));
  });

  test('REQ-424 · voronoi: one closed cell per point', () => {
    const model = delaunayChart.build({ ...SITES, mesh: 'voronoi' }, context);
    const mesh = model.geometry.strokes.find((s) => s.part === 'ink-secondary') as { d: string };
    expect((mesh.d.match(/Z/g) ?? []).length).toBe(6);
  });

  test('REQ-424 · a repeated point is drawn once, warned SP002, its degree left blank', () => {
    const seen = capture();
    const model = delaunayChart.build({ ...SITES, data: [...SITES.data, { nm: 'A2', sx: 0, sy: 0 }] }, context);
    expect(seen).toContain('SP002');
    expect(model.geometry.hitAreas).toHaveLength(6);
    expect(column(model, 'degree').at(-1)).toBe('—');
  });

  test('REQ-443 · above 500 points SP008', () => {
    const seen = capture();
    delaunayChart.build({ data: Array.from({ length: 501 }, (_, k) => ({ x: k % 31, y: (k * 7) % 29 })), xKey: 'x', yKey: 'y' }, context);
    expect(seen).toContain('SP008');
  });
});

describe('VectorFieldChart (T-194)', () => {
  const length = (d: string) => {
    const [x0, y0, x1, y1] = (d.match(/^M(-?[\d.]+),(-?[\d.]+)L(-?[\d.]+),(-?[\d.]+)/) ?? []).slice(1).map(Number) as [number, number, number, number];
    return Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
  };

  test('REQ-425 · the demo: an arrow per grid point, the largest magnitude heightened (the first in grid order)', () => {
    const model = vectorFieldChart.build({}, context);
    expect(model.geometry.hitAreas).toHaveLength(280);
    const max = Math.max(...model.geometry.hitAreas.map((h) => h.value));
    const first = model.geometry.hitAreas.findIndex((h) => h.value === max);
    const arrows = model.geometry.strokes.filter((s) => s.role === 'encoding' && s.part === 'ink');
    expect(heightened(model)[0]?.d).toBe(arrows[first]?.d);
  });

  test('REQ-425 · an arrow\'s length is its magnitude times the scale; it points along (u, v), up being +v', () => {
    const model = vectorFieldChart.build({ ...VECTORS, scale: 10 }, context);
    const arrows = model.geometry.strokes.filter((s) => s.role === 'encoding' && s.part === 'ink' && s.d.includes('Z') && !s.d.includes('A'));
    const magnitude = (u: number, v: number) => Math.sqrt(u * u + v * v);
    // Shaft plus head: the shaft is the first segment; with the head it spans the magnitude.
    const first = arrows[0] as { d: string };
    const tip = first.d.match(/M(-?[\d.]+),(-?[\d.]+)L(-?[\d.]+),(-?[\d.]+)M(-?[\d.]+),(-?[\d.]+)/)?.slice(1).map(Number) as number[];
    const span = Math.sqrt((tip[4]! - tip[0]!) ** 2 + (tip[5]! - tip[1]!) ** 2);
    // The first arrow is the top row's first: (0, 1), so (u, v) = (−1, 1.5).
    expect(span).toBeCloseTo(magnitude(-1, 1.5) * 10, 1);
    // u < 0: the tip is left of the tail; v > 0: above it.
    expect(tip[4]!).toBeLessThan(tip[0]!);
    expect(tip[5]!).toBeLessThan(tip[1]!);
    expect(length(first.d)).toBeGreaterThan(0);
  });

  test('REQ-425 · a zero vector is a dot; an invalid scale is the default, warned SP021', () => {
    const data = [{ vx: 0, vy: 0, vu: 0, vv: 0 }, { vx: 1, vy: 0, vu: 1, vv: 0 }];
    const model = vectorFieldChart.build({ ...VECTORS, data }, context);
    expect(model.geometry.strokes.some((s) => s.role === 'encoding' && s.d.includes('A'))).toBe(true);
    const seen = capture();
    vectorFieldChart.build({ ...VECTORS, scale: 0 }, context);
    expect(seen).toContain('SP021');
  });

  test('REQ-443 · above 60 × 60 grid cells SP008', () => {
    const seen = capture();
    const data = Array.from({ length: 61 * 60 }, (_, k) => ({ x: k % 61, y: Math.floor(k / 61), u: 1, v: 0 }));
    vectorFieldChart.build({ data, xKey: 'x', yKey: 'y', uKey: 'u', vKey: 'v' }, context);
    expect(seen).toContain('SP008');
  });
});
