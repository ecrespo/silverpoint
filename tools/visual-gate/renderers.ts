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
import { LineChart as ReactLineChart } from '@silverpoint/react/server/line-chart';
import { BulletChart as ReactBulletChart } from '@silverpoint/react/server/bullet-chart';
import { PyramidChart as ReactPyramidChart } from '@silverpoint/react/server/pyramid-chart';
import { HeatmapChart as ReactHeatmapChart } from '@silverpoint/react/server/heatmap-chart';
import { TreemapChart as ReactTreemapChart } from '@silverpoint/react/server/treemap-chart';
import { SankeyChart as ReactSankeyChart } from '@silverpoint/react/server/sankey-chart';
import { ActivityGrid as ReactActivityGrid } from '@silverpoint/react/server/activity-grid';
import { SpLineChart as VueLineChart } from '@silverpoint/vue/line-chart';
import { SpBulletChart as VueBulletChart } from '@silverpoint/vue/bullet-chart';
import { SpPyramidChart as VuePyramidChart } from '@silverpoint/vue/pyramid-chart';
import { SpHeatmapChart as VueHeatmapChart } from '@silverpoint/vue/heatmap-chart';
import { SpTreemapChart as VueTreemapChart } from '@silverpoint/vue/treemap-chart';
import { SpSankeyChart as VueSankeyChart } from '@silverpoint/vue/sankey-chart';
import { SpActivityGrid as VueActivityGrid } from '@silverpoint/vue/activity-grid';
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
};
const VUE: Readonly<Record<string, VueComponent>> = {
  LineChart: VueLineChart as VueComponent,
  BulletChart: VueBulletChart as VueComponent,
  PyramidChart: VuePyramidChart as VueComponent,
  HeatmapChart: VueHeatmapChart as VueComponent,
  TreemapChart: VueTreemapChart as VueComponent,
  SankeyChart: VueSankeyChart as VueComponent,
  ActivityGrid: VueActivityGrid as VueComponent,
};
const ANGULAR: Readonly<Record<string, Type<unknown>>> = {
  LineChart: AngularLineChart,
  BulletChart: AngularBulletChart,
  PyramidChart: AngularPyramidChart,
  HeatmapChart: AngularHeatmapChart,
  TreemapChart: AngularTreemapChart,
  SankeyChart: AngularSankeyChart,
  ActivityGrid: AngularActivityGrid,
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
