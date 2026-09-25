/**
 * The canonical render of a fixture, drawn with no framework at all: the core pipeline's own SVG
 * string inside the same harness and stylesheet. The pixel gate compares every adapter with this
 * page (Constitution Art. 3, first threshold).
 */
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/example-harness/harness.css';
import {
  lineChart,
  bulletChart,
  pyramidChart,
  heatmapChart,
  treemapChart,
  sankeyChart,
  activityGrid,
  stepChart,
  sparklineRows,
  kpiCard,
  barChart,
  stackedBarChart,
  composedChart,
  waterfallChart,
  funnelChart,
  candlestickChart,
  areaChart,
  rangeBandChart,
  streamChart,
  scatterChart,
  bubbleChart,
  donutChart,
  radarChart,
  polarBarChart,
  radialArcGroup,
  radialRings,
  gaugeArc,
  meterChart,
  coxcombChart,
  windRose,
  volvelleChart,
  chordRing,
  orbitChart,
  type ChartRecipe,
  type CommonChartProps,
} from '@silverpoint/core';
import { fixtureById, fixtureProps, sizeOf } from '@silverpoint/example-harness';
import { renderChart, toSVGString } from '@silverpoint/grounds';

const RECIPES = { LineChart: lineChart, BulletChart: bulletChart, PyramidChart: pyramidChart, HeatmapChart: heatmapChart, TreemapChart: treemapChart, SankeyChart: sankeyChart, ActivityGrid: activityGrid, StepChart: stepChart, SparklineRows: sparklineRows, KpiCard: kpiCard, BarChart: barChart, StackedBarChart: stackedBarChart, ComposedChart: composedChart, WaterfallChart: waterfallChart, FunnelChart: funnelChart, CandlestickChart: candlestickChart, AreaChart: areaChart, RangeBandChart: rangeBandChart, StreamChart: streamChart, ScatterChart: scatterChart, BubbleChart: bubbleChart, DonutChart: donutChart, RadarChart: radarChart, PolarBarChart: polarBarChart, RadialArcGroup: radialArcGroup, RadialRings: radialRings, GaugeArc: gaugeArc, MeterChart: meterChart, CoxcombChart: coxcombChart, WindRose: windRose, VolvelleChart: volvelleChart, ChordRing: chordRing, OrbitChart: orbitChart } as const;

const fixture = fixtureById(new URLSearchParams(location.search).get('fixture'));
const harness = document.querySelector<HTMLElement>('.sp-harness');
if (fixture && harness) {
  harness.dataset.size = sizeOf(fixture);
  // A fixture's props fit its own chart; the union of recipes cannot say so, hence the widening.
  const recipe = RECIPES[fixture.chart as keyof typeof RECIPES] as ChartRecipe<CommonChartProps>;
  const rendered = renderChart(recipe, fixtureProps(fixture), { id: fixture.id });
  const root = document.createElement('div');
  root.className = `sp-root sp-ground-${rendered.ground}`;
  root.dataset.substrate = rendered.substrate;
  root.dataset.status = rendered.status;
  // The core's own serialisation, parsed inert (an HTML parse places `<svg>` in the SVG namespace,
  // as inline markup is) and adopted as nodes: no markup injection (TD §6).
  const svg = new DOMParser().parseFromString(toSVGString(rendered), 'text/html').body.firstElementChild;
  if (svg) root.append(document.importNode(svg, true));
  harness.append(root);
}
