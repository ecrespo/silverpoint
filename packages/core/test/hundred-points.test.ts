import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, type SpCode } from '../src';
import { BENCH_CONTEXT, HUNDRED_POINTS, POLAR_AT_CEILING, pointCount } from '../bench/hundred-points';

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

/**
 * The polar charts are bounded by sectors, not points (API Spec §12: 60): each is benchmarked at its
 * ceiling — 60 sectors, 12 chord categories — or at 100 of what it reads when it has no ceiling.
 */
describe('polar benchmark datasets', () => {
  test('TD §2 · every polar recipe has a dataset', () => {
    expect(Object.keys(POLAR_AT_CEILING).sort()).toEqual(
      ['ChordRing', 'CoxcombChart', 'DonutChart', 'GaugeArc', 'MeterChart', 'OrbitChart', 'PolarBarChart', 'RadarChart', 'RadialArcGroup', 'RadialRings', 'VolvelleChart', 'WindRose'].sort(),
    );
  });

  test.each(Object.entries(POLAR_AT_CEILING))('TD §2 · %s: a ready model at its ceiling, no diagnostic', (chart, { recipe, props }) => {
    const seen: SpCode[] = [];
    restore = __setDiagnosticSink((code) => seen.push(code));
    const model = recipe.build(props, BENCH_CONTEXT);
    expect(model.chart).toBe(chart);
    expect(model.status).toBe('ready');
    expect(model.geometry.hitAreas.length).toBeGreaterThan(0);
    expect(seen).toEqual([]);
  });
});
