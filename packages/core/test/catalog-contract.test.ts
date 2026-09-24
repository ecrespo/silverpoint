import { afterEach, describe, expect, test } from 'vitest';
import {
  __setDiagnosticSink,
  activityGrid,
  areaChart,
  barChart,
  bubbleChart,
  bulletChart,
  candlestickChart,
  chordRing,
  composedChart,
  coxcombChart,
  donutChart,
  funnelChart,
  gaugeArc,
  heatmapChart,
  kpiCard,
  meterChart,
  orbitChart,
  polarBarChart,
  pyramidChart,
  radarChart,
  radialArcGroup,
  radialRings,
  rangeBandChart,
  readout,
  sankeyChart,
  scatterChart,
  serializeGeometry,
  sparklineRows,
  stackedBarChart,
  stepActive,
  stepChart,
  streamChart,
  treemapChart,
  waterfallChart,
  windRose,
  type ChartRecipe,
  type CommonChartProps,
  type Datum,
  type RecipeContext,
  type SpCode,
} from '../src';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

const context: RecipeContext = {
  id: 'sp-contract',
  width: 320,
  locale: 'en',
  emptyState: { text: 'No data', rule: true },
  domainPadding: 0.1,
};

const days = (from: number, n: number) =>
  Array.from({ length: n }, (_, i) => ({ day: `2026-06-${String(from + i).padStart(2, '0')}`, c: i, l: i % 5 }));

interface Case {
  readonly recipe: ChartRecipe<CommonChartProps>;
  readonly consumer: CommonChartProps & Record<string, unknown>;
  /** Items the consumer data draws: one hit area each. */
  readonly items: number;
  /** Rows no chart can draw as given: NaN, Infinity, wrong types, out of range. */
  readonly hostile: readonly Datum[];
  /** The label an item's readout must name, read from its own datum. */
  readonly labelOf: (datum: Datum, index: number) => string;
}

const CASES: readonly Case[] = [
  {
    recipe: bulletChart as ChartRecipe<CommonChartProps>,
    consumer: { data: [{ goal: 'Revenue', done: 72, aim: 80 }, { goal: 'Profit', done: 45, aim: 60 }], titleKey: 'goal', actualKey: 'done', targetKey: 'aim' },
    items: 2,
    hostile: [{ goal: 'NotNum', done: Number.NaN, aim: 50 }, { goal: 'Endless', done: 'x', aim: Number.POSITIVE_INFINITY }, { goal: 'Neg', done: -5, aim: 200 }],
    labelOf: (d) => String(d.goal),
  },
  {
    recipe: pyramidChart as ChartRecipe<CommonChartProps>,
    consumer: { data: [{ tier: 'Gold', pct: 20 }, { tier: 'Silver', pct: 55 }, { tier: 'Bronze', pct: 90 }], labelKey: 'tier', widthKey: 'pct' },
    items: 3,
    hostile: [{ tier: 'NotNum', pct: Number.NaN }, { tier: 'Neg', pct: -10 }, { tier: 'Str', pct: 'x' }],
    labelOf: (d) => String(d.tier),
  },
  {
    recipe: heatmapChart as ChartRecipe<CommonChartProps>,
    consumer: { data: [{ row: 'Mon', vals: [10, 50, 90] }, { row: 'Tue', vals: [0, 30, 100] }], labelKey: 'row', valuesKey: 'vals' },
    items: 6,
    hostile: [{ row: 'Bad', vals: [Number.NaN, Number.POSITIVE_INFINITY, 'x'] }, { row: 'None', vals: 'nope' }],
    labelOf: (d) => String(d.row),
  },
  {
    recipe: treemapChart as ChartRecipe<CommonChartProps>,
    consumer: {
      data: [{ name: 'A', pc: 40, cols: 3, rows: 2 }, { name: 'B', pc: 35, cols: 3, rows: 2 }, { name: 'C', pc: 25, cols: 2, rows: 2 }],
      labelKey: 'name',
      shareKey: 'pc',
      columns: 6,
      rows: 4,
    },
    items: 3,
    hostile: [{ name: 'Zero', pc: Number.NaN, cols: 0, rows: 1 }, { name: 'Frac', pc: 'x', cols: 2.5, rows: 1 }, { name: 'Huge', pc: -3, cols: 2, rows: 9 }],
    labelOf: (d) => String(d.name),
  },
  {
    recipe: sankeyChart as ChartRecipe<CommonChartProps>,
    consumer: {
      data: [{ from: 'Web', to: 'Signup', n: 60 }, { from: 'Ads', to: 'Signup', n: 40 }, { from: 'Signup', to: 'Paid', n: 30 }],
      sourceKey: 'from',
      targetKey: 'to',
      valueKey: 'n',
    },
    items: 3,
    hostile: [{ from: 'Loop', to: 'Loop', n: 5 }, { from: 'Web', to: 'Paid', n: Number.NaN }, { to: 'Paid', n: 3 }, { from: 'Ads', to: 'Web', n: -1 }],
    labelOf: (d) => `${String(d.from)} → ${String(d.to)}`,
  },
  {
    recipe: activityGrid as ChartRecipe<CommonChartProps>,
    consumer: { data: days(17, 14) as Datum[], dateKey: 'day', countKey: 'c', levelKey: 'l', weeks: 2 },
    items: 14,
    hostile: [{ day: '2026-13-01', c: Number.NaN, l: 9 }, { day: 'x', c: 1, l: 1 }, { day: '2026-02-31', c: 'y', l: -1 }],
    labelOf: (d) => String(d.day),
  },
];


