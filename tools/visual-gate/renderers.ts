/**
 * Server renderers of the three adapters (DD-003), over the published builds:
 * `renderToStaticMarkup` (React), `@vue/server-renderer` (Vue) and `renderApplication` (Angular).
 * `@angular/compiler` must be loaded first, to link the partial-compiled APF bundle.
 */
import { Component, type ApplicationRef, type Type } from '@angular/core';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { SpLineChart as AngularLineChart } from '@silverpoint/angular/line-chart';
import { SpBulletChart as AngularBulletChart } from '@silverpoint/angular/bullet-chart';
import { SpPyramidChart as AngularPyramidChart } from '@silverpoint/angular/pyramid-chart';
import { SpHeatmapChart as AngularHeatmapChart } from '@silverpoint/angular/heatmap-chart';
import { SpTreemapChart as AngularTreemapChart } from '@silverpoint/angular/treemap-chart';
import { SpSankeyChart as AngularSankeyChart } from '@silverpoint/angular/sankey-chart';
import { SpActivityGrid as AngularActivityGrid } from '@silverpoint/angular/activity-grid';
import { SpStepChart as AngularStepChart } from '@silverpoint/angular/step-chart';
import { SpSparklineRows as AngularSparklineRows } from '@silverpoint/angular/sparkline-rows';
import { SpKpiCard as AngularKpiCard } from '@silverpoint/angular/kpi-card';
import { SpBarChart as AngularBarChart } from '@silverpoint/angular/bar-chart';
import { SpStackedBarChart as AngularStackedBarChart } from '@silverpoint/angular/stacked-bar-chart';
import { SpComposedChart as AngularComposedChart } from '@silverpoint/angular/composed-chart';
import { SpWaterfallChart as AngularWaterfallChart } from '@silverpoint/angular/waterfall-chart';
import { SpFunnelChart as AngularFunnelChart } from '@silverpoint/angular/funnel-chart';
import { SpCandlestickChart as AngularCandlestickChart } from '@silverpoint/angular/candlestick-chart';
import { SpAreaChart as AngularAreaChart } from '@silverpoint/angular/area-chart';
import { SpRangeBandChart as AngularRangeBandChart } from '@silverpoint/angular/range-band-chart';
import { SpStreamChart as AngularStreamChart } from '@silverpoint/angular/stream-chart';
import { SpScatterChart as AngularScatterChart } from '@silverpoint/angular/scatter-chart';
import { SpBubbleChart as AngularBubbleChart } from '@silverpoint/angular/bubble-chart';
import { SpDonutChart as AngularDonutChart } from '@silverpoint/angular/donut-chart';
import { SpRadarChart as AngularRadarChart } from '@silverpoint/angular/radar-chart';
import { SpPolarBarChart as AngularPolarBarChart } from '@silverpoint/angular/polar-bar-chart';
import { SpRadialArcGroup as AngularRadialArcGroup } from '@silverpoint/angular/radial-arc-group';
import { SpRadialRings as AngularRadialRings } from '@silverpoint/angular/radial-rings';
import { SpGaugeArc as AngularGaugeArc } from '@silverpoint/angular/gauge-arc';
import { SpMeterChart as AngularMeterChart } from '@silverpoint/angular/meter-chart';
import { SpCoxcombChart as AngularCoxcombChart } from '@silverpoint/angular/coxcomb-chart';
import { SpWindRose as AngularWindRose } from '@silverpoint/angular/wind-rose';
import { SpVolvelleChart as AngularVolvelleChart } from '@silverpoint/angular/volvelle-chart';
import { SpChordRing as AngularChordRing } from '@silverpoint/angular/chord-ring';
import { SpOrbitChart as AngularOrbitChart } from '@silverpoint/angular/orbit-chart';
import { SpHistogramChart as AngularHistogramChart } from '@silverpoint/angular/histogram-chart';
import { SpEcdfChart as AngularEcdfChart } from '@silverpoint/angular/ecdf-chart';
import { SpBoxPlotChart as AngularBoxPlotChart } from '@silverpoint/angular/box-plot-chart';
import { SpViolinChart as AngularViolinChart } from '@silverpoint/angular/violin-chart';
import { SpRidgelineChart as AngularRidgelineChart } from '@silverpoint/angular/ridgeline-chart';
import { SpBeeswarmChart as AngularBeeswarmChart } from '@silverpoint/angular/beeswarm-chart';
import { SpLollipopChart as AngularLollipopChart } from '@silverpoint/angular/lollipop-chart';
import { SpDumbbellChart as AngularDumbbellChart } from '@silverpoint/angular/dumbbell-chart';
import { SpSlopeChart as AngularSlopeChart } from '@silverpoint/angular/slope-chart';
import { SpBumpChart as AngularBumpChart } from '@silverpoint/angular/bump-chart';
import { SpErrorBarChart as AngularErrorBarChart } from '@silverpoint/angular/error-bar-chart';
import { SpIntervalChart as AngularIntervalChart } from '@silverpoint/angular/interval-chart';
import { SpDivergingBarChart as AngularDivergingBarChart } from '@silverpoint/angular/diverging-bar-chart';
import { SpConnectedScatterChart as AngularConnectedScatterChart } from '@silverpoint/angular/connected-scatter-chart';
import { SpWaffleChart as AngularWaffleChart } from '@silverpoint/angular/waffle-chart';
import { SpMarimekkoChart as AngularMarimekkoChart } from '@silverpoint/angular/marimekko-chart';
import { SpSquarifiedTreemap as AngularSquarifiedTreemap } from '@silverpoint/angular/squarified-treemap';
import { SpSunburstChart as AngularSunburstChart } from '@silverpoint/angular/sunburst-chart';
import { SpTreeChart as AngularTreeChart } from '@silverpoint/angular/tree-chart';
import { SpParallelCoordinatesChart as AngularParallelCoordinatesChart } from '@silverpoint/angular/parallel-coordinates-chart';
import { SpPolarLineChart as AngularPolarLineChart } from '@silverpoint/angular/polar-line-chart';
import { SpPolarScatterChart as AngularPolarScatterChart } from '@silverpoint/angular/polar-scatter-chart';
import { LineChart as ReactLineChart } from '@silverpoint/react/server/line-chart';
import { BulletChart as ReactBulletChart } from '@silverpoint/react/server/bullet-chart';
import { PyramidChart as ReactPyramidChart } from '@silverpoint/react/server/pyramid-chart';
import { HeatmapChart as ReactHeatmapChart } from '@silverpoint/react/server/heatmap-chart';
import { TreemapChart as ReactTreemapChart } from '@silverpoint/react/server/treemap-chart';
import { SankeyChart as ReactSankeyChart } from '@silverpoint/react/server/sankey-chart';
import { ActivityGrid as ReactActivityGrid } from '@silverpoint/react/server/activity-grid';
import { StepChart as ReactStepChart } from '@silverpoint/react/server/step-chart';
import { SparklineRows as ReactSparklineRows } from '@silverpoint/react/server/sparkline-rows';
import { KpiCard as ReactKpiCard } from '@silverpoint/react/server/kpi-card';
import { BarChart as ReactBarChart } from '@silverpoint/react/server/bar-chart';
import { StackedBarChart as ReactStackedBarChart } from '@silverpoint/react/server/stacked-bar-chart';
import { ComposedChart as ReactComposedChart } from '@silverpoint/react/server/composed-chart';
import { WaterfallChart as ReactWaterfallChart } from '@silverpoint/react/server/waterfall-chart';
import { FunnelChart as ReactFunnelChart } from '@silverpoint/react/server/funnel-chart';
import { CandlestickChart as ReactCandlestickChart } from '@silverpoint/react/server/candlestick-chart';
import { AreaChart as ReactAreaChart } from '@silverpoint/react/server/area-chart';
import { RangeBandChart as ReactRangeBandChart } from '@silverpoint/react/server/range-band-chart';
import { StreamChart as ReactStreamChart } from '@silverpoint/react/server/stream-chart';
import { ScatterChart as ReactScatterChart } from '@silverpoint/react/server/scatter-chart';
import { BubbleChart as ReactBubbleChart } from '@silverpoint/react/server/bubble-chart';
import { DonutChart as ReactDonutChart } from '@silverpoint/react/server/donut-chart';
import { RadarChart as ReactRadarChart } from '@silverpoint/react/server/radar-chart';
import { PolarBarChart as ReactPolarBarChart } from '@silverpoint/react/server/polar-bar-chart';
import { RadialArcGroup as ReactRadialArcGroup } from '@silverpoint/react/server/radial-arc-group';
import { RadialRings as ReactRadialRings } from '@silverpoint/react/server/radial-rings';
import { GaugeArc as ReactGaugeArc } from '@silverpoint/react/server/gauge-arc';
import { MeterChart as ReactMeterChart } from '@silverpoint/react/server/meter-chart';
import { CoxcombChart as ReactCoxcombChart } from '@silverpoint/react/server/coxcomb-chart';
import { WindRose as ReactWindRose } from '@silverpoint/react/server/wind-rose';
import { VolvelleChart as ReactVolvelleChart } from '@silverpoint/react/server/volvelle-chart';
import { ChordRing as ReactChordRing } from '@silverpoint/react/server/chord-ring';
import { OrbitChart as ReactOrbitChart } from '@silverpoint/react/server/orbit-chart';
import { HistogramChart as ReactHistogramChart } from '@silverpoint/react/server/histogram-chart';
import { EcdfChart as ReactEcdfChart } from '@silverpoint/react/server/ecdf-chart';
import { BoxPlotChart as ReactBoxPlotChart } from '@silverpoint/react/server/box-plot-chart';
import { ViolinChart as ReactViolinChart } from '@silverpoint/react/server/violin-chart';
import { RidgelineChart as ReactRidgelineChart } from '@silverpoint/react/server/ridgeline-chart';
import { BeeswarmChart as ReactBeeswarmChart } from '@silverpoint/react/server/beeswarm-chart';
import { LollipopChart as ReactLollipopChart } from '@silverpoint/react/server/lollipop-chart';
import { DumbbellChart as ReactDumbbellChart } from '@silverpoint/react/server/dumbbell-chart';
import { SlopeChart as ReactSlopeChart } from '@silverpoint/react/server/slope-chart';
import { BumpChart as ReactBumpChart } from '@silverpoint/react/server/bump-chart';
import { ErrorBarChart as ReactErrorBarChart } from '@silverpoint/react/server/error-bar-chart';
import { IntervalChart as ReactIntervalChart } from '@silverpoint/react/server/interval-chart';
import { DivergingBarChart as ReactDivergingBarChart } from '@silverpoint/react/server/diverging-bar-chart';
import { ConnectedScatterChart as ReactConnectedScatterChart } from '@silverpoint/react/server/connected-scatter-chart';
import { WaffleChart as ReactWaffleChart } from '@silverpoint/react/server/waffle-chart';
import { MarimekkoChart as ReactMarimekkoChart } from '@silverpoint/react/server/marimekko-chart';
import { SquarifiedTreemap as ReactSquarifiedTreemap } from '@silverpoint/react/server/squarified-treemap';
import { SunburstChart as ReactSunburstChart } from '@silverpoint/react/server/sunburst-chart';
import { TreeChart as ReactTreeChart } from '@silverpoint/react/server/tree-chart';
import { ParallelCoordinatesChart as ReactParallelCoordinatesChart } from '@silverpoint/react/server/parallel-coordinates-chart';
import { PolarLineChart as ReactPolarLineChart } from '@silverpoint/react/server/polar-line-chart';
import { PolarScatterChart as ReactPolarScatterChart } from '@silverpoint/react/server/polar-scatter-chart';
import { SpLineChart as VueLineChart } from '@silverpoint/vue/line-chart';
import { SpBulletChart as VueBulletChart } from '@silverpoint/vue/bullet-chart';
import { SpPyramidChart as VuePyramidChart } from '@silverpoint/vue/pyramid-chart';
import { SpHeatmapChart as VueHeatmapChart } from '@silverpoint/vue/heatmap-chart';
import { SpTreemapChart as VueTreemapChart } from '@silverpoint/vue/treemap-chart';
import { SpSankeyChart as VueSankeyChart } from '@silverpoint/vue/sankey-chart';
import { SpActivityGrid as VueActivityGrid } from '@silverpoint/vue/activity-grid';
import { SpStepChart as VueStepChart } from '@silverpoint/vue/step-chart';
import { SpSparklineRows as VueSparklineRows } from '@silverpoint/vue/sparkline-rows';
import { SpKpiCard as VueKpiCard } from '@silverpoint/vue/kpi-card';
import { SpBarChart as VueBarChart } from '@silverpoint/vue/bar-chart';
import { SpStackedBarChart as VueStackedBarChart } from '@silverpoint/vue/stacked-bar-chart';
import { SpComposedChart as VueComposedChart } from '@silverpoint/vue/composed-chart';
import { SpWaterfallChart as VueWaterfallChart } from '@silverpoint/vue/waterfall-chart';
import { SpFunnelChart as VueFunnelChart } from '@silverpoint/vue/funnel-chart';
import { SpCandlestickChart as VueCandlestickChart } from '@silverpoint/vue/candlestick-chart';
import { SpAreaChart as VueAreaChart } from '@silverpoint/vue/area-chart';
import { SpRangeBandChart as VueRangeBandChart } from '@silverpoint/vue/range-band-chart';
import { SpStreamChart as VueStreamChart } from '@silverpoint/vue/stream-chart';
import { SpScatterChart as VueScatterChart } from '@silverpoint/vue/scatter-chart';
import { SpBubbleChart as VueBubbleChart } from '@silverpoint/vue/bubble-chart';
import { SpDonutChart as VueDonutChart } from '@silverpoint/vue/donut-chart';
import { SpRadarChart as VueRadarChart } from '@silverpoint/vue/radar-chart';
import { SpPolarBarChart as VuePolarBarChart } from '@silverpoint/vue/polar-bar-chart';
import { SpRadialArcGroup as VueRadialArcGroup } from '@silverpoint/vue/radial-arc-group';
import { SpRadialRings as VueRadialRings } from '@silverpoint/vue/radial-rings';
import { SpGaugeArc as VueGaugeArc } from '@silverpoint/vue/gauge-arc';
import { SpMeterChart as VueMeterChart } from '@silverpoint/vue/meter-chart';
import { SpCoxcombChart as VueCoxcombChart } from '@silverpoint/vue/coxcomb-chart';
import { SpWindRose as VueWindRose } from '@silverpoint/vue/wind-rose';
import { SpVolvelleChart as VueVolvelleChart } from '@silverpoint/vue/volvelle-chart';
import { SpChordRing as VueChordRing } from '@silverpoint/vue/chord-ring';
import { SpOrbitChart as VueOrbitChart } from '@silverpoint/vue/orbit-chart';
import { SpHistogramChart as VueHistogramChart } from '@silverpoint/vue/histogram-chart';
import { SpEcdfChart as VueEcdfChart } from '@silverpoint/vue/ecdf-chart';
import { SpBoxPlotChart as VueBoxPlotChart } from '@silverpoint/vue/box-plot-chart';
import { SpViolinChart as VueViolinChart } from '@silverpoint/vue/violin-chart';
import { SpRidgelineChart as VueRidgelineChart } from '@silverpoint/vue/ridgeline-chart';
import { SpBeeswarmChart as VueBeeswarmChart } from '@silverpoint/vue/beeswarm-chart';
import { SpLollipopChart as VueLollipopChart } from '@silverpoint/vue/lollipop-chart';
import { SpDumbbellChart as VueDumbbellChart } from '@silverpoint/vue/dumbbell-chart';
import { SpSlopeChart as VueSlopeChart } from '@silverpoint/vue/slope-chart';
import { SpBumpChart as VueBumpChart } from '@silverpoint/vue/bump-chart';
import { SpErrorBarChart as VueErrorBarChart } from '@silverpoint/vue/error-bar-chart';
import { SpIntervalChart as VueIntervalChart } from '@silverpoint/vue/interval-chart';
import { SpDivergingBarChart as VueDivergingBarChart } from '@silverpoint/vue/diverging-bar-chart';
import { SpConnectedScatterChart as VueConnectedScatterChart } from '@silverpoint/vue/connected-scatter-chart';
import { SpWaffleChart as VueWaffleChart } from '@silverpoint/vue/waffle-chart';
import { SpMarimekkoChart as VueMarimekkoChart } from '@silverpoint/vue/marimekko-chart';
import { SpSquarifiedTreemap as VueSquarifiedTreemap } from '@silverpoint/vue/squarified-treemap';
import { SpSunburstChart as VueSunburstChart } from '@silverpoint/vue/sunburst-chart';
import { SpTreeChart as VueTreeChart } from '@silverpoint/vue/tree-chart';
import { SpParallelCoordinatesChart as VueParallelCoordinatesChart } from '@silverpoint/vue/parallel-coordinates-chart';
import { SpPolarLineChart as VuePolarLineChart } from '@silverpoint/vue/polar-line-chart';
import { SpPolarScatterChart as VuePolarScatterChart } from '@silverpoint/vue/polar-scatter-chart';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSSRApp, h, type Component as VueComponent } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { fixtureProps, type Fixture } from './fixtures';
import type { Renderers } from './string-gate';

