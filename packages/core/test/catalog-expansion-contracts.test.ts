/**
 * T-164 · the second catalog's props, data contracts (Data Model §2.15..§2.24) and diagnostics
 * SP020..SP022. Every reader drops, swaps or warns as its contract row says, and raises its code
 * once per render, naming the first offending row.
 */
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, diagnose, type SpCode } from '../src';
import {
  CEILINGS,
  checkBandwidth,
  checkBins,
  checkCeiling,
  checkIterations,
  checkLevels,
  checkOverlap,
  checkWhisker,
  readEstimates,
  readGrid,
  readHierarchy,
  readIntervals,
  readLikert,
  readMosaic,
  readNetwork,
  readObservations,
  readPaired,
  readPathPoints,
  readPointCloud,
  readPolarPoints,
  readRanked,
  readVectorField,
  readWideRows,
  warnTooSmall,
} from '../src/charts/shared/contracts';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): { code: SpCode; message: string }[] {
  const seen: { code: SpCode; message: string }[] = [];
  restore = __setDiagnosticSink((code, message) => seen.push({ code, message }));
  return seen;
}
const codes = (seen: { code: SpCode }[]) => seen.map((d) => d.code);

describe('T-164 · props types (REQ-450)', () => {
  test('REQ-450 · the props require what the API delta requires; the drawing vocabulary is unchanged (compiled)', () => {
    const file = fileURLToPath(new URL('./types/catalog-expansion-props.ts', import.meta.url));
    const program = ts.createProgram([file], {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
      types: ['node'],
    });
    const diagnostics = ts.getPreEmitDiagnostics(program).map((d) => {
      const where = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0;
      return `${where}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`;
    });
    expect(diagnostics).toEqual([]);
  }, 20_000);
});

describe('T-164 · diagnostics SP020..SP022', () => {
  test.each([
    ['SP020', 'REQ-437'],
    ['SP021', 'REQ-433'],
    ['SP022', 'REQ-434'],
  ] as const)('REQ-437, REQ-433, REQ-434 · %s warns with the template naming chart, property and %s', (code, req) => {
    const seen = capture();
    diagnose(code, 'SunburstChart', { property: 'data' });
    expect(seen).toHaveLength(1);
    expect(seen[0]?.message).toMatch(new RegExp(`^\\[${code}\\] SunburstChart: .+\\(\`data\`\\)\\..+\\. \\(${req}\\)$`));
  });
});

describe('T-164 · Observations (Data Model §2.15)', () => {
  test('REQ-008 · non-finite values are dropped with one SP002 naming the first', () => {
    const seen = capture();
    const data = [{ v: 1, g: 'a' }, { v: null, g: 'a' }, { v: 2, g: 'b' }, { v: Number.NaN, g: 'b' }];
    const { observations, groups } = readObservations('BoxPlotChart', data, { value: 'v', group: 'g' });
    expect(observations.map((o) => o.value)).toEqual([1, 2]);
    expect(observations.map((o) => o.index)).toEqual([0, 2]);
    expect(groups).toEqual(['a', 'b']);
    expect(codes(seen)).toEqual(['SP002']);
    expect(seen[0]?.message).toMatch(/\(`v`\)\. 2 of 4 rows .* row 1,/);
  });

  test('REQ-430 · groups are ordered by first appearance; without a group accessor there is one group', () => {
    capture();
    expect(readObservations('X', [{ v: 1, g: 'z' }, { v: 2, g: 'a' }, { v: 3, g: 'z' }], { value: 'v', group: 'g' }).groups).toEqual(['z', 'a']);
    expect(readObservations('X', [{ v: 1 }, { v: 2 }], { value: 'v' }).groups).toEqual(['']);
  });

  test('REQ-430 · a label is read for the beeswarm readout', () => {
    capture();
    expect(readObservations('BeeswarmChart', [{ v: 1, n: 'one' }], { value: 'v', label: 'n' }).observations[0]?.label).toBe('one');
  });
});

