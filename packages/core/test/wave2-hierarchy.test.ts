/**
 * T-181..T-183 · the hierarchy charts of wave 2 (REQ-416..REQ-418): `SquarifiedTreemap`,
 * `SunburstChart` and `TreeChart`. Each meets the second catalog's contract (support/), then its
 * own: I-25, the tree keyboard and its announcement (REQ-438), the controlled root (REQ-439),
 * identity beyond the ramp (REQ-440) and invalid rows (REQ-437).
 */
import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, readout, stepActive, type ActiveItem, type ChartModel, type HitArea, type SpCode } from '../src';
import { squarifiedTreemap } from '../src/charts/squarified-treemap/squarified-treemap';
import { sunburstChart } from '../src/charts/sunburst-chart/sunburst-chart';
import { treeChart } from '../src/charts/tree-chart/tree-chart';
import { context, heightened, R, secondCatalogContract, type Case } from './support/second-catalog-contract';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

/** A small budget read through keys other than the defaults. */
const ROWS = [
  { k: 'all', p: null, nm: 'All' },
  { k: 'a', p: 'all', nm: 'Alpha' },
  { k: 'a1', p: 'a', v: 5, nm: 'A one' },
  { k: 'a2', p: 'a', v: 3, nm: 'A two' },
  { k: 'b', p: 'all', v: 4, nm: 'Beta' },
];
const KEYS = { idKey: 'k', parentKey: 'p', labelKey: 'nm', valueKey: 'v' } as const;
const consumer = { data: ROWS, ...KEYS };
const pathOf = (datum: unknown) => (datum as { path: readonly string[] }).path.join(' › ');
const hit = (model: ChartModel, id: string) => model.geometry.hitAreas.find((h) => (h.datum as { id: string }).id === id) as HitArea;
const active = (h: HitArea): ActiveItem => ({ seriesKey: h.seriesKey, index: h.index, datum: h.datum, value: h.value, point: { x: h.x, y: h.y } });

const CASES: Case[] = [
  // A leaf with no usable value is taken as 0 (SP002) and has no area: nothing more is drawn.
  { recipe: R(squarifiedTreemap), consumer, items: 5, hostile: [{ k: 'z', p: 'all', v: Number.NaN, nm: 'Zed' }], labelOf: pathOf },
  { recipe: R(sunburstChart), consumer, items: 5, hostile: [{ k: 'z', p: 'all', v: -2, nm: 'Zed' }], labelOf: pathOf },
  // A tree draws every node, so its hostile row is one the validation drops: a repeated id (SP020).
  { recipe: R(treeChart), consumer, items: 5, hostile: [{ k: 'a1', p: 'b', v: 1 }], labelOf: pathOf, ordered: true, hostileCode: 'SP020' },
];

secondCatalogContract(CASES);

describe.each([
  ['SquarifiedTreemap', R(squarifiedTreemap)],
  ['SunburstChart', R(sunburstChart)],
  ['TreeChart', R(treeChart)],
] as const)('%s · the hierarchy (REQ-437, REQ-438)', (_name, recipe) => {
  test('REQ-438 · Home is the root; Right goes to a first child, Left back to the parent, Down in pre-order', () => {
    const model = recipe.build(consumer, context);
    const home = stepActive(model.geometry, null, 'Home') as ActiveItem;
    expect(pathOf(home.datum)).toBe('All');
    const right = stepActive(model.geometry, home, 'ArrowRight') as ActiveItem;
    expect(pathOf(right.datum)).toBe('All › Alpha');
    expect(pathOf((stepActive(model.geometry, right, 'ArrowLeft') as ActiveItem).datum)).toBe('All');
    expect(pathOf((stepActive(model.geometry, right, 'ArrowDown') as ActiveItem).datum)).toBe('All › Alpha › A one');
  });

  test('REQ-438 · the announcement names the path from the root, the value and the share of the parent', () => {
    const model = recipe.build(consumer, context);
    expect(readout(model, active(hit(model, 'a2'))).announcement).toBe('node All › Alpha › A two, v 3, 37.5% of Alpha');
    expect(readout(model, active(hit(model, 'all'))).announcement).toBe('node All, v 12');
  });

  test('REQ-437 · an orphan, a cycle and a second root render without throwing; SP020 names the first', () => {
    const seen = capture();
    const model = recipe.build({ ...consumer, data: [...ROWS, { k: 'o', p: 'nowhere', v: 2 }, { k: 'x', p: 'y', v: 1 }, { k: 'y', p: 'x', v: 1 }] }, context);
    expect(model.status).toBe('ready');
    expect(seen.filter((c) => c === 'SP020')).toHaveLength(1);
    expect(model.geometry.hitAreas.some((h) => (h.datum as { id: string }).id === 'o')).toBe(false);
  });

  test('REQ-437 · several roots get a synthetic one, named by the title', () => {
    capture();
    const model = recipe.build({ ...consumer, title: 'Budget', data: [...ROWS, { k: 'other', p: null, v: 6, nm: 'Other' }] }, context);
    expect(pathOf((stepActive(model.geometry, null, 'Home') as ActiveItem).datum)).toBe('Budget');
  });
});

