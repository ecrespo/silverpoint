/**
 * The chart catalog as the gates and the adapter tests see it: one row per chart, naming its
 * recipe, the subpath every adapter publishes it at, and a consumer sample that reaches the data
 * through non-default accessor keys. Adding a chart to a phase is adding a row here.
 */
import {
  activityGrid,
  areaChart,
  barChart,
  bubbleChart,
  bulletChart,
  candlestickChart,
  composedChart,
  funnelChart,
  heatmapChart,
  kpiCard,
  lineChart,
  pyramidChart,
  rangeBandChart,
  sankeyChart,
  scatterChart,
  sparklineRows,
  stackedBarChart,
  stepChart,
  streamChart,
  treemapChart,
  waterfallChart,
  type ChartRecipe,
  type CommonChartProps,
} from '@silverpoint/core';

export interface CatalogEntry {
  /** Recipe name, React component name, and the suffix of the Vue `Sp*` name. */
  readonly chart: string;
  readonly req: string;
  /** Subpath of every adapter (`@silverpoint/react/<slug>`) and the Angular selector's suffix. */
  readonly slug: string;
  readonly recipe: ChartRecipe<CommonChartProps>;
  /** Name of the props interface in `packages/core/src/types/props.ts`. */
  readonly propsInterface: string;
  /** Consumer props: own data, read through keys other than the defaults. */
  readonly sample: Readonly<Record<string, unknown>>;
}

const entry = (row: Omit<CatalogEntry, 'recipe'> & { readonly recipe: ChartRecipe<never> }): CatalogEntry =>
  row as unknown as CatalogEntry;

