/**
 * T-184..T-186 · the part-to-whole, multivariate and polar charts of wave 2 (REQ-414, REQ-415,
 * REQ-419..REQ-421): `WaffleChart`, `MarimekkoChart`, `ParallelCoordinatesChart`, `PolarLineChart`
 * and `PolarScatterChart`. Each meets the second catalog's contract (support/), then its own.
 */
import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, stepActive, type ActiveItem, type ChartModel, type Datum, type SpCode } from '../src';
import { marimekkoChart } from '../src/charts/marimekko-chart/marimekko-chart';
import { parallelCoordinatesChart } from '../src/charts/parallel-coordinates-chart/parallel-coordinates-chart';
import { polarLineChart } from '../src/charts/polar-line-chart/polar-line-chart';
import { polarScatterChart } from '../src/charts/polar-scatter-chart/polar-scatter-chart';
import { waffleChart } from '../src/charts/waffle-chart/waffle-chart';
import { context, heightened, R, secondCatalogContract, type Case } from './support/second-catalog-contract';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

const field = (name: string) => (datum: Datum) => String(datum[name]);
const WAFFLE = { data: [{ n: 'A', v: 6 }, { n: 'B', v: 3 }, { n: 'C', v: 1 }], nameKey: 'n', valueKey: 'v' };
const MOSAIC = { data: [{ c: 'N', s: 'On', v: 3 }, { c: 'N', s: 'Off', v: 1 }, { c: 'S', s: 'On', v: 2 }, { c: 'S', s: 'Off', v: 2 }], columnKey: 'c', segmentKey: 's', valueKey: 'v' };
const WIDE = { data: [{ nm: 'P', a: 1, b: 10, c: 100 }, { nm: 'Q', a: 2, b: 30, c: 50 }, { nm: 'R', a: 3, b: 20, c: 75 }], labelKey: 'nm', dimensions: ['a', 'b', 'c'] };
const MONTHS = { data: [{ m: 0, r: 3 }, { m: 3, r: 5 }, { m: 6, r: 2 }, { m: 9, r: 4 }], angleKey: 'm', valueKey: 'r', period: 12 };
const BEARINGS = { data: [{ b: 10, d: 3, w: 2 }, { b: 200, d: 5, w: 8 }, { b: 90, d: 1, w: 4 }], angleKey: 'b', radiusKey: 'd', sizeKey: 'w' };

const CASES: Case[] = [
  { recipe: R(waffleChart), consumer: WAFFLE, items: 3, hostile: [{ n: 'X', v: -1 }], labelOf: field('n'), rawDatum: true, ordered: true },
  // A repeated (column, segment) pair is rejected (SP002); the mosaic draws in first-appearance order.
  { recipe: R(marimekkoChart), consumer: MOSAIC, items: 4, hostile: [{ c: 'N', s: 'On', v: 5 }], labelOf: (d) => String((d as { column: string }).column), ordered: true },
  { recipe: R(parallelCoordinatesChart), consumer: WIDE, items: 9, hostile: [{ nm: 'bad', a: 1, b: 'x', c: 2 }], labelOf: field('nm'), rawDatum: true, ordered: true },
  { recipe: R(polarLineChart), consumer: MONTHS, items: 4, hostile: [{ m: 1, r: -3 }], labelOf: field('m'), rawDatum: true },
  { recipe: R(polarScatterChart), consumer: BEARINGS, items: 3, hostile: [{ b: 'x', d: 2 }], labelOf: field('b'), rawDatum: true },
];

secondCatalogContract(CASES);

const toned = (model: ChartModel) => model.geometry.strokes.filter((s) => s.role === 'encoding' && s.tone !== undefined);

describe('WaffleChart (T-184)', () => {
  test('REQ-414 · I-26 · the cells drawn are exactly `cells`, each category one path, by largest remainder', () => {
    const model = waffleChart.build({}, context);
    const counts = toned(model).map((s) => (s.d.match(/M/g) ?? []).length);
    expect(counts).toEqual([41, 26, 16, 10, 7]);
    expect(model.table.rows.map((r) => r[2])).toEqual(['41', '26', '16', '10', '7']);
  });

  test('REQ-414 · cells and columns change the grid; an invalid one is the default, warned SP021', () => {
    const model = waffleChart.build({ ...WAFFLE, cells: 20, columns: 5 }, context);
    expect(toned(model).map((s) => (s.d.match(/M/g) ?? []).length)).toEqual([12, 6, 2]);
    const seen = capture();
    expect(toned(waffleChart.build({ ...WAFFLE, cells: 0 }, context)).reduce((n, s) => n + (s.d.match(/M/g) ?? []).length, 0)).toBe(100);
    expect(seen).toContain('SP021');
  });

  test('REQ-442 · I-4 · the largest category is heightened as one element, its own path', () => {
    const model = waffleChart.build(WAFFLE, context);
    expect(heightened(model)[0]?.d).toBe(toned(model)[0]?.d);
  });

  test('REQ-440 · every category is named with its share in the legend', () => {
    const texts = waffleChart.build(WAFFLE, context).geometry.labels.map((l) => l.text);
    for (const t of ['A', 'B', 'C', '60%', '30%', '10%']) expect(texts).toContain(t);
  });
});

