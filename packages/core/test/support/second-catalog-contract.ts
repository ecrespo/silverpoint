/**
 * The contract every chart of the second catalog meets, as the first 33 meet catalog-contract
 * (REQ-093, REQ-094, REQ-095, REQ-007, REQ-008, REQ-009, REQ-011, REQ-120, REQ-121, REQ-122,
 * REQ-140, REQ-141, REQ-002, REQ-005), plus REQ-431, REQ-435, REQ-441, REQ-442, REQ-446, REQ-450.
 * A test file calls `secondCatalogContract(cases)` inside its own module.
 */
import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, readout, serializeGeometry, stepActive, type ChartModel, type ChartRecipe, type CommonChartProps, type Datum, type RecipeContext, type SpCode } from '../../src';
import { createPrng } from '../../src/render/prng';

let restore: () => void = () => {};
function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

export const context: RecipeContext = { id: 'sp-wave1', width: 360, locale: 'en', emptyState: { text: 'No data', rule: true }, domainPadding: 0.1 };
export const R = <P extends CommonChartProps>(recipe: ChartRecipe<P>) => recipe as unknown as ChartRecipe<CommonChartProps>;
export const heightened = (model: ChartModel) => model.geometry.strokes.filter((s) => s.part === 'heighten');
const items = (hits: readonly { seriesKey: string; index: number }[]) => new Set(hits.map((h) => `${h.seriesKey}#${h.index}`)).size;

export interface Case {
  readonly recipe: ChartRecipe<CommonChartProps>;
  readonly consumer: CommonChartProps & Record<string, unknown>;
  readonly items: number;
  readonly hostile: readonly Datum[];
  readonly labelOf: (datum: Datum, index: number) => string;
  /** The datum is the consumer's row, not a frozen derived summary. */
  readonly rawDatum?: boolean;
  /** Row order is the drawing's order (a path, a sort by data order): no I-23 shuffle. */
  readonly ordered?: boolean;
}