const REACT: Readonly<Record<string, ComponentType<never>>> = {
  LineChart: ReactLineChart as ComponentType<never>,
  BulletChart: ReactBulletChart as ComponentType<never>,
  PyramidChart: ReactPyramidChart as ComponentType<never>,
  HeatmapChart: ReactHeatmapChart as ComponentType<never>,
  TreemapChart: ReactTreemapChart as ComponentType<never>,
  SankeyChart: ReactSankeyChart as ComponentType<never>,
  ActivityGrid: ReactActivityGrid as ComponentType<never>,
  StepChart: ReactStepChart as ComponentType<never>,
  SparklineRows: ReactSparklineRows as ComponentType<never>,
  KpiCard: ReactKpiCard as ComponentType<never>,
  BarChart: ReactBarChart as ComponentType<never>,
  StackedBarChart: ReactStackedBarChart as ComponentType<never>,
  ComposedChart: ReactComposedChart as ComponentType<never>,
  WaterfallChart: ReactWaterfallChart as ComponentType<never>,
  FunnelChart: ReactFunnelChart as ComponentType<never>,
  CandlestickChart: ReactCandlestickChart as ComponentType<never>,
  AreaChart: ReactAreaChart as ComponentType<never>,
  RangeBandChart: ReactRangeBandChart as ComponentType<never>,
  StreamChart: ReactStreamChart as ComponentType<never>,
  ScatterChart: ReactScatterChart as ComponentType<never>,
  BubbleChart: ReactBubbleChart as ComponentType<never>,
  DonutChart: ReactDonutChart as ComponentType<never>,
  RadarChart: ReactRadarChart as ComponentType<never>,
  PolarBarChart: ReactPolarBarChart as ComponentType<never>,
  RadialArcGroup: ReactRadialArcGroup as ComponentType<never>,
  RadialRings: ReactRadialRings as ComponentType<never>,
  GaugeArc: ReactGaugeArc as ComponentType<never>,
  MeterChart: ReactMeterChart as ComponentType<never>,
  CoxcombChart: ReactCoxcombChart as ComponentType<never>,
  WindRose: ReactWindRose as ComponentType<never>,
  VolvelleChart: ReactVolvelleChart as ComponentType<never>,
  ChordRing: ReactChordRing as ComponentType<never>,
  OrbitChart: ReactOrbitChart as ComponentType<never>,
  HistogramChart: ReactHistogramChart as ComponentType<never>,
  EcdfChart: ReactEcdfChart as ComponentType<never>,
  BoxPlotChart: ReactBoxPlotChart as ComponentType<never>,
  ViolinChart: ReactViolinChart as ComponentType<never>,
  RidgelineChart: ReactRidgelineChart as ComponentType<never>,
  BeeswarmChart: ReactBeeswarmChart as ComponentType<never>,
  LollipopChart: ReactLollipopChart as ComponentType<never>,
  DumbbellChart: ReactDumbbellChart as ComponentType<never>,
  SlopeChart: ReactSlopeChart as ComponentType<never>,
  BumpChart: ReactBumpChart as ComponentType<never>,
  ErrorBarChart: ReactErrorBarChart as ComponentType<never>,
  IntervalChart: ReactIntervalChart as ComponentType<never>,
  DivergingBarChart: ReactDivergingBarChart as ComponentType<never>,
  ConnectedScatterChart: ReactConnectedScatterChart as ComponentType<never>,
  WaffleChart: ReactWaffleChart as ComponentType<never>,
  MarimekkoChart: ReactMarimekkoChart as ComponentType<never>,
  SquarifiedTreemap: ReactSquarifiedTreemap as ComponentType<never>,
  SunburstChart: ReactSunburstChart as ComponentType<never>,
  TreeChart: ReactTreeChart as ComponentType<never>,
  ParallelCoordinatesChart: ReactParallelCoordinatesChart as ComponentType<never>,
  PolarLineChart: ReactPolarLineChart as ComponentType<never>,
  PolarScatterChart: ReactPolarScatterChart as ComponentType<never>,
};
const VUE: Readonly<Record<string, VueComponent>> = {
  LineChart: VueLineChart as VueComponent,
  BulletChart: VueBulletChart as VueComponent,
  PyramidChart: VuePyramidChart as VueComponent,
  HeatmapChart: VueHeatmapChart as VueComponent,
  TreemapChart: VueTreemapChart as VueComponent,
  SankeyChart: VueSankeyChart as VueComponent,
  ActivityGrid: VueActivityGrid as VueComponent,
  StepChart: VueStepChart as VueComponent,
  SparklineRows: VueSparklineRows as VueComponent,
  KpiCard: VueKpiCard as VueComponent,
  BarChart: VueBarChart as VueComponent,
  StackedBarChart: VueStackedBarChart as VueComponent,
  ComposedChart: VueComposedChart as VueComponent,
  WaterfallChart: VueWaterfallChart as VueComponent,
  FunnelChart: VueFunnelChart as VueComponent,
  CandlestickChart: VueCandlestickChart as VueComponent,
  AreaChart: VueAreaChart as VueComponent,
  RangeBandChart: VueRangeBandChart as VueComponent,
  StreamChart: VueStreamChart as VueComponent,
  ScatterChart: VueScatterChart as VueComponent,
  BubbleChart: VueBubbleChart as VueComponent,
  DonutChart: VueDonutChart as VueComponent,
  RadarChart: VueRadarChart as VueComponent,
  PolarBarChart: VuePolarBarChart as VueComponent,
  RadialArcGroup: VueRadialArcGroup as VueComponent,
  RadialRings: VueRadialRings as VueComponent,
  GaugeArc: VueGaugeArc as VueComponent,
  MeterChart: VueMeterChart as VueComponent,
  CoxcombChart: VueCoxcombChart as VueComponent,
  WindRose: VueWindRose as VueComponent,
  VolvelleChart: VueVolvelleChart as VueComponent,
  ChordRing: VueChordRing as VueComponent,
  OrbitChart: VueOrbitChart as VueComponent,
  HistogramChart: VueHistogramChart as VueComponent,
  EcdfChart: VueEcdfChart as VueComponent,
  BoxPlotChart: VueBoxPlotChart as VueComponent,
  ViolinChart: VueViolinChart as VueComponent,
  RidgelineChart: VueRidgelineChart as VueComponent,
  BeeswarmChart: VueBeeswarmChart as VueComponent,
  LollipopChart: VueLollipopChart as VueComponent,
  DumbbellChart: VueDumbbellChart as VueComponent,
  SlopeChart: VueSlopeChart as VueComponent,
  BumpChart: VueBumpChart as VueComponent,
  ErrorBarChart: VueErrorBarChart as VueComponent,
  IntervalChart: VueIntervalChart as VueComponent,
  DivergingBarChart: VueDivergingBarChart as VueComponent,
  ConnectedScatterChart: VueConnectedScatterChart as VueComponent,
  WaffleChart: VueWaffleChart as VueComponent,
  MarimekkoChart: VueMarimekkoChart as VueComponent,
  SquarifiedTreemap: VueSquarifiedTreemap as VueComponent,
  SunburstChart: VueSunburstChart as VueComponent,
  TreeChart: VueTreeChart as VueComponent,
  ParallelCoordinatesChart: VueParallelCoordinatesChart as VueComponent,
  PolarLineChart: VuePolarLineChart as VueComponent,
  PolarScatterChart: VuePolarScatterChart as VueComponent,
};
export const ANGULAR: Readonly<Record<string, Type<unknown>>> = {
  LineChart: AngularLineChart,
  BulletChart: AngularBulletChart,
  PyramidChart: AngularPyramidChart,
  HeatmapChart: AngularHeatmapChart,
  TreemapChart: AngularTreemapChart,
  SankeyChart: AngularSankeyChart,
  ActivityGrid: AngularActivityGrid,
  StepChart: AngularStepChart,
  SparklineRows: AngularSparklineRows,
  KpiCard: AngularKpiCard,
  BarChart: AngularBarChart,
  StackedBarChart: AngularStackedBarChart,
  ComposedChart: AngularComposedChart,
  WaterfallChart: AngularWaterfallChart,
  FunnelChart: AngularFunnelChart,
  CandlestickChart: AngularCandlestickChart,
  AreaChart: AngularAreaChart,
  RangeBandChart: AngularRangeBandChart,
  StreamChart: AngularStreamChart,
  ScatterChart: AngularScatterChart,
  BubbleChart: AngularBubbleChart,
  DonutChart: AngularDonutChart,
  RadarChart: AngularRadarChart,
  PolarBarChart: AngularPolarBarChart,
  RadialArcGroup: AngularRadialArcGroup,
  RadialRings: AngularRadialRings,
  GaugeArc: AngularGaugeArc,
  MeterChart: AngularMeterChart,
  CoxcombChart: AngularCoxcombChart,
  WindRose: AngularWindRose,
  VolvelleChart: AngularVolvelleChart,
  ChordRing: AngularChordRing,
  OrbitChart: AngularOrbitChart,
  HistogramChart: AngularHistogramChart,
  EcdfChart: AngularEcdfChart,
  BoxPlotChart: AngularBoxPlotChart,
  ViolinChart: AngularViolinChart,
  RidgelineChart: AngularRidgelineChart,
  BeeswarmChart: AngularBeeswarmChart,
  LollipopChart: AngularLollipopChart,
  DumbbellChart: AngularDumbbellChart,
  SlopeChart: AngularSlopeChart,
  BumpChart: AngularBumpChart,
  ErrorBarChart: AngularErrorBarChart,
  IntervalChart: AngularIntervalChart,
  DivergingBarChart: AngularDivergingBarChart,
  ConnectedScatterChart: AngularConnectedScatterChart,
  WaffleChart: AngularWaffleChart,
  MarimekkoChart: AngularMarimekkoChart,
  SquarifiedTreemap: AngularSquarifiedTreemap,
  SunburstChart: AngularSunburstChart,
  TreeChart: AngularTreeChart,
  ParallelCoordinatesChart: AngularParallelCoordinatesChart,
  PolarLineChart: AngularPolarLineChart,
  PolarScatterChart: AngularPolarScatterChart,
};