describe('MarimekkoChart (T-184)', () => {
  test('REQ-415 · a column is as wide as its share of the whole, a segment as tall as its share of the column', () => {
    const { hitAreas } = marimekkoChart.build(MOSAIC, context).geometry;
    const box = (column: number, segment: string) => hitAreas.find((h) => h.index === column && h.seriesKey === segment)?.box as { width: number; height: number };
    expect(box(0, 'On').width / box(1, 'On').width).toBeCloseTo(1, 1);
    expect(box(0, 'On').height / box(0, 'Off').height).toBeCloseTo(3, 1);
    expect(box(1, 'On').height / box(1, 'Off').height).toBeCloseTo(1, 1);
  });

  test('REQ-415 · the keyboard walks column × segment; the largest cell is heightened', () => {
    const model = marimekkoChart.build(MOSAIC, context);
    const first = stepActive(model.geometry, null, 'Home') as ActiveItem;
    expect([first.index, first.seriesKey]).toEqual([0, 'On']);
    const right = stepActive(model.geometry, first, 'ArrowRight') as ActiveItem;
    expect([right.index, right.seriesKey]).toEqual([1, 'On']);
    expect(model.description).toContain('2 columns by 2 segments');
  });
});

describe('ParallelCoordinatesChart (T-185)', () => {
  test('REQ-419 · REQ-097 · each axis spans its data unless `domains` gives it; the description says which', () => {
    const derived = parallelCoordinatesChart.build(WIDE, context);
    expect(derived.description).toContain('every axis spans its data');
    const given = parallelCoordinatesChart.build({ ...WIDE, domains: { a: [0, 10], b: [0, 100], c: [0, 200] } }, context);
    expect(given.description).toContain('every axis spans its given domain');
    expect(given.geometry.labels.some((l) => l.text === '200')).toBe(true);
  });

  test('REQ-097 · a value outside its given domain is drawn at the axis end, warned SP002', () => {
    const seen = capture();
    const model = parallelCoordinatesChart.build({ ...WIDE, domains: { a: [0, 2] } }, context);
    expect(seen).toContain('SP002');
    const top = Math.min(...model.geometry.hitAreas.filter((h) => h.seriesKey === 'a').map((h) => h.y));
    expect(top).toBe(model.geometry.plot.y);
  });

  test('REQ-419 · fewer than two dimensions: the empty state, warned SP002', () => {
    const seen = capture();
    expect(parallelCoordinatesChart.build({ ...WIDE, dimensions: ['a'] }, context).geometry.hitAreas).toEqual([]);
    expect(seen).toContain('SP002');
  });

  test('REQ-442 · the first row is heightened where it meets the first axis, and drawn heavier', () => {
    const model = parallelCoordinatesChart.build(WIDE, context);
    const start = model.geometry.hitAreas.find((h) => h.index === 0 && h.seriesKey === 'a');
    expect(heightened(model)[0]?.d).toContain(`M${(start?.x ?? 0) - 3.5},${start?.y}`);
    expect(model.geometry.strokes.filter((s) => s.weight === 2)).toHaveLength(1);
  });
});

describe('PolarLineChart (T-186)', () => {
  test('REQ-420 · with a period the line closes; without one it does not', () => {
    const line = (m: ChartModel) => m.geometry.strokes.find((s) => s.role === 'encoding' && s.d.includes('L')) as { d: string };
    expect(line(polarLineChart.build(MONTHS, context)).d.endsWith('Z')).toBe(true);
    const { period: _period, ...open } = MONTHS;
    expect(line(polarLineChart.build(open, context)).d.endsWith('Z')).toBe(false);
  });

  test('REQ-420 · angle 0 is at 12 o’clock and wraps at the period; startAngle turns the circle', () => {
    const at = (props: Record<string, unknown>) => polarLineChart.build({ ...MONTHS, ...props }, context).geometry.hitAreas.find((h) => h.index === 0) as { x: number; y: number };
    const zero = at({});
    const { plot } = polarLineChart.build(MONTHS, context).geometry;
    expect(zero.x).toBeCloseTo(plot.x + plot.width / 2, 1);
    const wrapped = at({ data: [{ m: 12, r: 3 }, ...MONTHS.data.slice(1)] });
    expect([wrapped.x, wrapped.y]).toEqual([zero.x, zero.y]);
    expect(at({ startAngle: 90 }).y).not.toBe(zero.y);
  });

  test('REQ-442 · the maximum is heightened', () => {
    const model = polarLineChart.build(MONTHS, context);
    const top = model.geometry.hitAreas.find((h) => h.value === 5) as { x: number; y: number };
    expect(heightened(model)[0]?.d).toContain(`M${top.x - 3.5},${top.y}`);
  });
});

describe('PolarScatterChart (T-186)', () => {
  test('REQ-421 · angles wrap at 360; with a size key, a point’s area is its size', () => {
    const model = polarScatterChart.build(BEARINGS, context);
    const wrapped = polarScatterChart.build({ ...BEARINGS, data: [{ b: 370, d: 3, w: 2 }, ...BEARINGS.data.slice(1)] }, context);
    const first = (m: ChartModel) => m.geometry.hitAreas.find((h) => h.index === 0);
    expect(first(wrapped)?.x).toBe(first(model)?.x);
    const radius = (i: number) => (model.geometry.hitAreas.find((h) => h.index === i)?.box?.width ?? 0) / 2;
    expect((radius(1) / radius(0)) ** 2).toBeCloseTo(8 / 2, 0);
  });

  test('REQ-421 · the keyboard walks the points in angle order; the farthest is heightened', () => {
    const model = polarScatterChart.build(BEARINGS, context);
    const home = stepActive(model.geometry, null, 'Home') as ActiveItem;
    expect(home.index).toBe(0);
    expect((stepActive(model.geometry, home, 'ArrowRight') as ActiveItem).index).toBe(2);
    expect(model.description).toContain('the farthest at 5');
  });
});