describe('T-164 · Paired (§2.16)', () => {
  test('REQ-430 · a row with a non-finite value or a repeated label is dropped (SP002 once per render)', () => {
    const seen = capture();
    const rows = readPaired('DumbbellChart', [
      { l: 'a', s: 1, e: 2 },
      { l: 'b', s: 1, e: Number.POSITIVE_INFINITY },
      { l: 'a', s: 3, e: 4 },
      { l: 'c', s: 5, e: 0 },
    ], { label: 'l', start: 's', end: 'e' });
    expect(rows.map((r) => r.label)).toEqual(['a', 'c']);
    expect(codes(seen)).toEqual(['SP002']);
  });
});

describe('T-164 · Ranked (§2.17)', () => {
  test('REQ-430 · long format: x and series by first appearance; a repeated (x, series) keeps the first', () => {
    const seen = capture();
    const { rows, xs, series } = readRanked('BumpChart', [
      { x: 2020, s: 'b', v: 1 },
      { x: 2020, s: 'a', v: 2 },
      { x: 2021, s: 'a', v: 3 },
      { x: 2021, s: 'a', v: 9 },
      { x: 2021, s: 'b', v: null },
    ], { x: 'x', series: 's', value: 'v' });
    expect(xs).toEqual([2020, 2021]);
    expect(series).toEqual(['b', 'a']);
    expect(rows.map((r) => r.value)).toEqual([1, 2, 3]);
    expect(codes(seen)).toEqual(['SP002']);
  });
});

describe('T-164 · Estimates (§2.18)', () => {
  test('REQ-430 · low > high is swapped; an estimate outside its interval is drawn and warned', () => {
    const seen = capture();
    const rows = readEstimates('ErrorBarChart', [
      { l: 'a', e: 5, lo: 8, hi: 2 },
      { l: 'b', e: 10, lo: 1, hi: 3 },
      { l: 'c', e: 1, lo: 0, hi: 2 },
    ], { label: 'l', estimate: 'e', low: 'lo', high: 'hi' });
    expect(rows[0]).toMatchObject({ low: 2, high: 8, outside: false });
    expect(rows[1]).toMatchObject({ estimate: 10, outside: true });
    expect(rows[2]).toMatchObject({ outside: false });
    expect(codes(seen)).toEqual(['SP002']);
  });
});

describe('T-164 · Intervals (§2.19)', () => {
  test('REQ-430 · dates are UTC days; start > end is swapped; an unparsable end drops the row', () => {
    const seen = capture();
    const { rows, lanes } = readIntervals('IntervalChart', [
      { lane: 'B', s: '2026-01-10', e: '2026-01-03' },
      { lane: 'A', s: '2026-01-01', e: '2026-01-01' },
      { lane: 'B', s: '2026-01-01', e: 'soon' },
    ], { lane: 'lane', start: 's', end: 'e' }, 'date');
    expect(lanes).toEqual(['B', 'A']);
    expect(rows[0]).toMatchObject({ start: 20456, end: 20463 });
    expect(rows[1]).toMatchObject({ start: 20454, end: 20454 });
    expect(rows).toHaveLength(2);
    expect(codes(seen)).toEqual(['SP002']);
  });

  test('REQ-430 · numbers on a number axis; a date string there is not a number', () => {
    const seen = capture();
    const { rows } = readIntervals('IntervalChart', [{ l: 'a', s: 1, e: 4 }, { l: 'a', s: '2026-01-01', e: 3 }], { lane: 'l', start: 's', end: 'e' }, 'number');
    expect(rows).toHaveLength(1);
    expect(codes(seen)).toEqual(['SP002']);
  });
});

