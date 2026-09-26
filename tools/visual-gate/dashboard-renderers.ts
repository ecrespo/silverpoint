/**
 * Server renderers of the three adapters for a dashboard fixture (DD-017), over the published
 * builds: React's client `Dashboard` and charts through `renderToStaticMarkup` (the Next.js server
 * pass), Vue's through `@vue/server-renderer`, Angular's through `renderApplication`.
 * `@angular/compiler` must be loaded first, to link the partial-compiled APF bundle.
 */
import { Component, type ApplicationRef } from '@angular/core';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { SpDashboard as AngularDashboard, SpDashboardCell as AngularDashboardCell } from '@silverpoint/angular/dashboard';
import * as ReactCharts from '@silverpoint/react';
import { Dashboard as ReactDashboard, DashboardCell as ReactDashboardCell } from '@silverpoint/react/dashboard';
import * as VueCharts from '@silverpoint/vue';
import { SpDashboard as VueDashboard, SpDashboardCell as VueDashboardCell } from '@silverpoint/vue/dashboard';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSSRApp, h, type Component as VueComponent } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { dashboardFixtureProps, type DashboardFixture } from './dashboard-fixtures';
import { ANGULAR } from './renderers';
import type { Adapter } from './string-gate';

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function pick<T>(table: Readonly<Record<string, unknown>>, name: string): T {
  const found = table[name];
  if (!found) throw new Error(`No component ${name}`);
  return found as T;
}

export const dashboardRenderers: Readonly<Record<Adapter, (fixture: DashboardFixture) => Promise<string>>> = {
  async react(fixture) {
    const { props, children } = dashboardFixtureProps(fixture);
    return renderToStaticMarkup(
      createElement(
        ReactDashboard,
        props as never,
        ...children.map((child) =>
          createElement(ReactDashboardCell, { key: child.cell, cell: child.cell }, createElement(pick<ComponentType<object>>(ReactCharts, child.chart), child.props)),
        ),
      ),
    );
  },
  async vue(fixture) {
    const { props, children } = dashboardFixtureProps(fixture);
    return renderToString(
      createSSRApp({
        render: () =>
          h(VueDashboard as VueComponent, props as Record<string, unknown>, () =>
            children.map((child) => h(VueDashboardCell, { cell: child.cell }, () => [h(pick<VueComponent>(VueCharts, `Sp${child.chart}`), child.props)])),
          ),
      }),
    );
  },
  async angular(fixture) {
    const { props, children } = dashboardFixtureProps(fixture);
    const inputs = (bag: string, values: Readonly<Record<string, unknown>>) =>
      Object.keys(values)
        .map((name) => `[${name}]="${bag}.${name}"`)
        .join(' ');
    const cells = children
      .map((child, index) => `<sp-dashboard-cell cell="${child.cell}"><sp-${kebab(child.chart)} ${inputs(`charts[${index}]`, child.props)} /></sp-dashboard-cell>`)
      .join('');
    const Host = Component({
      selector: 'app-root',
      imports: [AngularDashboard, AngularDashboardCell, ...new Set(children.map((child) => pick(ANGULAR, child.chart)))],
      template: `<sp-dashboard ${inputs('props', props)}>${cells}</sp-dashboard>`,
    })(
      class Host {
        props = props;
        charts = children.map((child) => child.props);
      },
    );
    return renderApplication(
      (context: BootstrapContext): Promise<ApplicationRef> => bootstrapApplication(Host, { providers: [provideServerRendering()] }, context),
      { document: '<html><head></head><body><app-root></app-root></body></html>' },
    );
  },
};
