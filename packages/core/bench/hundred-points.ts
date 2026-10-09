/**
 * 100-point datasets for the geometry benchmark (TD §2, PRD NFR Performance: < 2 ms). Values
 * come from a closed formula, never from `Math.random()`, so every run times the same work.
 */
import {
  areaChart,
  barChart,
  bubbleChart,
  candlestickChart,
  chordRing,
  composedChart,
  coxcombChart,
  donutChart,
  funnelChart,
  gaugeArc,
  kpiCard,
  lineChart,
  meterChart,
  orbitChart,
  polarBarChart,
  radarChart,
  radialArcGroup,
  radialRings,
  rangeBandChart,
  scatterChart,
  sparklineRows,
  stackedBarChart,
  stepChart,
  streamChart,
  volvelleChart,
  waterfallChart,
  windRose,
  type ChartRecipe,
  type CommonChartProps,
  type Datum,
  type RecipeContext,
} from '../src';
import {
  beeswarmChart,
  boxPlotChart,
  bumpChart,
  connectedScatterChart,
  divergingBarChart,
  dumbbellChart,
  ecdfChart,
  errorBarChart,
  histogramChart,
  intervalChart,
  lollipopChart,
  ridgelineChart,
  slopeChart,
  violinChart,
} from '../src/catalog';

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

