import '@angular/compiler';
import { Component, type ApplicationRef, type EnvironmentProviders, type Provider, type Type } from '@angular/core';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { lineChart, type LineChartProps } from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import { SpLineChart } from '@silverpoint/angular/line-chart';

/** The canonical render of the line chart, computed by the core pipeline itself. */
export function canonical(props: LineChartProps): string {
  return toSVGString(renderChart(lineChart, props, { id: 'unused' }));
}

/**
 * A host component binding every given input by property, so objects and arrays reach the
 * chart exactly as they would from a consumer template. Built with the JIT compiler.
 */
export function hostFor(chart: Type<unknown>, selector: string, inputs: Record<string, unknown>, extra = ''): Type<unknown> {
  const bindings = Object.keys(inputs)
    .map((name) => `[${name}]="inputs.${name}"`)
    .join(' ');
  return Component({
    selector: 'app-root',
    imports: [chart],
    template: `<${selector} ${bindings} ${extra}></${selector}>`,
  })(
    class Host {
      inputs = inputs;
    },
  );
}

/** Server-renders a chart with @angular/platform-server, as the string gate does (DD-003). */
export function ssrFor(
  chart: Type<unknown>,
  selector: string,
  inputs: Record<string, unknown>,
  providers: (Provider | EnvironmentProviders)[] = [],
): Promise<string> {
  const Host = hostFor(chart, selector, inputs);
  return renderApplication(
    (context: BootstrapContext): Promise<ApplicationRef> =>
      bootstrapApplication(Host, { providers: [provideServerRendering(), ...providers] }, context),
    { document: '<html><head></head><body><app-root></app-root></body></html>' },
  );
}

/** The line chart's host, as the Phase 0 tests use it. */
export function host(inputs: Record<string, unknown>, extra = ''): Type<unknown> {
  return hostFor(SpLineChart, 'sp-line-chart', inputs, extra);
}

/** Server-renders the line chart. */
export function ssr(inputs: Record<string, unknown>, providers: (Provider | EnvironmentProviders)[] = []): Promise<string> {
  return ssrFor(SpLineChart, 'sp-line-chart', inputs, providers);
}
