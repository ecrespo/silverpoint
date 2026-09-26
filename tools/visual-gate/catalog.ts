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
  chordRing,
  composedChart,
  coxcombChart,
  donutChart,
  funnelChart,
  gaugeArc,
  heatmapChart,
  kpiCard,
  lineChart,
  meterChart,
  orbitChart,
  polarBarChart,
  pyramidChart,
  radarChart,
  radialArcGroup,
  radialRings,
  rangeBandChart,
  sankeyChart,
  scatterChart,
  sparklineRows,
  stackedBarChart,
  stepChart,
  streamChart,
  treemapChart,
  volvelleChart,
  waterfallChart,
  windRose,
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
  /**
   * A view prop set to other than its default, which must change the demo without a diagnostic
   * (REQ-098); `null` when the chart has no own view prop.
   */
  readonly demoProbe: Readonly<Record<string, unknown>> | null;
  /** Codes the probe raises by design, as it would with consumer data (ChordRing folds into "Other"). */
  readonly demoProbeWarns?: readonly string[];
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
    demoProbe: { curve: 'step' },
    sample: { data: [{ day: 'Mon', hits: 3 }, { day: 'Tue', hits: 5 }, { day: 'Wed', hits: 4 }], xKey: 'day', valueKey: 'hits' },
  }),
  entry({
    chart: 'BulletChart',
    req: 'REQ-069',
    slug: 'bullet-chart',
    recipe: bulletChart,
    propsInterface: 'BulletChartProps',
    demoProbe: null,
    sample: { data: [{ goal: 'Revenue', done: 72, aim: 80 }, { goal: 'Profit', done: 45, aim: 60 }], titleKey: 'goal', actualKey: 'done', targetKey: 'aim' },
  }),
  entry({
    chart: 'PyramidChart',
    req: 'REQ-070',
    slug: 'pyramid-chart',
    recipe: pyramidChart,
    propsInterface: 'PyramidChartProps',
    demoProbe: null,
    sample: { data: [{ tier: 'Apex', pct: 20, t: 1 }, { tier: 'Base', pct: 90, t: 3 }], labelKey: 'tier', widthKey: 'pct', toneKey: 't' },
  }),
  entry({
    chart: 'HeatmapChart',
    req: 'REQ-084',
    slug: 'heatmap-chart',
    recipe: heatmapChart,
    propsInterface: 'HeatmapChartProps',
    demoProbe: { scaleMax: 1000 },
    sample: { data: [{ row: 'Mon', vals: [10, 50, 90] }, { row: 'Tue', vals: [0, 30, 100] }], labelKey: 'row', valuesKey: 'vals', scaleMax: 120 },
  }),
  entry({
    chart: 'TreemapChart',
    req: 'REQ-085',
    slug: 'treemap-chart',
    recipe: treemapChart,
    propsInterface: 'TreemapChartProps',
    demoProbe: { columns: 12 },
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
    demoProbe: null,
    sample: { data: [{ a: 'Web', b: 'Signup', n: 60 }, { a: 'Ads', b: 'Signup', n: 40 }, { a: 'Signup', b: 'Paid', n: 30 }], sourceKey: 'a', targetKey: 'b', valueKey: 'n' },
  }),
  entry({
    chart: 'ActivityGrid',
    req: 'REQ-087',
    slug: 'activity-grid',
    recipe: activityGrid,
    propsInterface: 'ActivityGridProps',
    demoProbe: { weeks: 8 },
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
    demoProbe: { step: 'before' },
    sample: { data: [{ d: 'a', v: 1 }, { d: 'b', v: 3 }, { d: 'c', v: 2 }], xKey: 'd', valueKey: 'v', step: 'middle' },
  }),
  entry({
    chart: 'SparklineRows',
    req: 'REQ-062',
    slug: 'sparkline-rows',
    recipe: sparklineRows,
    propsInterface: 'SparklineRowsProps',
    demoProbe: { rows: 1 },
    sample: { data: [{ n: 'CPU', r: '42%', pts: [1, 3, 2] }, { n: 'RAM', pts: [{ value: 5 }, { value: 4 }] }], nameKey: 'n', readoutKey: 'r', seriesKey: 'pts' },
  }),
  entry({
    chart: 'KpiCard',
    req: 'REQ-063',
    slug: 'kpi-card',
    recipe: kpiCard,
    propsInterface: 'KpiCardProps',
    demoProbe: { metric: 'Probe' },
    sample: { data: [{ v: 5 }, { v: 7 }, { v: 6 }], valueKey: 'v', metric: 'Orders', delta: 12 },
  }),
  entry({
    chart: 'BarChart',
    req: 'REQ-064',
    slug: 'bar-chart',
    recipe: barChart,
    propsInterface: 'BarChartProps',
    demoProbe: { orientation: 'rows' },
    sample: { data: [{ c: 'a', v: 3, w: 1 }, { c: 'b', v: -2, w: 2 }], xKey: 'c', valueKey: 'v', secondaryKey: 'w', orientation: 'rows' },
  }),
  entry({
    chart: 'StackedBarChart',
    req: 'REQ-065',
    slug: 'stacked-bar-chart',
    recipe: stackedBarChart,
    propsInterface: 'StackedBarChartProps',
    demoProbe: null,
    sample: { data: [{ c: 'a', p: 1, q: 2 }, { c: 'b', p: 3, q: 1 }], xKey: 'c', keys: ['p', 'q'], names: ['P', 'Q'] },
  }),
  entry({
    chart: 'ComposedChart',
    req: 'REQ-066',
    slug: 'composed-chart',
    recipe: composedChart,
    propsInterface: 'ComposedChartProps',
    demoProbe: { showLine: false },
    sample: { data: [{ c: 'a', b: 3, l: 2 }, { c: 'b', b: 5, l: 4 }], xKey: 'c', barKey: 'b', lineKey: 'l' },
  }),
  entry({
    chart: 'WaterfallChart',
    req: 'REQ-067',
    slug: 'waterfall-chart',
    recipe: waterfallChart,
    propsInterface: 'WaterfallChartProps',
    demoProbe: null,
    sample: { data: [{ s: 'Start', t: 10 }, { s: 'Up', d: 5 }, { s: 'Down', d: -3 }, { s: 'End', t: 12 }], stepKey: 's', baseKey: 't', deltaKey: 'd' },
  }),
  entry({
    chart: 'FunnelChart',
    req: 'REQ-068',
    slug: 'funnel-chart',
    recipe: funnelChart,
    propsInterface: 'FunnelChartProps',
    demoProbe: null,
    sample: { data: [{ st: 'Visit', n: 100 }, { st: 'Cart', n: 40 }, { st: 'Buy', n: 10 }], stageKey: 'st', valueKey: 'n' },
  }),
  entry({
    chart: 'CandlestickChart',
    req: 'REQ-071',
    slug: 'candlestick-chart',
    recipe: candlestickChart,
    propsInterface: 'CandlestickChartProps',
    demoProbe: { bounds: [0, 1000] },
    sample: { data: [{ t: 'd1', o: 10, h: 12, l: 9, c: 11 }, { t: 'd2', o: 11, h: 11.5, l: 8, c: 9 }], timeKey: 't', openKey: 'o', highKey: 'h', lowKey: 'l', closeKey: 'c', bounds: [5, 15] },
  }),
  entry({
    chart: 'AreaChart',
    req: 'REQ-072',
    slug: 'area-chart',
    recipe: areaChart,
    propsInterface: 'AreaChartProps',
    demoProbe: { curve: 'step' },
    sample: { data: [{ d: 'a', v: 1 }, { d: 'b', v: 4 }, { d: 'c', v: 2 }], xKey: 'd', valueKey: 'v', curve: 'linear' },
  }),
  entry({
    chart: 'RangeBandChart',
    req: 'REQ-073',
    slug: 'range-band-chart',
    recipe: rangeBandChart,
    propsInterface: 'RangeBandChartProps',
    demoProbe: null,
    sample: { data: [{ d: 'a', lo: 1, hi: 3 }, { d: 'b', lo: 2, hi: 5 }], xKey: 'd', lowKey: 'lo', highKey: 'hi' },
  }),
  entry({
    chart: 'StreamChart',
    req: 'REQ-074',
    slug: 'stream-chart',
    recipe: streamChart,
    propsInterface: 'StreamChartProps',
    demoProbe: { stacked: true },
    sample: { data: [{ d: 'a', p: 1, q: 2 }, { d: 'b', p: 3, q: 1 }, { d: 'c', p: 2, q: 2 }], xKey: 'd', keys: ['p', 'q'], stacked: true },
  }),
  entry({
    chart: 'ScatterChart',
    req: 'REQ-082',
    slug: 'scatter-chart',
    recipe: scatterChart,
    propsInterface: 'ScatterChartProps',
    demoProbe: { sizeRange: [1, 40] },
    sample: { data: [{ a: 1, b: 2, s: 5 }, { a: 2, b: 4, s: 1 }, { a: 3, b: 1, s: 3 }], xKey: 'a', yKey: 'b', sizeKey: 's', sizeRange: [40, 160] },
  }),
  entry({
    chart: 'BubbleChart',
    req: 'REQ-083',
    slug: 'bubble-chart',
    recipe: bubbleChart,
    propsInterface: 'BubbleChartProps',
    demoProbe: { sizeRange: [1, 40] },
    sample: { data: [{ a: 1, b: 2, s: 5 }, { a: 2, b: 4, s: 1 }, { a: 3, b: 1, s: 3 }], xKey: 'a', yKey: 'b', sizeKey: 's' },
  }),
  // Phase 3: the polar charts.
  entry({
    chart: 'DonutChart',
    req: 'REQ-075',
    slug: 'donut-chart',
    recipe: donutChart,
    propsInterface: 'DonutChartProps',
    demoProbe: { centerLabel: 'Probe' },
    sample: { data: [{ n: 'Rent', v: 40 }, { n: 'Food', v: 25 }, { n: 'Fun', v: 10 }], nameKey: 'n', valueKey: 'v', centerLabel: 'spent' },
  }),
  entry({
    chart: 'RadarChart',
    req: 'REQ-076',
    slug: 'radar-chart',
    recipe: radarChart,
    propsInterface: 'RadarChartProps',
    demoProbe: { domain: [0, 1000] },
    sample: { data: [{ s: 'Speed', v: 7 }, { s: 'Range', v: 4 }, { s: 'Cost', v: 9 }], subjectKey: 's', valueKey: 'v', domain: [0, 10] },
  }),
  entry({
    chart: 'PolarBarChart',
    req: 'REQ-077',
    slug: 'polar-bar-chart',
    recipe: polarBarChart,
    propsInterface: 'PolarBarChartProps',
    demoProbe: null,
    sample: { data: [{ n: 'Q1', v: 4 }, { n: 'Q2', v: 7 }, { n: 'Q3', v: 5 }], nameKey: 'n', valueKey: 'v' },
  }),
  entry({
    chart: 'RadialArcGroup',
    req: 'REQ-078',
    slug: 'radial-arc-group',
    recipe: radialArcGroup,
    propsInterface: 'RadialArcGroupProps',
    demoProbe: null,
    sample: { data: [{ n: 'Sales', v: 80 }, { n: 'Leads', v: 55 }], nameKey: 'n', valueKey: 'v' },
  }),
  entry({
    chart: 'RadialRings',
    req: 'REQ-079',
    slug: 'radial-rings',
    recipe: radialRings,
    propsInterface: 'RadialRingsProps',
    demoProbe: null,
    sample: { data: [{ n: 'Move', v: 80 }, { n: 'Stand', v: 100 }], nameKey: 'n', valueKey: 'v' },
  }),
  entry({
    chart: 'GaugeArc',
    req: 'REQ-080',
    slug: 'gauge-arc',
    recipe: gaugeArc,
    propsInterface: 'GaugeArcProps',
    demoProbe: { percent: 13 },
    sample: { percent: 37, caption: 'Load' },
  }),
  entry({
    chart: 'MeterChart',
    req: 'REQ-081',
    slug: 'meter-chart',
    recipe: meterChart,
    propsInterface: 'MeterChartProps',
    demoProbe: { percent: 13 },
    sample: { percent: 64, readout: '6.4 bar' },
  }),
  entry({
    chart: 'CoxcombChart',
    req: 'REQ-088',
    slug: 'coxcomb-chart',
    recipe: coxcombChart,
    propsInterface: 'CoxcombChartProps',
    demoProbe: { startAngle: 90 },
    sample: { data: [{ n: 'Jan', v: 40 }, { n: 'Feb', v: 25 }, { n: 'Mar', v: 10 }], nameKey: 'n', valueKey: 'v', startAngle: 30 },
  }),
  entry({
    chart: 'WindRose',
    req: 'REQ-089',
    slug: 'wind-rose',
    recipe: windRose,
    propsInterface: 'WindRoseProps',
    demoProbe: { sectors: 8 },
    sample: { data: [{ b: 10, s: 4 }, { b: 95, s: 12 }, { b: 200, s: 7 }, { b: 280, s: 22 }], bearingKey: 'b', valueKey: 's', sectors: 8, bins: [5, 15] },
  }),
  entry({
    chart: 'VolvelleChart',
    req: 'REQ-090',
    slug: 'volvelle-chart',
    recipe: volvelleChart,
    propsInterface: 'VolvelleChartProps',
    demoProbe: { indexRing: 1, indexValue: 'Night' },
    sample: { data: [{ label: 'Day', segments: ['Mon', 'Tue', 'Wed'] }, { label: 'Shift', segments: ['Early', 'Late'] }], indexRing: 1, indexValue: 'Late' },
  }),
  entry({
    chart: 'ChordRing',
    req: 'REQ-091',
    slug: 'chord-ring',
    recipe: chordRing,
    propsInterface: 'ChordRingProps',
    demoProbe: { maxCategories: 3 },
    demoProbeWarns: ['SP010'],
    sample: { data: [{ a: 'Web', b: 'App', n: 30 }, { a: 'App', b: 'Mail', n: 10 }, { a: 'Mail', b: 'Web', n: 5 }], sourceKey: 'a', targetKey: 'b', valueKey: 'n', maxCategories: 8 },
  }),
  entry({
    chart: 'OrbitChart',
    req: 'REQ-092',
    slug: 'orbit-chart',
    recipe: orbitChart,
    propsInterface: 'OrbitChartProps',
    demoProbe: { orbits: 2 },
    sample: { data: [{ label: 'Q', ms: [{ p: 0.1, value: 3 }, { p: 0.6, value: 5 }] }], markerKey: 'ms', periodKey: 'p', orbits: 1 },
  }),
];

/** Every chart after the line chart, which every adapter publishes alongside it. */
export const AFTER_LINE_CHART: readonly CatalogEntry[] = CATALOG.filter((c) => c.chart !== 'LineChart');

export function catalogEntry(chart: string): CatalogEntry {
  const found = CATALOG.find((c) => c.chart === chart);
  if (!found) throw new Error(`No catalog entry for ${chart}`);
  return found;
}