describe('T-164 · Likert and WideRows (§2.20)', () => {
  test('REQ-430 · negative or missing level counts are dropped to 0 with SP002; percent normalises each row to 100', () => {
    const seen = capture();
    const rows = readLikert('DivergingBarChart', [{ q: 'Q1', no: 1, yes: 3 }, { q: 'Q2', no: -2, yes: 4 }], 'q', ['no', 'meh', 'yes'], true);
    expect(rows[0]?.values).toEqual([1, 0, 3]);
    expect(rows[0]?.shares).toEqual([25, 0, 75]);
    expect(rows[1]?.values).toEqual([0, 0, 4]);
    expect(rows[1]?.shares).toEqual([0, 0, 100]);
    expect(codes(seen)).toEqual(['SP002']);
  });

  test('REQ-430 · without percent, shares are the counts; an all-zero row has zero shares', () => {
    capture();
    const rows = readLikert('DivergingBarChart', [{ q: 'Q', a: 0, b: 0 }], 'q', ['a', 'b'], true);
    expect(rows[0]?.shares).toEqual([0, 0]);
    expect(readLikert('X', [{ q: 'Q', a: 2, b: 6 }], 'q', ['a', 'b'], false)[0]?.shares).toEqual([2, 6]);
  });

  test('REQ-430 · a wide row missing a dimension is dropped', () => {
    const seen = capture();
    const rows = readWideRows('ParallelCoordinatesChart', [{ a: 1, b: 2 }, { a: 1 }], undefined, ['a', 'b']);
    expect(rows.map((r) => r.values)).toEqual([[1, 2]]);
    expect(codes(seen)).toEqual(['SP002']);
  });
});

describe('T-164 · PathPoints and PolarPoints (§2.21)', () => {
  test('REQ-430 · path order is data order; non-finite points dropped', () => {
    const seen = capture();
    expect(readPathPoints('ConnectedScatterChart', [{ x: 2, y: 1 }, { x: 1, y: Number.NaN }, { x: 0, y: 0 }], { x: 'x', y: 'y' }).map((p) => p.x)).toEqual([2, 0]);
    expect(codes(seen)).toEqual(['SP002']);
  });

  test('REQ-430 · angles are taken modulo the period; a negative radius is dropped', () => {
    const seen = capture();
    const points = readPolarPoints('PolarScatterChart', [{ a: 370, r: 1 }, { a: -30, r: 2 }, { a: 10, r: -1 }], { angle: 'a', value: 'r' }, 360);
    expect(points.map((p) => p.angle)).toEqual([10, 330]);
    expect(codes(seen)).toEqual(['SP002']);
  });
});

describe('T-164 · Mosaic (§2.22)', () => {
  test('REQ-430 · a missing pair is 0; a negative value is dropped; columns and segments by first appearance', () => {
    const seen = capture();
    const mosaic = readMosaic('MarimekkoChart', [
      { c: 'x', s: 'p', v: 2 },
      { c: 'y', s: 'q', v: 3 },
      { c: 'x', s: 'q', v: -1 },
    ], { column: 'c', segment: 's', value: 'v' });
    expect(mosaic.columns).toEqual(['x', 'y']);
    expect(mosaic.segments).toEqual(['p', 'q']);
    expect(mosaic.values).toEqual([[2, 0], [0, 3]]);
    expect(codes(seen)).toEqual(['SP002']);
  });
});