export const CATALOG: readonly CatalogEntry[] = [
  entry({
    chart: 'LineChart',
    req: 'REQ-060',
    slug: 'line-chart',
    recipe: lineChart,
    propsInterface: 'LineChartProps',
    sample: { data: [{ day: 'Mon', hits: 3 }, { day: 'Tue', hits: 5 }, { day: 'Wed', hits: 4 }], xKey: 'day', valueKey: 'hits' },
  }),
  entry({
    chart: 'BulletChart',
    req: 'REQ-069',
    slug: 'bullet-chart',
    recipe: bulletChart,
    propsInterface: 'BulletChartProps',
    sample: { data: [{ goal: 'Revenue', done: 72, aim: 80 }, { goal: 'Profit', done: 45, aim: 60 }], titleKey: 'goal', actualKey: 'done', targetKey: 'aim' },
  }),
  entry({
    chart: 'PyramidChart',
    req: 'REQ-070',
    slug: 'pyramid-chart',
    recipe: pyramidChart,
    propsInterface: 'PyramidChartProps',
    sample: { data: [{ tier: 'Apex', pct: 20, t: 1 }, { tier: 'Base', pct: 90, t: 3 }], labelKey: 'tier', widthKey: 'pct', toneKey: 't' },
  }),
  entry({
    chart: 'HeatmapChart',
    req: 'REQ-084',
    slug: 'heatmap-chart',
    recipe: heatmapChart,
    propsInterface: 'HeatmapChartProps',
    sample: { data: [{ row: 'Mon', vals: [10, 50, 90] }, { row: 'Tue', vals: [0, 30, 100] }], labelKey: 'row', valuesKey: 'vals', scaleMax: 120 },
  }),
  entry({
    chart: 'TreemapChart',
    req: 'REQ-085',
    slug: 'treemap-chart',
    recipe: treemapChart,
    propsInterface: 'TreemapChartProps',
    sample: {
      data: [{ name: 'A', pc: 60, cols: 3, rows: 2 }, { name: 'B', pc: 40, cols: 2, rows: 2, tone: 1 }],
      labelKey: 'name',
      shareKey: 'pc',
      columns: 5,
      rows: 2,
    },
  }),
  entry({
    chart: 'SankeyChart',
    req: 'REQ-086',
    slug: 'sankey-chart',
    recipe: sankeyChart,
    propsInterface: 'SankeyChartProps',
    sample: { data: [{ a: 'Web', b: 'Signup', n: 60 }, { a: 'Ads', b: 'Signup', n: 40 }, { a: 'Signup', b: 'Paid', n: 30 }], sourceKey: 'a', targetKey: 'b', valueKey: 'n' },
  }),
  entry({
    chart: 'ActivityGrid',
    req: 'REQ-087',
    slug: 'activity-grid',
    recipe: activityGrid,
    propsInterface: 'ActivityGridProps',
    sample: {
      data: Array.from({ length: 14 }, (_, i) => ({ d: `2026-06-${String(i + 1).padStart(2, '0')}`, n: i, l: i % 5 })),
      dateKey: 'd',
      countKey: 'n',
      levelKey: 'l',
      weeks: 2,
    },
  }),
  entry({
    chart: 'StepChart',
    req: 'REQ-061',
    slug: 'step-chart',
    recipe: stepChart,
    propsInterface: 'StepChartProps',
    sample: { data: [{ d: 'a', v: 1 }, { d: 'b', v: 3 }, { d: 'c', v: 2 }], xKey: 'd', valueKey: 'v', step: 'middle' },
  }),
  entry({
    chart: 'SparklineRows',
    req: 'REQ-062',
    slug: 'sparkline-rows',
    recipe: sparklineRows,
    propsInterface: 'SparklineRowsProps',
    sample: { data: [{ n: 'CPU', r: '42%', pts: [1, 3, 2] }, { n: 'RAM', pts: [{ value: 5 }, { value: 4 }] }], nameKey: 'n', readoutKey: 'r', seriesKey: 'pts' },
  }),
  entry({
    chart: 'KpiCard',
    req: 'REQ-063',
    slug: 'kpi-card',
    recipe: kpiCard,
    propsInterface: 'KpiCardProps',
    sample: { data: [{ v: 5 }, { v: 7 }, { v: 6 }], valueKey: 'v', metric: 'Orders', delta: 12 },
  }),
  entry({
    chart: 'BarChart',
    req: 'REQ-064',
    slug: 'bar-chart',
    recipe: barChart,
    propsInterface: 'BarChartProps',
    sample: { data: [{ c: 'a', v: 3, w: 1 }, { c: 'b', v: -2, w: 2 }], xKey: 'c', valueKey: 'v', secondaryKey: 'w', orientation: 'rows' },
  }),
  entry({
    chart: 'StackedBarChart',
    req: 'REQ-065',
    slug: 'stacked-bar-chart',
    recipe: stackedBarChart,
    propsInterface: 'StackedBarChartProps',
    sample: { data: [{ c: 'a', p: 1, q: 2 }, { c: 'b', p: 3, q: 1 }], xKey: 'c', keys: ['p', 'q'], names: ['P', 'Q'] },
  }),
  entry({
    chart: 'ComposedChart',
    req: 'REQ-066',
    slug: 'composed-chart',
    recipe: composedChart,
    propsInterface: 'ComposedChartProps',
    sample: { data: [{ c: 'a', b: 3, l: 2 }, { c: 'b', b: 5, l: 4 }], xKey: 'c', barKey: 'b', lineKey: 'l' },
  }),
  entry({
    chart: 'WaterfallChart',
    req: 'REQ-067',
    slug: 'waterfall-chart',
    recipe: waterfallChart,
    propsInterface: 'WaterfallChartProps',
    sample: { data: [{ s: 'Start', t: 10 }, { s: 'Up', d: 5 }, { s: 'Down', d: -3 }, { s: 'End', t: 12 }], stepKey: 's', baseKey: 't', deltaKey: 'd' },
  }),
  entry({
    chart: 'FunnelChart',
    req: 'REQ-068',
    slug: 'funnel-chart',
    recipe: funnelChart,
    propsInterface: 'FunnelChartProps',
    sample: { data: [{ st: 'Visit', n: 100 }, { st: 'Cart', n: 40 }, { st: 'Buy', n: 10 }], stageKey: 'st', valueKey: 'n' },
  }),
  entry({
    chart: 'CandlestickChart',
    req: 'REQ-071',
    slug: 'candlestick-chart',
    recipe: candlestickChart,
    propsInterface: 'CandlestickChartProps',
    sample: { data: [{ t: 'd1', o: 10, h: 12, l: 9, c: 11 }, { t: 'd2', o: 11, h: 11.5, l: 8, c: 9 }], timeKey: 't', openKey: 'o', highKey: 'h', lowKey: 'l', closeKey: 'c', bounds: [5, 15] },
  }),
  entry({
    chart: 'AreaChart',
    req: 'REQ-072',
    slug: 'area-chart',
    recipe: areaChart,
    propsInterface: 'AreaChartProps',
    sample: { data: [{ d: 'a', v: 1 }, { d: 'b', v: 4 }, { d: 'c', v: 2 }], xKey: 'd', valueKey: 'v', curve: 'linear' },
  }),
  entry({
    chart: 'RangeBandChart',
    req: 'REQ-073',
    slug: 'range-band-chart',
    recipe: rangeBandChart,
    propsInterface: 'RangeBandChartProps',
    sample: { data: [{ d: 'a', lo: 1, hi: 3 }, { d: 'b', lo: 2, hi: 5 }], xKey: 'd', lowKey: 'lo', highKey: 'hi' },
  }),
  entry({
    chart: 'StreamChart',
    req: 'REQ-074',
    slug: 'stream-chart',
    recipe: streamChart,
    propsInterface: 'StreamChartProps',
    sample: { data: [{ d: 'a', p: 1, q: 2 }, { d: 'b', p: 3, q: 1 }, { d: 'c', p: 2, q: 2 }], xKey: 'd', keys: ['p', 'q'], stacked: true },
  }),
  entry({
    chart: 'ScatterChart',
    req: 'REQ-082',
    slug: 'scatter-chart',
    recipe: scatterChart,
    propsInterface: 'ScatterChartProps',
    sample: { data: [{ a: 1, b: 2, s: 5 }, { a: 2, b: 4, s: 1 }, { a: 3, b: 1, s: 3 }], xKey: 'a', yKey: 'b', sizeKey: 's', sizeRange: [40, 160] },
  }),
  entry({
    chart: 'BubbleChart',
    req: 'REQ-083',
    slug: 'bubble-chart',
    recipe: bubbleChart,
    propsInterface: 'BubbleChartProps',
    sample: { data: [{ a: 1, b: 2, s: 5 }, { a: 2, b: 4, s: 1 }, { a: 3, b: 1, s: 3 }], xKey: 'a', yKey: 'b', sizeKey: 's' },
  }),
];

/** Every chart after the line chart, which every adapter publishes alongside it. */
export const AFTER_LINE_CHART: readonly CatalogEntry[] = CATALOG.filter((c) => c.chart !== 'LineChart');

export function catalogEntry(chart: string): CatalogEntry {
  const found = CATALOG.find((c) => c.chart === chart);
  if (!found) throw new Error(`No catalog entry for ${chart}`);
  return found;
}