const P2 = (recipe: unknown) => recipe as ChartRecipe<CommonChartProps>;

/** Phase 2: the cartesian charts. */
const CARTESIAN: readonly Case[] = [
  {
    recipe: P2(stepChart),
    consumer: { data: [{ d: 'a', v: 1 }, { d: 'b', v: 3 }, { d: 'c', v: 2 }], xKey: 'd', valueKey: 'v' },
    items: 3,
    hostile: [{ d: 'h1', v: Number.NaN }, { d: 'h2', v: 'x' }],
    labelOf: (d) => String(d.d),
  },
  {
    recipe: P2(sparklineRows),
    consumer: { data: [{ n: 'CPU', r: '42%', pts: [1, 3, 2] }, { n: 'RAM', pts: [{ value: 5 }, { value: 4 }] }], nameKey: 'n', readoutKey: 'r', seriesKey: 'pts' },
    items: 2,
    hostile: [{ n: 'Bad', pts: 'nope' }, { n: 'Nans', pts: [Number.NaN, 'x'] }],
    labelOf: (d) => String(d.n),
  },
  {
    recipe: P2(kpiCard),
    consumer: { data: [{ v: 5 }, { v: 7 }, { v: 6 }], valueKey: 'v', metric: 'Orders', delta: 12 },
    items: 3,
    hostile: [{ v: Number.NaN }, { v: 'x' }],
    labelOf: (_d, i) => String(i + 1),
  },
  {
    recipe: P2(barChart),
    consumer: { data: [{ c: 'a', v: 3, w: 1 }, { c: 'b', v: -2, w: 2 }], xKey: 'c', valueKey: 'v', secondaryKey: 'w' },
    items: 4,
    hostile: [{ c: 'h1', v: Number.NaN, w: 'x' }],
    labelOf: (d) => String(d.c),
  },
  {
    recipe: P2(stackedBarChart),
    consumer: { data: [{ c: 'a', p: 1, q: 2 }, { c: 'b', p: 3, q: 1 }], xKey: 'c', keys: ['p', 'q'], names: ['P', 'Q'] },
    items: 4,
    hostile: [{ c: 'h1', p: Number.NaN, q: -4 }],
    labelOf: (d) => String(d.c),
  },
  {
    recipe: P2(composedChart),
    consumer: { data: [{ c: 'a', b: 3, l: 2 }, { c: 'b', b: 5, l: 4 }], xKey: 'c', barKey: 'b', lineKey: 'l' },
    items: 4,
    hostile: [{ c: 'h1', b: Number.NaN, l: Number.POSITIVE_INFINITY }],
    labelOf: (d) => String(d.c),
  },
  {
    recipe: P2(waterfallChart),
    consumer: { data: [{ s: 'Start', base: 10 }, { s: 'Up', d: 5 }, { s: 'Down', d: -3 }, { s: 'End', base: 12 }], stepKey: 's', baseKey: 'base', deltaKey: 'd' },
    items: 4,
    hostile: [{ s: 'h1', d: Number.NaN }, { s: 'h2', base: 'x' }],
    labelOf: (d) => String(d.s),
  },
  {
    recipe: P2(funnelChart),
    consumer: { data: [{ st: 'Visit', n: 100 }, { st: 'Cart', n: 40 }, { st: 'Buy', n: 10 }], stageKey: 'st', valueKey: 'n' },
    items: 3,
    hostile: [{ st: 'h1', n: Number.NaN }, { st: 'h2', n: -5 }],
    labelOf: (d) => String(d.st),
  },
  {
    recipe: P2(candlestickChart),
    consumer: {
      data: [{ t: 'd1', o: 10, h: 12, l: 9, c: 11 }, { t: 'd2', o: 11, h: 11.5, l: 8, c: 9 }],
      timeKey: 't', openKey: 'o', highKey: 'h', lowKey: 'l', closeKey: 'c',
    },
    items: 2,
    hostile: [{ t: 'h1', o: 10, h: 5, l: 9, c: 11 }, { t: 'h2', o: Number.NaN, h: 1, l: 0, c: 1 }],
    labelOf: (d) => String(d.t),
  },
  {
    recipe: P2(areaChart),
    consumer: { data: [{ d: 'a', v: 1 }, { d: 'b', v: 4 }, { d: 'c', v: 2 }], xKey: 'd', valueKey: 'v' },
    items: 3,
    hostile: [{ d: 'h1', v: Number.NaN }],
    labelOf: (d) => String(d.d),
  },
  {
    recipe: P2(rangeBandChart),
    consumer: { data: [{ d: 'a', lo: 1, hi: 3 }, { d: 'b', lo: 2, hi: 5 }], xKey: 'd', lowKey: 'lo', highKey: 'hi' },
    items: 4,
    hostile: [{ d: 'h1', lo: Number.NaN, hi: 2 }],
    labelOf: (d) => String(d.d),
  },
  {
    recipe: P2(streamChart),
    consumer: { data: [{ d: 'a', p: 1, q: 2 }, { d: 'b', p: 3, q: 1 }, { d: 'c', p: 2, q: 2 }], xKey: 'd', keys: ['p', 'q'] },
    items: 6,
    hostile: [{ d: 'h1', p: Number.NaN, q: 'x' }],
    labelOf: (d) => String(d.d),
  },
  {
    recipe: P2(scatterChart),
    consumer: { data: [{ a: 1, b: 2, s: 5 }, { a: 2, b: 4, s: 1 }, { a: 3, b: 1, s: 3 }], xKey: 'a', yKey: 'b', sizeKey: 's' },
    items: 3,
    hostile: [{ a: Number.NaN, b: 1 }, { a: 'x', b: 2 }, { a: 4, b: Number.POSITIVE_INFINITY }],
    labelOf: (d) => String(d.a),
  },
  {
    recipe: P2(bubbleChart),
    consumer: { data: [{ a: 1, b: 2, s: 5 }, { a: 2, b: 4, s: 1 }, { a: 3, b: 1, s: 3 }], xKey: 'a', yKey: 'b', sizeKey: 's' },
    items: 3,
    hostile: [{ a: 1, b: 1, s: -5 }, { a: 2, b: 2, s: Number.NaN }],
    labelOf: (d) => String(d.a),
  },
];

