import { afterEach, describe, expect, test } from 'vitest';
import {
  __setDiagnosticSink,
  activityGrid,
  bulletChart,
  heatmapChart,
  pyramidChart,
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
}

const CASES: readonly Case[] = [
  {
    recipe: bulletChart as ChartRecipe<CommonChartProps>,
    consumer: { data: [{ goal: 'Revenue', done: 72, aim: 80 }, { goal: 'Profit', done: 45, aim: 60 }], titleKey: 'goal', actualKey: 'done', targetKey: 'aim' },
    items: 2,
  },
  {
    recipe: pyramidChart as ChartRecipe<CommonChartProps>,
    consumer: { data: [{ tier: 'Gold', pct: 20 }, { tier: 'Silver', pct: 55 }, { tier: 'Bronze', pct: 90 }], labelKey: 'tier', widthKey: 'pct' },
    items: 3,
  },
  {
    recipe: heatmapChart as ChartRecipe<CommonChartProps>,
    consumer: { data: [{ row: 'Mon', vals: [10, 50, 90] }, { row: 'Tue', vals: [0, 30, 100] }], labelKey: 'row', valuesKey: 'vals' },
    items: 6,
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
  },
  {
    recipe: activityGrid as ChartRecipe<CommonChartProps>,
    consumer: { data: days(17, 14) as Datum[], dateKey: 'day', countKey: 'c', levelKey: 'l', weeks: 2 },
    items: 14,
  },
];

const items = (hits: readonly { seriesKey: string; index: number }[]) => new Set(hits.map((h) => `${h.seriesKey}#${h.index}`)).size;

describe.each(CASES.map((c) => [c.recipe.name, c] as const))('%s contract', (_name, { recipe, consumer, items: count }) => {
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

  test('REQ-122 · the keyboard traverses every item of the first series', () => {
    const { geometry } = recipe.build(consumer, context);
    const series = geometry.hitAreas[0]?.seriesKey;
    const seen = new Set<number>();
    let active = stepActive(geometry, null, 'Home') ?? null;
    for (let i = 0; i < geometry.hitAreas.length && active; i += 1) {
      seen.add(active.index);
      active = stepActive(geometry, active, 'ArrowRight') ?? null;
    }
    expect(seen.size).toBe(geometry.hitAreas.filter((h) => h.seriesKey === series).length);
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
