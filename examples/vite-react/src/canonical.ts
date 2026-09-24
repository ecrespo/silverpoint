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
} from '@silverpoint/core';
import { fixtureById, fixtureProps } from '@silverpoint/example-harness';
import { renderChart, toSVGString } from '@silverpoint/grounds';

const RECIPES = { LineChart: lineChart, BulletChart: bulletChart, PyramidChart: pyramidChart, HeatmapChart: heatmapChart, TreemapChart: treemapChart, SankeyChart: sankeyChart, ActivityGrid: activityGrid, StepChart: stepChart, SparklineRows: sparklineRows, KpiCard: kpiCard, BarChart: barChart, StackedBarChart: stackedBarChart, ComposedChart: composedChart, WaterfallChart: waterfallChart, FunnelChart: funnelChart, CandlestickChart: candlestickChart, AreaChart: areaChart, RangeBandChart: rangeBandChart, StreamChart: streamChart, ScatterChart: scatterChart, BubbleChart: bubbleChart } as const;

const fixture = fixtureById(new URLSearchParams(location.search).get('fixture'));
const harness = document.querySelector('.sp-harness');
if (fixture && harness) {
  const rendered = renderChart(RECIPES[fixture.chart as keyof typeof RECIPES], fixtureProps(fixture), { id: fixture.id });
  const root = document.createElement('div');
  root.className = `sp-root sp-ground-${rendered.ground}`;
  root.dataset.substrate = rendered.substrate;
  root.dataset.status = rendered.status;
  // The markup is the core's own serialisation — user text inside it is already escaped (TD §6).
  root.innerHTML = toSVGString(rendered);
  harness.append(root);
}
