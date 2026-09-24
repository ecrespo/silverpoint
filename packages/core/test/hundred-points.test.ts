import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, type SpCode } from '../src';
import { BENCH_CONTEXT, HUNDRED_POINTS, pointCount } from '../bench/hundred-points';

let restore: () => void = () => {};
afterEach(() => restore());

/**
 * The benchmark of TD §2 times geometry for a 100-point chart. These tests keep its inputs honest:
 * every cartesian recipe is covered, each dataset holds exactly 100 points, and each builds a
 * ready model without a diagnostic — so the benchmark times drawing, never an empty state.
 */
describe('100-point benchmark datasets', () => {
  test('TD §2 · every cartesian recipe has a dataset', () => {
    expect(Object.keys(HUNDRED_POINTS).sort()).toEqual(
      [
        'AreaChart',
        'BarChart',
        'BubbleChart',
        'CandlestickChart',
        'ComposedChart',
        'FunnelChart',
        'KpiCard',
        'LineChart',
        'RangeBandChart',
        'ScatterChart',
        'SparklineRows',
        'StackedBarChart',
        'StepChart',
        'StreamChart',
        'WaterfallChart',
      ].sort(),
    );
  });

  test.each(Object.entries(HUNDRED_POINTS))('TD §2 · %s: 100 points, a ready model, no diagnostic', (chart, { recipe, props }) => {
    const seen: SpCode[] = [];
    restore = __setDiagnosticSink((code) => seen.push(code));
    expect(pointCount(chart, props)).toBe(100);
    const model = recipe.build(props, BENCH_CONTEXT);
    expect(model.chart).toBe(chart);
    expect(model.status).toBe('ready');
    expect(model.geometry.hitAreas.length).toBeGreaterThan(0);
    expect(seen).toEqual([]);
  });
});