/** Phase 3: the polar charts, on the arc engine and on geometry of their own. */
const POLAR: readonly Case[] = [
  {
    recipe: P2(donutChart),
    consumer: { data: [{ n: 'Rent', v: 40 }, { n: 'Food', v: 25 }, { n: 'Fun', v: 10 }], nameKey: 'n', valueKey: 'v' },
    items: 3,
    hostile: [{ n: 'h1', v: Number.NaN }, { n: 'h2', v: -4 }, { n: 'h3', v: 'x' }],
    labelOf: (d) => String(d.n),
  },
  {
    recipe: P2(radarChart),
    consumer: { data: [{ n: 'Speed', v: 7 }, { n: 'Range', v: 4 }, { n: 'Cost', v: 9 }, { n: 'Comfort', v: 5 }], subjectKey: 'n', valueKey: 'v', domain: [0, 10] },
    items: 4,
    hostile: [{ n: 'h1', v: Number.NaN }, { n: 'h2', v: -4 }],
    labelOf: (d) => String(d.n),
  },
  {
    recipe: P2(polarBarChart),
    consumer: { data: [{ n: 'Jan', v: 40 }, { n: 'Feb', v: 25 }, { n: 'Mar', v: 10 }, { n: 'Apr', v: 30 }], nameKey: 'n', valueKey: 'v' },
    items: 4,
    hostile: [{ n: 'h1', v: Number.NaN }, { n: 'h2', v: -4 }],
    labelOf: (d) => String(d.n),
  },
  {
    recipe: P2(coxcombChart),
    consumer: { data: [{ n: 'Jan', v: 40 }, { n: 'Feb', v: 25 }, { n: 'Mar', v: 10 }], nameKey: 'n', valueKey: 'v' },
    items: 3,
    hostile: [{ n: 'h1', v: Number.NaN }, { n: 'h2', v: -4 }],
    labelOf: (d) => String(d.n),
  },
  {
    recipe: P2(radialArcGroup),
    consumer: { data: [{ n: 'Sales', v: 80 }, { n: 'Leads', v: 55 }, { n: 'Churn', v: 20 }], nameKey: 'n', valueKey: 'v' },
    items: 3,
    hostile: [{ n: 'h1', v: Number.NaN }, { n: 'h2', v: -4 }],
    labelOf: (d) => String(d.n),
  },
  {
    recipe: P2(radialRings),
    consumer: { data: [{ n: 'Move', v: 80 }, { n: 'Exercise', v: 55 }, { n: 'Stand', v: 100 }], nameKey: 'n', valueKey: 'v' },
    items: 3,
    hostile: [{ n: 'h1', v: Number.NaN }, { n: 'h2', v: -4 }],
    labelOf: (d) => String(d.n),
  },
  {
    recipe: P2(windRose),
    consumer: {
      data: [{ b: 0, s: 5 }, { b: 90, s: 12 }, { b: 180, s: 3 }, { b: 270, s: 25 }, { b: 0, s: 0 }],
      bearingKey: 'b',
      valueKey: 's',
      sectors: 4,
    },
    items: 4,
    hostile: [{ b: Number.NaN, s: 5 }, { b: 10, s: -3 }, { b: 'x', s: 1 }],
    labelOf: (d) => String(d.direction),
  },
  {
    recipe: P2(chordRing),
    consumer: { data: [{ a: 'Web', b: 'App', n: 30 }, { a: 'App', b: 'Web', n: 10 }, { a: 'Web', b: 'Mail', n: 20 }, { a: 'Mail', b: 'App', n: 5 }], sourceKey: 'a', targetKey: 'b', valueKey: 'n' },
    items: 4,
    hostile: [{ a: 'Web', b: 'App', n: Number.NaN }, { a: 'Web', b: 'App', n: -3 }, { a: 'Web', n: 4 }],
    labelOf: (d) => String(d.a),
  },
  {
    recipe: P2(orbitChart),
    consumer: {
      data: [
        { label: 'Inner', ms: [{ p: 0, value: 4 }, { p: 0.5, value: 2 }] },
        { label: 'Outer', ms: [{ p: 0.25, value: 3 }] },
      ],
      markerKey: 'ms',
      periodKey: 'p',
    },
    items: 3,
    hostile: [{ label: 'Bad', ms: [{ p: 1.5, value: 1 }, { p: Number.NaN, value: 1 }, { p: 0.2, value: -1 }] }],
    labelOf: (d) => String(d.orbit),
  },
];

