import { afterEach, describe, expect, test } from 'vitest';
import {
  __setDiagnosticSink,
  barChart,
  composedChart,
  rangeBandChart,
  stackedBarChart,
  stepActive,
  streamChart,
  type ActiveItem,
  type ChartRecipe,
  type RecipeContext,
} from '../src';

let restore: () => void = () => {};
afterEach(() => restore());

const context: RecipeContext = { id: 'sp-gaps', width: 320, locale: 'en', emptyState: { text: 'No data', rule: true }, domainPadding: 0.1 };
const KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
const gap = (i: number) => i === 2 || i === 5;
const rows = Array.from({ length: 8 }, (_, i) => i);

/**
 * Final-review finding C2: on a grid, an arrow moved to exactly the next column, and stayed put
 * when that cell was missing — so a gap in the data walled off the items behind it. Missing values
 * are common (REQ-008); every item must stay reachable from the keyboard (REQ-122).
 */
describe('REQ-122 · grid charts with missing values: every item is reachable', () => {
  test.each([
    ['RangeBandChart', rangeBandChart, { data: rows.map((i) => ({ x: `d${i}`, low: gap(i) ? null : i, high: gap(i) ? null : i + 3 })) }],
    ['ComposedChart', composedChart, { data: rows.map((i) => ({ x: `d${i}`, bar: gap(i) ? null : i + 1, line: gap(i) ? null : i })), barKey: 'bar', lineKey: 'line' }],
    ['BarChart', barChart, { data: rows.map((i) => ({ x: `d${i}`, value: gap(i) ? null : i + 1, s: gap(i) ? null : i + 2 })), secondaryKey: 's' }],
    ['StreamChart', streamChart, { data: rows.map((i) => ({ x: `d${i}`, a: gap(i) ? null : i + 1, b: gap(i) ? null : i + 2 })), keys: ['a', 'b'] }],
    ['StackedBarChart', stackedBarChart, { data: rows.map((i) => ({ x: `d${i}`, a: gap(i) ? null : i + 1, b: gap(i) ? null : i + 2 })), keys: ['a', 'b'] }],
  ] as const)('%s', (_name, recipe, props) => {
    restore = __setDiagnosticSink(() => {});
    const model = (recipe as ChartRecipe<Record<string, unknown>>).build({ height: 150, ...props }, context);
    const id = (item: ActiveItem) => `${item.seriesKey}#${item.index}`;
    const seen = new Set<string>();
    const queue: (ActiveItem | null)[] = [null];
    while (queue.length > 0) {
      const from = queue.shift() ?? null;
      for (const key of KEYS) {
        const next = stepActive(model.geometry, from, key);
        if (next && !seen.has(id(next))) {
          seen.add(id(next));
          queue.push(next);
        }
      }
    }
    expect(model.geometry.hitAreas.length).toBeGreaterThan(0);
    expect(model.geometry.hitAreas.map((h) => `${h.seriesKey}#${h.index}`).filter((h) => !seen.has(h))).toEqual([]);
  });

  test('ArrowRight crosses a gap to the next item in the same row', () => {
    restore = __setDiagnosticSink(() => {});
    const model = rangeBandChart.build({ height: 150, data: rows.map((i) => ({ x: `d${i}`, low: gap(i) ? null : i, high: gap(i) ? null : i + 3 })) }, context);
    const at1 = model.geometry.hitAreas.find((h) => h.seriesKey === 'low' && h.index === 1)!;
    const next = stepActive(model.geometry, { seriesKey: at1.seriesKey, index: at1.index } as ActiveItem, 'ArrowRight');
    expect(next && `${next.seriesKey}#${next.index}`).toBe('low#3');
  });
});