describe('T-164 · Hierarchy (§2.23, REQ-437)', () => {
  const keys = { id: 'id', parent: 'parent', value: 'value', label: 'label' };
  const read = (data: Record<string, unknown>[]) => readHierarchy('SunburstChart', data, keys, 'All');

  test('REQ-437 · a valid tree passes untouched, with no diagnostic', () => {
    const seen = capture();
    const { rows, root } = read([
      { id: 'r', parent: null },
      { id: 'a', parent: 'r', value: 2 },
      { id: 'b', parent: 'r', value: 3 },
    ]);
    expect(root).toBe('r');
    expect(rows.map((r) => r.id)).toEqual(['r', 'a', 'b']);
    expect(seen).toEqual([]);
  });

  test('REQ-437 · a duplicate id is dropped, SP020 naming it', () => {
    const seen = capture();
    const { rows } = read([{ id: 'r', parent: null }, { id: 'a', parent: 'r', value: 1 }, { id: 'a', parent: 'r', value: 9 }]);
    expect(rows.map((r) => r.value)).toEqual([0, 1]);
    expect(codes(seen)).toEqual(['SP020']);
    expect(seen[0]?.message).toContain('"a"');
  });

  test('REQ-437 · a missing parent drops the row and its descendants', () => {
    const seen = capture();
    const { rows } = read([{ id: 'r', parent: null }, { id: 'x', parent: 'ghost' }, { id: 'y', parent: 'x', value: 1 }, { id: 'z', parent: 'r', value: 1 }]);
    expect(rows.map((r) => r.id)).toEqual(['r', 'z']);
    expect(codes(seen)).toEqual(['SP020']);
    expect(seen[0]?.message).toContain('"x"');
  });

  test('REQ-437 · a cycle is dropped, SP020 once', () => {
    const seen = capture();
    const { rows } = read([{ id: 'r', parent: null }, { id: 'p', parent: 'q', value: 1 }, { id: 'q', parent: 'p', value: 1 }, { id: 'c', parent: 'r', value: 1 }]);
    expect(rows.map((r) => r.id)).toEqual(['r', 'c']);
    expect(codes(seen)).toEqual(['SP020']);
    expect(seen[0]?.message).toContain('"p"');
  });

  test('REQ-437 · several roots get a synthetic root named by the chart, SP020', () => {
    const seen = capture();
    const { rows, root } = read([{ id: 'a', parent: null, value: 1 }, { id: 'b', parent: undefined, value: 2 }]);
    expect(root).toBe('∅');
    expect(rows[0]).toMatchObject({ id: '∅', parent: null, label: 'All' });
    expect(rows.slice(1).map((r) => [r.id, r.parent])).toEqual([['a', '∅'], ['b', '∅']]);
    expect(codes(seen)).toEqual(['SP020']);
  });

  test('REQ-437 · an internal node\'s value is ignored; a leaf with a bad value is corrected to 0 (SP002)', () => {
    const seen = capture();
    const { rows } = read([{ id: 'r', parent: null, value: 99 }, { id: 'a', parent: 'r', value: -4 }, { id: 'b', parent: 'r', value: 2 }]);
    expect(rows.map((r) => r.value)).toEqual([0, 0, 2]);
    expect(codes(seen)).toEqual(['SP002']);
  });

  test('REQ-437 · an empty id is dropped', () => {
    const seen = capture();
    expect(read([{ id: 'r', parent: null, value: 1 }, { id: '', parent: 'r', value: 1 }]).rows).toHaveLength(1);
    expect(codes(seen)).toEqual(['SP020']);
  });
});

describe('T-164 · PointCloud, GridField, VectorField, Network (§2.24)', () => {
  test('REQ-430 · a point cloud drops non-finite points', () => {
    const seen = capture();
    expect(readPointCloud('DelaunayChart', [{ x: 1, y: 1 }, { x: 'a', y: 2 }], { x: 'x', y: 'y' })).toHaveLength(1);
    expect(codes(seen)).toEqual(['SP002']);
  });

  test('REQ-430 · a grid is the sorted distinct x and y; a missing cell is a hole; a duplicate keeps the first', () => {
    const seen = capture();
    const grid = readGrid('ContourChart', [
      { x: 1, y: 0, v: 3 },
      { x: 0, y: 0, v: 1 },
      { x: 0, y: 1, v: 2 },
      { x: 0, y: 1, v: 7 },
    ], { x: 'x', y: 'y', value: 'v' });
    expect(grid.xs).toEqual([0, 1]);
    expect(grid.ys).toEqual([0, 1]);
    expect(grid.values).toEqual([1, 3, 2, undefined]);
    expect(codes(seen)).toEqual(['SP002']);
  });

  test('REQ-430 · a vector field reads u and v on the same grid', () => {
    capture();
    const field = readVectorField('VectorFieldChart', [{ x: 0, y: 0, u: 1, v: 0 }, { x: 1, y: 0, u: 0, v: 1 }], { x: 'x', y: 'y', u: 'u', v: 'v' });
    expect(field.vectors).toEqual([{ u: 1, v: 0 }, { u: 0, v: 1 }]);
  });

  test('REQ-430 · links whose end is not a node are dropped; without nodes, nodes are the distinct ends', () => {
    const seen = capture();
    const given = readNetwork('NetworkChart', [{ s: 'a', t: 'b' }, { s: 'a', t: 'z', w: 2 }], { source: 's', target: 't', value: 'w' }, [{ id: 'a' }, { id: 'b' }]);
    expect(given.links.map((l) => [l.source, l.target, l.value])).toEqual([['a', 'b', 1]]);
    expect(codes(seen)).toEqual(['SP002']);
    const derived = readNetwork('NetworkChart', [{ s: 'b', t: 'a' }, { s: 'a', t: 'a' }], { source: 's', target: 't' }, undefined);
    expect(derived.nodes.map((n) => n.id)).toEqual(['b', 'a']);
    expect(derived.links).toHaveLength(2);
  });
});

