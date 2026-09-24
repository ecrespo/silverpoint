/**
 * 100-point datasets for the geometry benchmark (TD §2, PRD NFR Performance: < 2 ms). Values
 * come from a closed formula, never from `Math.random()`, so every run times the same work.
 */
import {
  areaChart,
  barChart,
  bubbleChart,
  candlestickChart,
  composedChart,
  funnelChart,
  kpiCard,
  lineChart,
  rangeBandChart,
  scatterChart,
  sparklineRows,
  stackedBarChart,
  stepChart,
  streamChart,
  waterfallChart,
  type ChartRecipe,
  type CommonChartProps,
  type Datum,
  type RecipeContext,
} from '../src';

export const POINTS = 100;

export const BENCH_CONTEXT: RecipeContext = {
  id: 'sp-bench',
  width: 640,
  locale: 'en',
  emptyState: { text: 'No data', rule: true },
  domainPadding: 0.1,
};

/** A smooth, varied, strictly positive value for point `i`. */
const wave = (i: number, phase = 0): number => Math.round((50 + 30 * Math.sin(i / 7 + phase) + 12 * Math.cos(i / 3)) * 100) / 100;
const rows = (count: number, row: (i: number) => Datum): Datum[] => Array.from({ length: count }, (_, i) => row(i));
const label = (i: number): string => `P${String(i + 1).padStart(3, '0')}`;

interface BenchCase {
  readonly recipe: ChartRecipe<CommonChartProps>;
  readonly props: CommonChartProps;
}

const bench = (recipe: ChartRecipe<never>, props: Record<string, unknown>): BenchCase =>
  ({ recipe, props: { height: 320, ...props } }) as unknown as BenchCase;

/** Four sparkline rows of 25 points: 100 points in all. */
const SPARKLINE_ROWS = 4;

export const HUNDRED_POINTS: Readonly<Record<string, BenchCase>> = {
  LineChart: bench(lineChart, { data: rows(POINTS, (i) => ({ hour: label(i), hits: wave(i) })), xKey: 'hour', valueKey: 'hits' }),
  StepChart: bench(stepChart, { data: rows(POINTS, (i) => ({ x: label(i), value: wave(i) })) }),
  SparklineRows: bench(sparklineRows, {
    data: rows(SPARKLINE_ROWS, (r) => ({ name: `Row ${r + 1}`, points: rows(POINTS / SPARKLINE_ROWS, (i) => ({ value: wave(i, r) })).map((p) => p.value) })),
  }),
  KpiCard: bench(kpiCard, { data: rows(POINTS, (i) => ({ value: wave(i) })), metric: 'Orders', delta: 4 }),
  BarChart: bench(barChart, { data: rows(POINTS, (i) => ({ x: label(i), value: wave(i) })) }),
  StackedBarChart: bench(stackedBarChart, { data: rows(POINTS / 2, (i) => ({ x: label(i), a: wave(i), b: wave(i, 1) })), keys: ['a', 'b'] }),
  ComposedChart: bench(composedChart, { data: rows(POINTS / 2, (i) => ({ x: label(i), revenue: wave(i), margin: wave(i, 2) / 2 })), barKey: 'revenue', lineKey: 'margin' }),
  WaterfallChart: bench(waterfallChart, {
    data: rows(POINTS, (i) => (i === 0 ? { step: label(i), base: 500 } : { step: label(i), delta: Math.round(wave(i) - 50) })),
  }),
  FunnelChart: bench(funnelChart, { data: rows(POINTS, (i) => ({ stage: label(i), value: 10_000 - i * 90 })) }),
  CandlestickChart: bench(candlestickChart, {
    data: rows(POINTS, (i) => {
      const open = wave(i);
      const close = wave(i + 1);
      return { time: label(i), open, close, high: Math.max(open, close) + 3, low: Math.min(open, close) - 3 };
    }),
  }),
  AreaChart: bench(areaChart, { data: rows(POINTS, (i) => ({ x: label(i), value: wave(i) })) }),
  RangeBandChart: bench(rangeBandChart, { data: rows(POINTS, (i) => ({ x: label(i), low: wave(i) - 10, high: wave(i) + 10 })) }),
  StreamChart: bench(streamChart, { data: rows(POINTS / 2, (i) => ({ x: label(i), a: wave(i), b: wave(i, 1) })), keys: ['a', 'b'] }),
  ScatterChart: bench(scatterChart, { data: rows(POINTS, (i) => ({ x: i, y: wave(i) })) }),
  BubbleChart: bench(bubbleChart, { data: rows(POINTS, (i) => ({ x: i, y: wave(i), size: 1 + (i % 9) })) }),
};

/** Points a dataset draws: rows times the series each row carries. */
export function pointCount(chart: string, props: CommonChartProps): number {
  const data = (props as { data?: readonly Datum[] }).data ?? [];
  if (chart === 'SparklineRows') return data.reduce((sum, row) => sum + ((row.points as readonly unknown[] | undefined)?.length ?? 0), 0);
  const keys = (props as { keys?: readonly string[] }).keys;
  if (keys) return data.length * keys.length;
  if (chart === 'ComposedChart') return data.length * 2;
  return data.length;
}
