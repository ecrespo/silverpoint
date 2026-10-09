/**
 * T-167 · the 27 frozen demos of the second catalog (REQ-446, REQ-093, Data Model delta §4). They
 * are generated once, with a fixed seed, and committed as literals: regenerating reproduces every
 * committed file byte for byte, every demo is deep-frozen (I-9), and each one has the shape its
 * Data Model row promises.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { DEMO_FILES, demoPath, renderDemoFile } from './demo-gen';

type Row = Record<string, unknown>;

/** Imports a committed demo module. */
const load = (slug: string) => import(`../../packages/core/src/charts/${slug}/demo.ts`) as Promise<Record<string, unknown>>;
const rows = async (slug: string, name: string) => (await load(slug))[name] as readonly Row[];

function deepFrozen(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return true;
  return Object.isFrozen(value) && Object.values(value).every(deepFrozen);
}

const SLUGS = [
  'histogram-chart', 'ecdf-chart', 'box-plot-chart', 'violin-chart', 'ridgeline-chart', 'beeswarm-chart',
  'lollipop-chart', 'dumbbell-chart', 'slope-chart', 'bump-chart', 'error-bar-chart', 'interval-chart',
  'diverging-bar-chart', 'connected-scatter-chart', 'waffle-chart', 'marimekko-chart', 'squarified-treemap',
  'sunburst-chart', 'tree-chart', 'parallel-coordinates-chart', 'polar-line-chart', 'polar-scatter-chart',
  'density-bin-chart', 'contour-chart', 'delaunay-chart', 'vector-field-chart', 'network-chart',
];

describe('T-167 · generation (REQ-446)', () => {
  test('REQ-446 · one demo file per chart of §6.4.2, 27 in all', () => {
    expect(DEMO_FILES.map((f) => f.slug).sort()).toEqual([...SLUGS].sort());
  });

  test.each(SLUGS)('REQ-446 · %s · regenerating reproduces the committed file byte for byte', (slug) => {
    const file = DEMO_FILES.find((f) => f.slug === slug);
    expect(file).toBeDefined();
    expect(existsSync(demoPath(slug))).toBe(true);
    expect(readFileSync(demoPath(slug), 'utf8')).toBe(renderDemoFile(file!));
  });

  test.each(SLUGS)('REQ-446 · %s · every export is deep-frozen (I-9)', async (slug) => {
    const module = await load(slug);
    expect(Object.keys(module).length).toBeGreaterThanOrEqual(2);
    for (const value of Object.values(module)) expect(deepFrozen(value)).toBe(true);
  });

  test('REQ-446 · the generator never runs at render time: no core module imports it', () => {
    for (const slug of SLUGS) expect(readFileSync(demoPath(slug), 'utf8')).not.toMatch(/from '[^']*(tools|prng)|createPrng\(/);
  });
});