describe('SquarifiedTreemap (T-181)', () => {
  test('REQ-416 · I-25 · every tile’s area is its share of the plot', () => {
    const model = squarifiedTreemap.build({}, context);
    const { plot } = model.geometry;
    const root = model.geometry.hitAreas.find((h) => h.index === 0) as HitArea;
    const tiles = model.geometry.hitAreas.filter((h) => h.node && !model.geometry.hitAreas.some((c) => c.node?.parent === h.node?.id));
    expect(tiles).toHaveLength(24);
    for (const t of tiles) {
      const box = t.box as { width: number; height: number };
      expect((box.width * box.height) / (plot.width * plot.height)).toBeCloseTo(t.value / root.value, 2);
    }
  });

  test('REQ-416 · depth: one level drawn, its nodes as tiles; the table still lists every node', () => {
    const model = squarifiedTreemap.build({ depth: 1 }, context);
    expect(new Set(model.geometry.hitAreas.map((h) => h.node?.depth))).toEqual(new Set([0, 1]));
    expect(model.table.rows).toHaveLength(38);
  });

  test('REQ-439 · rootId draws that subtree; its summary names where the frame returns', () => {
    const model = squarifiedTreemap.build({ rootId: 'works-01' }, context);
    const root = stepActive(model.geometry, null, 'Home') as ActiveItem;
    expect(pathOf(root.datum)).toBe('City budget › Public works › Roads');
    expect((root.datum as { up?: string | null }).up).toBe('works');
    expect(model.geometry.hitAreas).toHaveLength(3);
    expect((stepActive(squarifiedTreemap.build({ rootId: 'works' }, context).geometry, null, 'Home')?.datum as { up?: string | null }).up).toBeNull();
    expect('up' in (stepActive(squarifiedTreemap.build({}, context).geometry, null, 'Home')?.datum as object)).toBe(false);
  });

  test('REQ-439 · an unknown rootId draws the data root, warned SP002; a leaf as root is one heightened tile', () => {
    const seen = capture();
    expect(pathOf(stepActive(squarifiedTreemap.build({ rootId: 'nowhere' }, context).geometry, null, 'Home')?.datum)).toBe('City budget');
    expect(seen).toContain('SP002');
    const leaf = squarifiedTreemap.build({ rootId: 'admin-16' }, context);
    expect(leaf.geometry.hitAreas).toHaveLength(1);
    expect(heightened(leaf)).toHaveLength(1);
  });

  test('REQ-440 · a leaf takes its first-level ancestor’s tone; neighbouring departments differ', () => {
    const model = squarifiedTreemap.build({}, context);
    const toned = model.geometry.strokes.filter((s) => s.tone);
    const tiles = model.geometry.hitAreas.filter((h) => h.node && h.node.depth >= 1 && !model.geometry.hitAreas.some((c) => c.node?.parent === h.node?.id));
    const departmentOf = (h: HitArea) => (h.datum as { path: string[] }).path[1];
    const tones = new Map<string, Set<unknown>>();
    for (const t of tiles) {
      const b = t.box as { x: number; y: number; width: number; height: number };
      // A tile's path starts at its box's corner (both rounded the same way).
      const set = tones.get(departmentOf(t) as string) ?? new Set();
      set.add(toned.find((s) => s.d.startsWith(`M${b.x},${b.y}H`))?.tone);
      tones.set(departmentOf(t) as string, set);
    }
    for (const set of tones.values()) expect(set.size).toBe(1);
    const order = [...tones.values()].map((s) => [...s][0]);
    order.forEach((tone, i) => i > 0 && expect(tone).not.toBe(order[i - 1]));
    // Every department is named on the drawing with its share (REQ-440): a direct label.
    for (const name of ['Public works', 'Administration', 'Safety', 'Parks', 'Culture']) expect(model.geometry.labels.some((l) => l.text.startsWith(name))).toBe(true);
  });

  test('REQ-416 · every leaf at zero: the empty state, warned SP002', () => {
    const seen = capture();
    const model = squarifiedTreemap.build({ ...consumer, data: ROWS.map((r) => ('v' in r ? { ...r, v: 0 } : r)) }, context);
    expect(model.geometry.hitAreas).toEqual([]);
    expect(seen).toContain('SP002');
  });
});

