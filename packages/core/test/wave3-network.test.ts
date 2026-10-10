/**
 * T-195 · `NetworkChart` (REQ-426, REQ-436): a node-link graph laid out deterministically, or at
 * the consumer's positions. It meets the second catalog's contract (support/), then its own.
 */
import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, stepActive, type ActiveItem, type ChartModel, type Datum, type SpCode } from '../src';
import { networkChart } from '../src/charts/network-chart/network-chart';
import { context, heightened, R, secondCatalogContract, type Case } from './support/second-catalog-contract';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

const LINKS = { data: [{ s: 'a', t: 'b', w: 2 }, { s: 'b', t: 'c' }, { s: 'a', t: 'c', w: 1 }, { s: 'c', t: 'c' }], sourceKey: 's', targetKey: 't', valueKey: 'w' };
const labelOf = (d: Datum) => ('degree' in d ? String(d.label ?? d.id) : `${String(d.source)} – ${String(d.target)}`);

const CASES: Case[] = [{ recipe: R(networkChart), consumer: LINKS, items: 7, hostile: [{ s: null, t: 'a' }], labelOf }];

secondCatalogContract(CASES);

const nodes = (model: ChartModel) => model.geometry.hitAreas.filter((h) => h.seriesKey === 'degree');
const links = (model: ChartModel) => model.geometry.hitAreas.filter((h) => h.seriesKey !== 'degree');
const key = (model: ChartModel, from: ActiveItem | null, k: string) => stepActive(model.geometry, from, k) as ActiveItem;

describe('NetworkChart (T-195)', () => {
  test('REQ-426 · the demo: 40 nodes, 90 links, its four teams toned and named in a legend', () => {
    const model = networkChart.build({}, context);
    expect(nodes(model)).toHaveLength(40);
    expect(links(model)).toHaveLength(90);
    const tones = new Set(model.geometry.strokes.filter((s) => s.role === 'encoding' && s.tone !== undefined).map((s) => s.tone));
    expect(tones.size).toBe(4);
    for (const team of ['Archive', 'Studio', 'Lab', 'Press']) expect(model.geometry.labels.map((l) => l.text)).toContain(team);
    expect(model.description).toMatch(/300 iterations/);
  });

  test('REQ-442 · the node of highest degree is heightened; ties go to the first id', () => {
    const model = networkChart.build(LINKS, context);
    // a, b and c have degrees 2, 2 and 3 (the loop counts once): c.
    expect(nodes(model).map((h) => h.value)).toEqual([2, 2, 3]);
    const c = nodes(model)[2] as { x: number; y: number };
    expect(heightened(model)[0]?.d).toMatch(new RegExp(`^M${c.x - 5.5},${c.y}A`));
  });

  test('REQ-426 · the keyboard: Right walks the nodes, Down the links a node starts, Up back to it', () => {
    const model = networkChart.build(LINKS, context);
    const a = key(model, null, 'Home');
    expect(a.seriesKey).toBe('degree');
    expect(key(model, a, 'ArrowRight').index).toBe(1);
    const first = key(model, a, 'ArrowDown');
    expect(model.table.rows[first.index]?.[0]).toBe('a – b');
    const second = key(model, first, 'ArrowDown');
    expect(model.table.rows[second.index]?.[0]).toBe('a – c');
    expect(key(model, second, 'ArrowDown')).toEqual(second);
    expect(key(model, key(model, second, 'ArrowUp'), 'ArrowUp')).toEqual(a);
  });

  test('REQ-436 · with x and y on every node it draws them there, scaled to the plot, and runs no layout', () => {
    const placed = { ...LINKS, nodes: [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 10, y: 0 }, { id: 'c', x: 10, y: 5 }] };
    const model = networkChart.build(placed, context);
    const [a, b, c] = nodes(model) as [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }];
    expect(a.y).toBe(b.y);
    expect(b.x).toBe(c.x);
    expect(c.y).toBeLessThan(b.y);
    expect(a.x).toBeLessThan(b.x);
    expect(networkChart.build({ ...placed, iterations: 5 }, context).geometry).toEqual(model.geometry);
    expect(model.description).toMatch(/given positions/);
  });

  test('REQ-426 · REQ-435 · iterations change the layout; an invalid count is the default, warned SP021', () => {
    const settled = networkChart.build(LINKS, context).geometry;
    expect(networkChart.build({ ...LINKS, iterations: 0 }, context).geometry).not.toEqual(settled);
    const seen = capture();
    expect(networkChart.build({ ...LINKS, iterations: -1 }, context).geometry).toEqual(settled);
    expect(seen).toContain('SP021');
  });

  test('REQ-426 · the seed deals the start, so it moves the layout', () => {
    expect(networkChart.build({ seed: 2 }, context).geometry).not.toEqual(networkChart.build({ seed: 3 }, context).geometry);
  });

  test('Data Model §2.24 · a link to a node not in `nodes` is dropped, warned SP002', () => {
    const seen = capture();
    const model = networkChart.build({ ...LINKS, nodes: [{ id: 'a' }, { id: 'b' }] }, context);
    expect(seen).toContain('SP002');
    expect(links(model)).toHaveLength(1);
  });

  test('REQ-443 · above 150 nodes or 600 links SP008', () => {
    const seen = capture();
    const data = Array.from({ length: 151 }, (_, k) => ({ source: `n${k}`, target: `n${(k + 1) % 151}` }));
    networkChart.build({ data, iterations: 1 }, context);
    expect(seen).toContain('SP008');
  });
});