describe('T-167 · each demo exercises its statistic or layout (Data Model delta §4)', () => {
  test('REQ-446 · histogram, ECDF, beeswarm · 240 right-skewed reading times with ties, two devices', async () => {
    const data = await rows('histogram-chart', 'HISTOGRAM_CHART_DEMO');
    const minutes = data.map((r) => r.minutes as number).sort((a, b) => a - b);
    expect(data).toHaveLength(240);
    expect(new Set(minutes).size).toBeLessThan(240);
    const mean = minutes.reduce((s, v) => s + v, 0) / minutes.length;
    expect(mean).toBeGreaterThan(minutes[120] as number);
    expect(new Set(data.map((r) => r.device))).toEqual(new Set(['phone', 'desktop']));
    expect((await load('ecdf-chart')).ECDF_CHART_DEMO).toBe(data);
    expect((await load('beeswarm-chart')).BEESWARM_CHART_DEMO).toBe(data);
  });

  test('REQ-446 · box, violin, ridgeline · 5 groups of 24 to 60, none too small for its statistic (A-09)', async () => {
    const data = await rows('box-plot-chart', 'BOX_PLOT_CHART_DEMO');
    const sizes = new Map<string, number>();
    for (const r of data) sizes.set(r.service as string, (sizes.get(r.service as string) ?? 0) + 1);
    expect(sizes.size).toBe(5);
    for (const n of sizes.values()) expect(n >= 24 && n <= 60).toBe(true);
    expect((await load('violin-chart')).VIOLIN_CHART_DEMO).toBe(data);
    expect((await load('ridgeline-chart')).RIDGELINE_CHART_DEMO).toBe(data);
  });

  test('REQ-446 · lollipop · 12 categories, some names long', async () => {
    const data = await rows('lollipop-chart', 'LOLLIPOP_CHART_DEMO');
    expect(data).toHaveLength(12);
    expect(data.some((r) => (r.branch as string).length > 16)).toBe(true);
  });

  test('REQ-446 · dumbbell, slope · 10 categories over two periods, two of them decreasing', async () => {
    const data = await rows('dumbbell-chart', 'DUMBBELL_CHART_DEMO');
    expect(data).toHaveLength(10);
    expect(data.filter((r) => (r.y2025 as number) < (r.y2024 as number))).toHaveLength(2);
    expect((await load('slope-chart')).SLOPE_CHART_DEMO).toBe(data);
  });

  test('REQ-446 · bump · 6 series × 8 periods, exactly one tie', async () => {
    const data = await rows('bump-chart', 'BUMP_CHART_DEMO');
    expect(data).toHaveLength(48);
    expect(new Set(data.map((r) => r.team)).size).toBe(6);
    const periods = new Set(data.map((r) => r.season));
    expect(periods.size).toBe(8);
    let ties = 0;
    for (const p of periods) {
      const points = data.filter((r) => r.season === p).map((r) => r.points);
      ties += points.length - new Set(points).size;
    }
    expect(ties).toBe(1);
  });

  test('REQ-446 · error bars · 8 asymmetric intervals, some crossing the reference 0', async () => {
    const data = await rows('error-bar-chart', 'ERROR_BAR_CHART_DEMO');
    expect(data).toHaveLength(8);
    const crossing = data.filter((r) => (r.low as number) < 0 && (r.high as number) > 0).length;
    expect(crossing > 0 && crossing < 8).toBe(true);
    expect(data.every((r) => (r.low as number) <= (r.effect as number) && (r.effect as number) <= (r.high as number))).toBe(true);
    expect(data.some((r) => (r.effect as number) - (r.low as number) !== (r.high as number) - (r.effect as number))).toBe(true);
  });

  test('REQ-446 · interval · 4 lanes of 3 to 5 intervals, ISO dates in one quarter, an overlap in a lane', async () => {
    const data = await rows('interval-chart', 'INTERVAL_CHART_DEMO');
    const lanes = new Map<string, Row[]>();
    for (const r of data) lanes.set(r.crew as string, [...(lanes.get(r.crew as string) ?? []), r]);
    expect(lanes.size).toBe(4);
    for (const lane of lanes.values()) expect(lane.length >= 3 && lane.length <= 5).toBe(true);
    for (const r of data) {
      expect(r.from).toMatch(/^2026-0[1-3]-\d\d$/);
      expect(r.to).toMatch(/^2026-0[1-3]-\d\d$/);
      expect((r.from as string) <= (r.to as string)).toBe(true);
    }
    const overlaps = [...lanes.values()].some((lane) => lane.some((a, i) => lane.some((b, j) => i < j && (a.from as string) <= (b.to as string) && (b.from as string) <= (a.to as string))));
    expect(overlaps).toBe(true);
  });

  test('REQ-446 · diverging bars · 6 questions × 5 levels, the neutral level in the middle', async () => {
    const module = await load('diverging-bar-chart');
    const data = module.DIVERGING_BAR_CHART_DEMO as readonly Row[];
    const keys = module.DIVERGING_BAR_CHART_DEMO_KEYS as { levels: readonly string[] };
    expect(data).toHaveLength(6);
    expect(keys.levels).toHaveLength(5);
    expect(keys.levels[2]).toBe('Neutral');
    for (const r of data) for (const level of keys.levels) expect(r[level]).toBeGreaterThanOrEqual(0);
  });

  test('REQ-446 · connected scatter · 14 yearly points whose path crosses itself', async () => {
    const data = await rows('connected-scatter-chart', 'CONNECTED_SCATTER_CHART_DEMO');
    expect(data).toHaveLength(14);
    const p = data.map((r) => [r.fare as number, r.riders as number] as const);
    const cross = (a: readonly number[], b: readonly number[], c: readonly number[], d: readonly number[]) => {
      const o = (p0: readonly number[], p1: readonly number[], p2: readonly number[]) => Math.sign(((p1[0] as number) - (p0[0] as number)) * ((p2[1] as number) - (p0[1] as number)) - ((p1[1] as number) - (p0[1] as number)) * ((p2[0] as number) - (p0[0] as number)));
      return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
    };
    let crossings = 0;
    for (let i = 0; i + 1 < p.length; i += 1) for (let j = i + 2; j + 1 < p.length; j += 1) if (cross(p[i]!, p[i + 1]!, p[j]!, p[j + 1]!)) crossings += 1;
    expect(crossings).toBeGreaterThanOrEqual(1);
  });

  test('REQ-446 · waffle · 5 categories summing to 1 000, with remainders to share out', async () => {
    const data = await rows('waffle-chart', 'WAFFLE_CHART_DEMO');
    expect(data).toHaveLength(5);
    expect(data.reduce((s, r) => s + (r.kwh as number), 0)).toBe(1000);
    expect(data.reduce((s, r) => s + Math.floor((r.kwh as number) / 10), 0)).toBeLessThan(100);
  });

  test('REQ-446 · marimekko · 4 columns × 4 segments', async () => {
    const data = await rows('marimekko-chart', 'MARIMEKKO_CHART_DEMO');
    expect(new Set(data.map((r) => r.region)).size).toBe(4);
    expect(new Set(data.map((r) => r.channel)).size).toBe(4);
    expect(data).toHaveLength(16);
  });

  test('REQ-446 · treemap, sunburst, tree · one budget: 38 nodes, 3 levels below the root, leaves at two depths', async () => {
    const data = await rows('squarified-treemap', 'SQUARIFIED_TREEMAP_DEMO');
    expect(data).toHaveLength(38);
    const parent = new Map(data.map((r) => [r.id as string, r.parent as string | null]));
    const depth = (id: string): number => (parent.get(id) === null ? 0 : 1 + depth(parent.get(id) as string));
    const leaves = data.filter((r) => !data.some((c) => c.parent === r.id));
    expect(Math.max(...data.map((r) => depth(r.id as string)))).toBe(3);
    expect(new Set(leaves.map((r) => depth(r.id as string)))).toEqual(new Set([2, 3]));
    expect(leaves.length).toBeGreaterThan(4);
    for (const leaf of leaves) expect(leaf.amount).toBeGreaterThan(0);
    for (const r of data) if (!leaves.includes(r)) expect(r.amount).toBeUndefined();
    expect(data.filter((r) => r.parent === null)).toHaveLength(1);
    expect((await load('sunburst-chart')).SUNBURST_CHART_DEMO).toBe(data);
    expect((await load('tree-chart')).TREE_CHART_DEMO).toBe(data);
  });

  test('REQ-446 · parallel coordinates · 30 rows × 5 dimensions on mixed domains', async () => {
    const module = await load('parallel-coordinates-chart');
    const data = module.PARALLEL_COORDINATES_CHART_DEMO as readonly Row[];
    const { dimensions } = module.PARALLEL_COORDINATES_CHART_DEMO_KEYS as { dimensions: readonly string[] };
    expect(data).toHaveLength(30);
    expect(dimensions).toHaveLength(5);
    const spans = dimensions.map((d) => Math.max(...data.map((r) => r[d] as number)));
    expect(Math.max(...spans) / Math.min(...spans)).toBeGreaterThan(100);
  });

  test('REQ-446 · polar line · 12 monthly values; polar scatter · 150 points wrapping 360°', async () => {
    expect(await rows('polar-line-chart', 'POLAR_LINE_CHART_DEMO')).toHaveLength(12);
    const scatter = await rows('polar-scatter-chart', 'POLAR_SCATTER_CHART_DEMO');
    expect(scatter).toHaveLength(150);
    const bearings = scatter.map((r) => r.bearing as number);
    expect(bearings.every((b) => b >= 0 && b < 360)).toBe(true);
    expect(bearings.some((b) => b < 15) && bearings.some((b) => b > 345)).toBe(true);
  });

  test('REQ-446 · density bins, contours · 1 200 points in two overlapping clusters; a 40 × 30 grid', async () => {
    const points = await rows('density-bin-chart', 'DENSITY_BIN_CHART_DEMO');
    expect(points).toHaveLength(1200);
    const contour = await load('contour-chart');
    expect(contour.CONTOUR_CHART_DEMO).toBe(points);
    const grid = contour.CONTOUR_CHART_GRID_DEMO as readonly Row[];
    expect(grid).toHaveLength(1200);
    expect(new Set(grid.map((r) => r.x)).size).toBe(40);
    expect(new Set(grid.map((r) => r.y)).size).toBe(30);
  });

  test('REQ-446 · delaunay · 60 distinct points; vector field · a 20 × 14 vortex', async () => {
    const points = await rows('delaunay-chart', 'DELAUNAY_CHART_DEMO');
    expect(points).toHaveLength(60);
    expect(new Set(points.map((r) => `${r.x},${r.y}`)).size).toBe(60);
    const field = await rows('vector-field-chart', 'VECTOR_FIELD_CHART_DEMO');
    expect(field).toHaveLength(280);
    // A vortex turns: the field at opposite points around the centre points opposite ways.
    const at = (x: number, y: number) => field.find((r) => r.x === x && r.y === y) as Row;
    expect(Math.sign(at(2, 7).v as number)).toBe(-Math.sign(at(17, 7).v as number));
  });

  test('REQ-446 · network · 40 nodes in 4 groups, 90 distinct links, no self-link', async () => {
    const module = await load('network-chart');
    const links = module.NETWORK_CHART_DEMO as readonly Row[];
    const nodes = module.NETWORK_CHART_DEMO_NODES as readonly Row[];
    expect(nodes).toHaveLength(40);
    expect(new Set(nodes.map((n) => n.group)).size).toBe(4);
    expect(links).toHaveLength(90);
    const ids = new Set(nodes.map((n) => n.id));
    const pairs = new Set(links.map((l) => [l.source, l.target].sort().join('|')));
    expect(pairs.size).toBe(90);
    for (const l of links) {
      expect(ids.has(l.source as string) && ids.has(l.target as string)).toBe(true);
      expect(l.source).not.toBe(l.target);
    }
  });
});