const FIRST_HUNDRED: Readonly<Record<string, BenchCase>> = {
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

/** The polar ceiling (API Spec §12). */
const SECTORS = 60;
const sectors = (count: number) => rows(count, (i) => ({ name: label(i), value: Math.round(wave(i)) }));

/**
 * The polar charts at their ceilings (API Spec §12): 60 sectors, 12 chord categories; 100
 * observations or markers where no ceiling applies; the meters draw one value whatever the data.
 */
export const POLAR_AT_CEILING: Readonly<Record<string, BenchCase>> = {
  DonutChart: bench(donutChart, { data: sectors(SECTORS) }),
  RadarChart: bench(radarChart, { data: rows(SECTORS, (i) => ({ subject: label(i), value: wave(i) })) }),
  PolarBarChart: bench(polarBarChart, { data: sectors(SECTORS) }),
  RadialArcGroup: bench(radialArcGroup, { data: sectors(SECTORS) }),
  RadialRings: bench(radialRings, { data: rows(SECTORS, (i) => ({ name: label(i), value: Math.min(wave(i), 100) })) }),
  GaugeArc: bench(gaugeArc, { percent: 72, caption: 'Load' }),
  MeterChart: bench(meterChart, { percent: 72, caption: 'Load' }),
  CoxcombChart: bench(coxcombChart, { data: sectors(SECTORS) }),
  WindRose: bench(windRose, { data: rows(POINTS, (i) => ({ bearing: (i * 37) % 360, speed: 1 + (i % 25) })) }),
  VolvelleChart: bench(volvelleChart, { data: [0, 1, 2].map((k) => ({ label: `R${k}`, segments: Array.from({ length: SECTORS / (k + 1) }, (_, i) => label(i)) })) }),
  // 100 distinct directed pairs over 12 categories: a repeated pair would be summed and warned.
  ChordRing: bench(chordRing, { data: rows(POINTS, (i) => ({ source: `c${i % 12}`, target: `c${(i % 12 + Math.floor(i / 12) + 1) % 12}`, value: 1 + (i % 9) })) }),
  OrbitChart: bench(orbitChart, { data: [0, 1, 2, 3].map((k) => ({ label: `O${k}`, markers: rows(POINTS / 4, (i) => ({ period: i / 25, value: 1 + ((i + k) % 7) })) })) }),
};

/** The second catalog's wave 1 at 100 points (feature-003, REQ-445: 2 ms, unchanged). */
const SECOND_HUNDRED: Readonly<Record<string, BenchCase>> = {
  LollipopChart: bench(lollipopChart, { data: rows(POINTS, (i) => ({ x: label(i), value: wave(i) })) }),
  DumbbellChart: bench(dumbbellChart, { data: rows(POINTS, (i) => ({ label: label(i), start: wave(i), end: wave(i, 1) })) }),
  SlopeChart: bench(slopeChart, { data: rows(POINTS, (i) => ({ label: label(i), start: wave(i), end: wave(i, 1) })) }),
  BumpChart: bench(bumpChart, { data: rows(POINTS, (i) => ({ x: Math.floor(i / 10), series: `S${i % 10}`, value: wave(i) })) }),
  ErrorBarChart: bench(errorBarChart, { data: rows(POINTS, (i) => ({ label: label(i), estimate: wave(i), low: wave(i) - 8, high: wave(i) + 5 })) }),
  IntervalChart: bench(intervalChart, { data: rows(POINTS, (i) => ({ lane: `L${i % 8}`, start: i, end: i + 3 + (i % 5) })) }),
  DivergingBarChart: bench(divergingBarChart, {
    data: rows(POINTS / 5, (i) => ({ label: label(i), a: wave(i), b: wave(i, 1), c: wave(i, 2), d: wave(i, 3), e: wave(i, 4) })),
    levels: ['a', 'b', 'c', 'd', 'e'],
  }),
  ConnectedScatterChart: bench(connectedScatterChart, { data: rows(POINTS, (i) => ({ x: wave(i), y: wave(i, 2) })) }),
  EcdfChart: bench(ecdfChart, { data: rows(POINTS, (i) => ({ value: wave(i, i % 3), group: `G${i % 2}` })), groupKey: 'group' }),
  BeeswarmChart: bench(beeswarmChart, { data: rows(POINTS, (i) => ({ value: wave(i, i % 3) })) }),
};
/** Every cartesian recipe at 100 points, both catalogs. */
export const HUNDRED_POINTS: Readonly<Record<string, BenchCase>> = { ...FIRST_HUNDRED, ...SECOND_HUNDRED };

/** Observations a statistic chart is timed over (REQ-445: 4 ms for 1 000). */
export const OBSERVATIONS = 1000;
const observations = (count: number, groups: number) => rows(count, (i) => ({ value: wave(i, i % 3), group: `G${i % groups}` }));

/**
 * The statistic charts of wave 1 whose drawing does not grow with the observations — bins, boxes,
 * densities — over 1 000 of them, timed against 4 ms (`stats · …`, REQ-445). The ECDF and the
 * beeswarm draw a mark per observation, so they are timed as every point chart is, at 100 against
 * 2 ms (in `HUNDRED_POINTS`); their statistics alone — the ECDF of 1 000, the packing of 500 — are
 * timed against 4 ms in `stats.bench.ts`.
 */
export const STATISTIC_CHARTS: Readonly<Record<string, BenchCase>> = {
  HistogramChart: bench(histogramChart, { data: observations(OBSERVATIONS, 1) }),
  BoxPlotChart: bench(boxPlotChart, { data: observations(OBSERVATIONS, 5), groupKey: 'group' }),
  ViolinChart: bench(violinChart, { data: observations(OBSERVATIONS, 5), groupKey: 'group' }),
  RidgelineChart: bench(ridgelineChart, { data: observations(OBSERVATIONS, 5), groupKey: 'group' }),
};

/** Points a dataset draws: rows times the series each row carries. */
export function pointCount(chart: string, props: CommonChartProps): number {
  const data = (props as { data?: readonly Datum[] }).data ?? [];
  if (chart === 'SparklineRows') return data.reduce((sum, row) => sum + ((row.points as readonly unknown[] | undefined)?.length ?? 0), 0);
  const keys = (props as { keys?: readonly string[] }).keys;
  if (keys) return data.length * keys.length;
  if (chart === 'ComposedChart') return data.length * 2;
  const levels = (props as { levels?: readonly string[] }).levels;
  if (levels) return data.length * levels.length;
  return data.length;
}