describe('T-164 · statistic parameters (REQ-433, SP021)', () => {
  test.each([
    ['bins', () => checkBins('HistogramChart', 0)],
    ['bins', () => checkBins('HistogramChart', Number.NaN)],
    ['bins', () => checkBins('HistogramChart', [0, 2, 1])],
    ['bandwidth', () => checkBandwidth('ViolinChart', -1)],
    ['bandwidth', () => checkBandwidth('ViolinChart', Number.POSITIVE_INFINITY)],
    ['whisker', () => checkWhisker('BoxPlotChart', -0.5)],
    ['overlap', () => checkOverlap('RidgelineChart', 1.5)],
    ['iterations', () => checkIterations('NetworkChart', -3)],
    ['levels', () => checkLevels('ContourChart', [3, 3])],
  ])('REQ-433 · an invalid `%s` falls back to the default with SP021', (property, check) => {
    const seen = capture();
    expect(check()).toBeUndefined();
    expect(codes(seen)).toEqual(['SP021']);
    expect(seen[0]?.message).toContain(`\`${property}\``);
  });

  test('REQ-433 · valid parameters pass through, silently; omitted ones stay omitted', () => {
    const seen = capture();
    expect(checkBins('HistogramChart', 12)).toBe(12);
    expect(checkBins('HistogramChart', [0, 1, 5])).toEqual([0, 1, 5]);
    expect(checkBins('HistogramChart', undefined)).toBeUndefined();
    expect(checkBandwidth('ViolinChart', 0.5)).toBe(0.5);
    expect(checkWhisker('BoxPlotChart', 0)).toBe(0);
    expect(checkOverlap('RidgelineChart', 0)).toBe(0);
    expect(checkIterations('NetworkChart', 0)).toBe(0);
    expect(checkLevels('ContourChart', 5)).toBe(5);
    expect(seen).toEqual([]);
  });

  test('REQ-434 · a too-small group warns SP022 naming the group', () => {
    const seen = capture();
    warnTooSmall('BoxPlotChart', 'tiny', 4, 5);
    expect(codes(seen)).toEqual(['SP022']);
    expect(seen[0]?.message).toMatch(/"tiny".*4.*5/);
  });
});

describe('T-164 · ceilings (REQ-443, SP008)', () => {
  test('REQ-443 · the API §12 ceilings', () => {
    expect(CEILINGS).toEqual({ observations: 10_000, points: 500, intervals: 200, nodes: 500, networkNodes: 150, links: 600, gridCells: 3_600 });
    expect(Object.isFrozen(CEILINGS)).toBe(true);
  });

  test('REQ-443 · above a ceiling SP008 recommends aggregation; at it, nothing', () => {
    const seen = capture();
    checkCeiling('BeeswarmChart', 'value', 'points', 500);
    expect(seen).toEqual([]);
    checkCeiling('BeeswarmChart', 'value', 'points', 501);
    expect(codes(seen)).toEqual(['SP008']);
    expect(seen[0]?.message).toMatch(/501.*500/);
  });
});
