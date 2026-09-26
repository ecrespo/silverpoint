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
  dashboardView,
  inCell,
  type ChartRecipe,
  type CommonChartProps,
} from '@silverpoint/core';
import { dashboardFixtureById, dashboardFixtureProps, fixtureById, fixtureProps, sizeOf } from '@silverpoint/example-harness';
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

/** An element with its attributes; `undefined` ones are left out. */
function element(tag: string, attrs: Readonly<Record<string, string | undefined>>, text?: string): HTMLElement {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) if (value !== undefined) node.setAttribute(name, value);
  if (text !== undefined) node.textContent = text;
  return node;
}
const styleOf = (vars: Readonly<Record<string, string>>) => Object.entries(vars).map(([name, value]) => `${name}:${value}`).join(';');

/**
 * The canonical render of a dashboard fixture (REQ-211): the wrapper from the core's `dashboardView`,
 * and each chart drawn by the pipeline at the width its cell lays out to — the state every adapter
 * reaches once hydrated and measured (REQ-207). Measuring here is the harness's, not the library's.
 */
const dashboard = dashboardFixtureById(new URLSearchParams(location.search).get('dashboard'));
if (dashboard) {
  const { props, children } = dashboardFixtureProps(dashboard);
  const view = dashboardView(props, children.map((child) => ({ cell: child.cell, id: child.props.id as string | undefined })));
  const { section: s, heading, description } = view;
  const section = element('section', { class: s.className, part: 'dashboard', 'data-substrate': s.substrate, 'aria-labelledby': s.labelledby, 'aria-describedby': s.describedby, 'aria-label': s.label, style: styleOf(s.style) });
  if (heading) section.append(element(`h${heading.level}`, { class: 'sp-dashboard-title', part: 'dashboard-title', id: heading.id }, heading.text));
  if (description) section.append(element('p', { class: 'sp-dashboard-description', part: 'dashboard-description', id: description.id }, description.text));
  const grid = element('div', { class: 'sp-dashboard-grid', part: 'dashboard-grid' });
  const roots = view.cells.map((cell) => {
    const article = element('article', { class: 'sp-dashboard-cell', part: 'dashboard-cell', 'aria-labelledby': cell.labelledby, style: styleOf(cell.style) });
    const root = element('div', {});
    article.append(root);
    grid.append(article);
    return root;
  });
  section.append(grid);
  const page = element('div', { class: 'sp-dashboard-harness', 'data-gate': '' });
  page.append(section);
  document.querySelector('.sp-harness')?.replaceWith(page);
  view.cells.forEach((cell, index) => {
    const child = children[cell.child]!;
    const recipe = RECIPES[child.chart as keyof typeof RECIPES] as ChartRecipe<CommonChartProps>;
    const root = roots[index]!;
    const fitted = inCell(child.props, cell.context, recipe);
    const rendered = renderChart(recipe, fitted.props, { id: cell.context.chartId, width: root.getBoundingClientRect().width });
    root.className = `sp-root sp-ground-${rendered.ground}`;
    root.dataset.substrate = rendered.substrate;
    root.dataset.chrome = rendered.chrome;
    root.dataset.status = rendered.status;
    const svg = new DOMParser().parseFromString(toSVGString(rendered), 'text/html').body.firstElementChild;
    if (svg) root.append(document.importNode(svg, true));
  });
}