describe('SunburstChart (T-182)', () => {
  test('REQ-417 · one ring per level below the centre; the legend names the first ring with shares', () => {
    const model = sunburstChart.build({ width: 420, height: 200 }, { ...context, width: 420 });
    expect(new Set(model.geometry.hitAreas.map((h) => h.node?.depth))).toEqual(new Set([0, 1, 2, 3]));
    for (const name of ['Public works', 'Administration', 'Safety', 'Parks', 'Culture']) expect(model.geometry.labels.some((l) => l.text === name)).toBe(true);
    expect(model.geometry.labels.some((l) => l.text === '28%')).toBe(true);
  });

  test('REQ-417 · depth 1: only the first ring', () => {
    expect(new Set(sunburstChart.build({ depth: 1 }, context).geometry.hitAreas.map((h) => h.node?.depth))).toEqual(new Set([0, 1]));
  });

  test('REQ-439 · rootId: the centre is that node, its summary names its parent', () => {
    const model = sunburstChart.build({ rootId: 'parks-05' }, context);
    const centre = stepActive(model.geometry, null, 'Home') as ActiveItem;
    expect(pathOf(centre.datum)).toBe('City budget › Parks › Playgrounds');
    expect((centre.datum as { up?: string | null }).up).toBe('parks');
    expect(model.geometry.hitAreas).toHaveLength(3);
  });

  test('REQ-442 · the heightened arc is the largest first-ring arc', () => {
    const model = sunburstChart.build(consumer, context);
    expect(model.description).toContain('The largest first-level arc is Alpha');
  });
});

describe('TreeChart (T-183)', () => {
  test('REQ-418 · horizontal: the root at the left, leaves at the right; vertical: the root at the top', () => {
    const across = treeChart.build({ height: 300 }, context);
    const xs = across.geometry.hitAreas.map((h) => h.x);
    expect(hit(across, 'budget').x).toBe(Math.min(...xs));
    const down = treeChart.build({ orientation: 'vertical', height: 300 }, context);
    expect(hit(down, 'budget').y).toBe(Math.min(...down.geometry.hitAreas.map((h) => h.y)));
  });

  test('REQ-418 · tidy: every parent centred over its children; one depth never crowded', () => {
    const model = treeChart.build({ height: 300 }, context);
    const hits = model.geometry.hitAreas;
    for (const h of hits) {
      const children = hits.filter((c) => c.node?.parent === h.node?.id);
      if (children.length > 0) expect(h.y).toBeCloseTo((Math.min(...children.map((c) => c.y)) + Math.max(...children.map((c) => c.y))) / 2, 1);
    }
    const byDepth = new Map<number, number[]>();
    for (const h of hits) byDepth.set(h.node?.depth as number, [...(byDepth.get(h.node?.depth as number) ?? []), h.y]);
    for (const ys of byDepth.values()) {
      const sorted = ys.sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i += 1) expect((sorted[i] as number) - (sorted[i - 1] as number)).toBeGreaterThan(0);
    }
  });

  test('REQ-418 · without a value key, a node counts its leaves', () => {
    const model = treeChart.build({ data: ROWS, idKey: 'k', parentKey: 'p', labelKey: 'nm' }, context);
    expect(model.table.columns).toEqual(['node', 'leaves']);
    expect(model.table.rows[0]).toEqual(['All', '3']);
  });

  test('REQ-442 · the root is heightened', () => {
    const model = treeChart.build(consumer, context);
    const root = hit(model, 'all');
    expect(heightened(model)[0]?.d).toContain(`M${root.x - 3.5},${root.y}`);
  });
});