/** The sector recipes, whose ceiling is 60 sectors (API Spec §12). */
const SECTOR_CHARTS: readonly Case[] = POLAR.filter((c) => ['DonutChart', 'RadarChart', 'PolarBarChart', 'CoxcombChart', 'RadialArcGroup', 'RadialRings'].includes(c.recipe.name));

const items = (hits: readonly { seriesKey: string; index: number }[]) => new Set(hits.map((h) => `${h.seriesKey}#${h.index}`)).size;

describe.each([...CASES, ...CARTESIAN, ...POLAR].map((c) => [c.recipe.name, c] as const))('%s contract', (_name, { recipe, consumer, items: count, hostile, labelOf }) => {
  test('REQ-093 · invoked without data it renders its demo dataset', () => {
    const model = recipe.build({}, context);
    expect(model.status).toBe('ready');
    expect(model.geometry.hitAreas.length).toBeGreaterThan(0);
  });

  test('REQ-093 · consumer data is read through the accessor keys', () => {
    const model = recipe.build(consumer, context);
    expect(model.status).toBe('ready');
    expect(items(model.geometry.hitAreas)).toBe(count);
  });

  test('REQ-121 · every item maps to a cell of the tabular alternative', () => {
    const model = recipe.build(consumer, context);
    expect(model.table.caption).toBe(model.name);
    for (const hit of model.geometry.hitAreas) {
      expect(model.table.rows[hit.index], `${hit.seriesKey}#${hit.index}`).toBeDefined();
      expect(model.table.columns).toContain(hit.seriesKey);
    }
  });

  test('REQ-140 · every item can be reached by the pointer: its point and box lie in the plot', () => {
    const { plot, hitAreas } = recipe.build(consumer, context).geometry;
    const inside = (x: number, y: number) => x >= plot.x - 0.01 && x <= plot.x + plot.width + 0.01 && y >= plot.y - 0.01 && y <= plot.y + plot.height + 0.01;
    for (const hit of hitAreas) {
      expect(inside(hit.x, hit.y), `${hit.seriesKey}#${hit.index}`).toBe(true);
      if (hit.box) expect(inside(hit.box.x, hit.box.y) && inside(hit.box.x + hit.box.width, hit.box.y + hit.box.height)).toBe(true);
    }
  });

  test('REQ-122 · the arrow keys reach every item, starting from Home', () => {
    const { geometry } = recipe.build(consumer, context);
    const key = (a: { seriesKey: string; index: number }) => `${a.seriesKey}#${a.index}`;
    const start = stepActive(geometry, null, 'Home');
    const seen = new Map(start ? [[key(start), start]] : []);
    const queue = start ? [start] : [];
    while (queue.length > 0) {
      const at = queue.shift()!;
      for (const k of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'End']) {
        const next = stepActive(geometry, at, k);
        if (next && !seen.has(key(next))) {
          seen.set(key(next), next);
          queue.push(next);
        }
      }
    }
    expect(seen.size).toBe(items(geometry.hitAreas));
  });

  test('REQ-094 · title, badge, value, unit and footers are drawn in the card', () => {
    const labels = recipe.build({ ...consumer, title: 'T', badge: 'B', value: 7, unit: 'u', footerLeft: 'L', footerRight: 'R' }, context).geometry.labels;
    for (const kind of ['title', 'badge', 'value', 'unit', 'footer']) expect(labels.some((l) => l.kind === kind), kind).toBe(true);
  });

  test("REQ-095 · chrome: 'bare' emits the drawing area and nothing else", () => {
    const { geometry } = recipe.build({ ...consumer, chrome: 'bare', title: 'Hidden', height: 150 }, context);
    expect(geometry.labels.some((l) => l.kind === 'title')).toBe(false);
    expect(geometry.viewBox.height).toBe(150);
  });

  test('REQ-007 · an empty dataset draws the empty state, no items, and warns SP001', () => {
    const seen = capture();
    const model = recipe.build({ ...consumer, data: [] }, context);
    expect(model.status).toBe('ready');
    expect(model.geometry.hitAreas).toEqual([]);
    expect(model.geometry.labels.some((l) => l.kind === 'empty')).toBe(true);
    expect(seen).toContain('SP001');
  });

  test('REQ-009 · a zero-width container defers the render', () => {
    capture();
    expect(recipe.build(consumer, { ...context, width: 0 }).status).toBe('deferred');
  });

  test('REQ-120 · the model carries an accessible name and a description of the data', () => {
    const model = recipe.build({ ...consumer, title: 'Named' }, context);
    expect(model.name).toBe('Named');
    expect(model.description.length).toBeGreaterThan(model.name.length + 10);
  });

  test('REQ-022 · data strokes are encoding; at least one is drawn', () => {
    const { strokes } = recipe.build(consumer, context).geometry;
    expect(strokes.some((s) => s.role === 'encoding')).toBe(true);
    expect(strokes.every((s) => s.role === 'encoding' || s.role === 'ornament')).toBe(true);
  });

  test('REQ-008 · REQ-011 · hostile rows among good ones: no NaN, no negative size, a warning, and the good items drawn', () => {
    const seen = capture();
    const data = consumer.data as Datum[];
    const mixed = [...data.slice(0, 1), ...hostile, ...data.slice(1)];
    const model = recipe.build({ ...consumer, data: mixed }, context);
    const text = serializeGeometry(model.geometry) + model.description + JSON.stringify(model.table);
    expect(text).not.toMatch(/NaN|Infinity/);
    for (const hit of model.geometry.hitAreas) {
      if (hit.box) expect(hit.box.width >= 0 && hit.box.height >= 0, `${hit.seriesKey}#${hit.index}`).toBe(true);
    }
    expect(seen).toContain('SP002');
    expect(items(model.geometry.hitAreas)).toBeGreaterThanOrEqual(1);
  });

  test('REQ-121 · REQ-141 · with a row dropped mid-list, every readout still names its own item', () => {
    capture();
    const data = consumer.data as Datum[];
    const model = recipe.build({ ...consumer, data: [...data.slice(0, 1), ...hostile, ...data.slice(1)] }, context);
    for (const hit of model.geometry.hitAreas) {
      const active = { seriesKey: hit.seriesKey, index: hit.index, datum: hit.datum, value: hit.value, point: { x: hit.x, y: hit.y } };
      expect(readout(model, active).heading, `${hit.seriesKey}#${hit.index}`).toBe(labelOf(hit.datum, hit.index));
    }
  });

  test('REQ-002 · REQ-005 · REQ-011 · the geometry is serialisable, rounded and deterministic', () => {
    const a = serializeGeometry(recipe.build(consumer, context).geometry);
    expect(a).toBe(serializeGeometry(recipe.build(consumer, context).geometry));
    expect(a).not.toMatch(/\d\.\d{3}/);
    expect(a).not.toMatch(/NaN|Infinity/);
  });
});