function pick<T>(table: Readonly<Record<string, T>>, chart: string): T {
  const found = table[chart];
  if (!found) throw new Error(`No component for ${chart}`);
  return found;
}

function angularHost(component: Type<unknown>, selector: string, props: Record<string, unknown>): Type<unknown> {
  const bindings = Object.keys(props)
    .map((name) => `[${name}]="props.${name}"`)
    .join(' ');
  return Component({ selector: 'app-root', imports: [component], template: `<${selector} ${bindings}></${selector}>` })(
    class Host {
      props = props;
    },
  );
}

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export const adapterRenderers: Renderers = {
  async react(fixture: Fixture) {
    return renderToStaticMarkup(createElement(pick(REACT, fixture.chart), fixtureProps(fixture) as never));
  },
  async vue(fixture: Fixture) {
    const component = pick(VUE, fixture.chart);
    return renderToString(createSSRApp({ render: () => h(component, fixtureProps(fixture) as Record<string, unknown>) }));
  },
  async angular(fixture: Fixture) {
    const Host = angularHost(pick(ANGULAR, fixture.chart), `sp-${kebab(fixture.chart)}`, fixtureProps(fixture) as Record<string, unknown>);
    return renderApplication(
      (context: BootstrapContext): Promise<ApplicationRef> => bootstrapApplication(Host, { providers: [provideServerRendering()] }, context),
      { document: '<html><head></head><body><app-root></app-root></body></html>' },
    );
  },
};
