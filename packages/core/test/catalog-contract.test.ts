import { afterEach, describe, expect, test } from 'vitest';
import {
  __setDiagnosticSink,
  activityGrid,
  bulletChart,
  heatmapChart,
  pyramidChart,
  readout,
  sankeyChart,
  serializeGeometry,
  stepActive,
  treemapChart,
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
  readonly labelOf: (datum: Datum) => string;
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

const items = (hits: readonly { seriesKey: string; index: number }[]) => new Set(hits.map((h) => `${h.seriesKey}#${h.index}`)).size;

describe.each(CASES.map((c) => [c.recipe.name, c] as const))('%s contract', (_name, { recipe, consumer, items: count, hostile, labelOf }) => {
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
      expect(readout(model, active).heading, `${hit.seriesKey}#${hit.index}`).toBe(labelOf(hit.datum));
    }
  });

  test('REQ-002 · REQ-005 · REQ-011 · the geometry is serialisable, rounded and deterministic', () => {
    const a = serializeGeometry(recipe.build(consumer, context).geometry);
    expect(a).toBe(serializeGeometry(recipe.build(consumer, context).geometry));
    expect(a).not.toMatch(/\d\.\d{3}/);
    expect(a).not.toMatch(/NaN|Infinity/);
  });
});

describe('demo snapshots', () => {
  test.each(CASES.map((c) => [c.recipe.name, c.recipe] as const))('REQ-093 · REQ-005 · %s demo geometry is stable', (_name, recipe) => {
    expect(serializeGeometry(recipe.build({ width: 320, height: 150 }, { ...context, id: 'sp-demo' }).geometry)).toMatchSnapshot();
  });
});