describe.each(CARTESIAN.map((c) => [c.recipe.name, c] as const))('%s data volume', (_name, { recipe, consumer }) => {
  // A sparkline row's points are its series; every other chart's rows are its points.
  const oversize = (count: number): Datum[] => {
    const first = (consumer.data as Datum[])[0] ?? {};
    if (recipe.name === 'SparklineRows') return [{ ...first, pts: Array.from({ length: count }, (_, i) => i % 7) }];
    return Array.from({ length: count }, (_, i) => ({ ...first, ...(typeof first.a === 'number' ? { a: i } : {}) }));
  };

  test('REQ-096 · 501 points warn SP008; 500 do not', () => {
    const over = capture();
    recipe.build({ ...consumer, data: oversize(501) }, context);
    expect(over).toContain('SP008');
    const under = capture();
    recipe.build({ ...consumer, data: oversize(500) }, context);
    expect(under).not.toContain('SP008');
  });
});

describe.each(SECTOR_CHARTS.map((c) => [c.recipe.name, c] as const))('%s sector volume', (_name, { recipe, consumer }) => {
  const oversize = (count: number): Datum[] => {
    const first = (consumer.data as Datum[])[0] ?? {};
    return Array.from({ length: count }, (_, i) => ({ ...first, n: `s${i}` }));
  };

  test('REQ-096 · 61 sectors warn SP008; 60 do not', () => {
    const over = capture();
    recipe.build({ ...consumer, data: oversize(61) }, context);
    expect(over).toContain('SP008');
    const under = capture();
    recipe.build({ ...consumer, data: oversize(60) }, context);
    expect(under).not.toContain('SP008');
  });
});