export function secondCatalogContract(cases: readonly Case[]): void {
  afterEach(() => restore());
  describe.each(cases.map((c) => [c.recipe.name, c] as const))('%s contract', (_name, { recipe, consumer, items: count, hostile, labelOf, rawDatum, ordered }) => {
  test('REQ-093 · REQ-446 · invoked without data it renders its demo, with no diagnostic', () => {
    const seen = capture();
    const model = recipe.build({}, context);
    expect(model.status).toBe('ready');
    expect(model.geometry.hitAreas.length).toBeGreaterThan(0);
    expect(seen).toEqual([]);
  });

  test('REQ-093 · consumer data is read through the accessor keys', () => {
    const model = recipe.build(consumer, context);
    expect(model.status).toBe('ready');
    expect(items(model.geometry.hitAreas)).toBe(count);
  });

  test('REQ-121 · REQ-431 · every item maps to a cell of the derived table', () => {
    const model = recipe.build(consumer, context);
    expect(model.table.caption).toBe(model.name);
    for (const hit of model.geometry.hitAreas) {
      expect(model.table.rows[hit.index], `${hit.seriesKey}#${hit.index}`).toBeDefined();
      expect(model.table.columns).toContain(hit.seriesKey);
      // A derived mark's datum is a frozen summary (API delta §4).
      if (!rawDatum) expect(Object.isFrozen(hit.datum)).toBe(true);
    }
  });

  test('REQ-140 · every item lies in the plot', () => {
    const { plot, hitAreas } = recipe.build(consumer, context).geometry;
    const inside = (x: number, y: number) => x >= plot.x - 0.01 && x <= plot.x + plot.width + 0.01 && y >= plot.y - 0.01 && y <= plot.y + plot.height + 0.01;
    for (const hit of hitAreas) expect(inside(hit.x, hit.y), `${hit.seriesKey}#${hit.index}`).toBe(true);
  });

  test('REQ-122 · I-29 · the arrow keys reach every item, starting from Home', () => {
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

  test('REQ-094 · REQ-095 · card chrome and bare chrome', () => {
    const labels = recipe.build({ ...consumer, title: 'T', badge: 'B', value: 7, unit: 'u', footerLeft: 'L', footerRight: 'R' }, context).geometry.labels;
    for (const kind of ['title', 'badge', 'value', 'unit', 'footer']) expect(labels.some((l) => l.kind === kind), kind).toBe(true);
    const bare = recipe.build({ ...consumer, chrome: 'bare', title: 'Hidden', height: 150 }, context).geometry;
    expect(bare.labels.some((l) => l.kind === 'title')).toBe(false);
    expect(bare.viewBox.height).toBe(150);
  });

  test('REQ-007 · an empty dataset draws the empty state and warns SP001', () => {
    const seen = capture();
    const model = recipe.build({ ...consumer, data: [] }, context);
    expect(model.geometry.hitAreas).toEqual([]);
    expect(model.geometry.labels.some((l) => l.kind === 'empty')).toBe(true);
    expect(seen).toContain('SP001');
  });

  test('REQ-009 · REQ-120 · deferred at zero width; named and described', () => {
    capture();
    expect(recipe.build(consumer, { ...context, width: 0 }).status).toBe('deferred');
    const model = recipe.build({ ...consumer, title: 'Named' }, context);
    expect(model.name).toBe('Named');
    expect(model.description.length).toBeGreaterThan(model.name.length + 10);
  });

  test('REQ-441 · REQ-450 · data strokes are encoding, in the first catalog\'s vocabulary', () => {
    const { strokes } = recipe.build(consumer, context).geometry;
    expect(strokes.some((s) => s.role === 'encoding')).toBe(true);
    for (const s of strokes) {
      expect(['encoding', 'ornament']).toContain(s.role);
      expect(['ink', 'ink-secondary', 'heighten', 'rule', 'grid', 'axis']).toContain(s.part);
    }
  });

  test('REQ-442 · exactly one element is heightened, with its ink outline (REQ-031)', () => {
    for (const props of [{}, consumer]) {
      const model = recipe.build(props, context);
      const marks = heightened(model);
      expect(marks).toHaveLength(1);
      expect(model.geometry.strokes.some((s) => s.part === 'ink' && (s.paint ?? 'stroke') === 'stroke' && s.d === marks[0]?.d)).toBe(true);
    }
  });

  test('REQ-008 · REQ-011 · hostile rows among good ones: no NaN, a warning, the good items drawn', () => {
    const seen = capture();
    const data = consumer.data as Datum[];
    const model = recipe.build({ ...consumer, data: [...data.slice(0, 1), ...hostile, ...data.slice(1)] }, context);
    expect(serializeGeometry(model.geometry) + model.description + JSON.stringify(model.table)).not.toMatch(/NaN|Infinity/);
    expect(seen).toContain('SP002');
    expect(items(model.geometry.hitAreas)).toBe(count);
  });

  test('REQ-141 · every readout names its own item', () => {
    capture();
    const model = recipe.build(consumer, context);
    for (const hit of model.geometry.hitAreas) {
      const active = { seriesKey: hit.seriesKey, index: hit.index, datum: hit.datum, value: hit.value, point: { x: hit.x, y: hit.y } };
      expect(readout(model, active).heading, `${hit.seriesKey}#${hit.index}`).toBe(labelOf(hit.datum, hit.index));
    }
  });

  test('REQ-002 · REQ-005 · REQ-435 · the geometry is rounded and deterministic; I-23 · row order does not move it', () => {
    const a = serializeGeometry(recipe.build(consumer, context).geometry);
    expect(a).toBe(serializeGeometry(recipe.build(consumer, context).geometry));
    // Coordinates carry 2 decimals; a derived value and datum stay exact (the table formats them).
    const { hitAreas, ...drawn } = recipe.build(consumer, context).geometry;
    expect(JSON.stringify({ ...drawn, hitAreas: hitAreas.map(({ datum: _datum, value: _value, ...hit }) => hit) })).not.toMatch(/\d\.\d{3}/);
    // Groups are ordered by first appearance (Data Model §2.15): shuffle, keeping that order.
    const random = createPrng(23);
    const data = consumer.data as Datum[];
    const rank = new Map<unknown, number>();
    for (const d of data) if (!rank.has(d.g)) rank.set(d.g, rank.size);
    const shuffled = data.map((d) => [random(), d] as const).sort((a, b) => a[0] - b[0]).map(([, d]) => d).sort((a, b) => (rank.get(a.g) ?? 0) - (rank.get(b.g) ?? 0));
    const strokes = (model: ChartModel) => model.geometry.strokes.map((s) => s.d).sort();
    if (!ordered) expect(strokes(recipe.build({ ...consumer, data: shuffled }, context))).toEqual(strokes(recipe.build(consumer, context)));
  });

  test('REQ-093 · REQ-005 · the demo geometry is stable', () => {
    expect(serializeGeometry(recipe.build({ width: 320, height: 150 }, { ...context, id: 'sp-demo' }).geometry)).toMatchSnapshot();
  });
});
}
