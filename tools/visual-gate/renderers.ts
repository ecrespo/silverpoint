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
};
const ANGULAR: Readonly<Record<string, Type<unknown>>> = {
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