/** The meters (Data Model §2.3): one scalar percent, no rows. */
const SCALAR = [P2(gaugeArc), P2(meterChart)];

describe.each(SCALAR.map((r) => [r.name, r] as const))('%s contract', (_name, recipe) => {
  test('REQ-093 · invoked without a percent it renders its demo value', () => {
    const model = recipe.build({}, context);
    expect(model.status).toBe('ready');
    expect(model.geometry.hitAreas).toHaveLength(1);
  });

  test('REQ-080 · REQ-081 · the percent is read, printed, and is the one item', () => {
    const model = recipe.build({ percent: 37 }, context);
    expect(model.geometry.hitAreas.map((h) => h.value)).toEqual([37]);
    expect(model.geometry.labels.map((l) => l.text)).toContain('37%');
    expect(model.table.rows).toEqual([['value', '37%']]);
  });

  test('REQ-008 · outside 0-100 it saturates at the end and warns SP002', () => {
    const seen = capture();
    expect(recipe.build({ percent: 140 }, context).geometry.hitAreas[0]?.value).toBe(100);
    expect(recipe.build({ percent: -5 }, context).geometry.hitAreas[0]?.value).toBe(0);
    expect(seen.filter((c) => c === 'SP002')).toHaveLength(2);
  });

  test('REQ-008 · a non-finite percent draws the empty track, no item, and warns SP002', () => {
    const seen = capture();
    const model = recipe.build({ percent: Number.NaN }, context);
    expect(model.geometry.hitAreas).toEqual([]);
    expect(seen).toContain('SP002');
    expect(serializeGeometry(model.geometry)).not.toMatch(/NaN/);
  });

  test('REQ-080 · REQ-081 · `readout` replaces the printed percent and `caption` names it', () => {
    const model = recipe.build({ percent: 37, readout: '3.7 of 10', caption: 'Score' }, context);
    const texts = model.geometry.labels.map((l) => l.text);
    expect(texts).toEqual(expect.arrayContaining(['3.7 of 10', 'Score']));
    expect(model.table.rows).toEqual([['Score', '3.7 of 10']]);
  });

  test('REQ-122 · the keyboard reaches the one item', () => {
    expect(stepActive(recipe.build({ percent: 37 }, context).geometry, null, 'Home')?.value).toBe(37);
  });

  test('REQ-094 · REQ-095 · card chrome and bare chrome', () => {
    const card = recipe.build({ percent: 37, title: 'T', footerLeft: 'L' }, context).geometry.labels;
    expect(card.some((l) => l.kind === 'title') && card.some((l) => l.kind === 'footer')).toBe(true);
    const bare = recipe.build({ percent: 37, chrome: 'bare', title: 'T', height: 150 }, context).geometry;
    expect(bare.labels.some((l) => l.kind === 'title')).toBe(false);
    expect(bare.viewBox.height).toBe(150);
  });

  test('REQ-009 · REQ-120 · deferred at zero width; named and described', () => {
    capture();
    expect(recipe.build({ percent: 37 }, { ...context, width: 0 }).status).toBe('deferred');
    const model = recipe.build({ percent: 37, title: 'Named' }, context);
    expect(model.name).toBe('Named');
    expect(model.description).toContain('37%');
  });

  test('REQ-002 · REQ-005 · REQ-022 · encoding drawn; rounded and deterministic', () => {
    const a = serializeGeometry(recipe.build({ percent: 37 }, context).geometry);
    expect(a).toBe(serializeGeometry(recipe.build({ percent: 37 }, context).geometry));
    expect(a).not.toMatch(/\d\.\d{3}/);
    expect(recipe.build({ percent: 37 }, context).geometry.strokes.some((s) => s.role === 'encoding')).toBe(true);
  });
});

describe('demo snapshots', () => {
  test.each([...[...CASES, ...CARTESIAN, ...POLAR].map((c) => c.recipe), ...SCALAR].map((r) => [r.name, r] as const))('REQ-093 · REQ-005 · %s demo geometry is stable', (_name, recipe) => {
    expect(serializeGeometry(recipe.build({ width: 320, height: 150 }, { ...context, id: 'sp-demo' }).geometry)).toMatchSnapshot();
  });
});
