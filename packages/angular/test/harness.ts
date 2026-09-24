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
export function host(inputs: Record<string, unknown>, extra = ''): Type<unknown> {
  const bindings = Object.keys(inputs)
    .map((name) => `[${name}]="inputs.${name}"`)
    .join(' ');
  return Component({
    selector: 'app-root',
    imports: [SpLineChart],
    template: `<sp-line-chart ${bindings} ${extra}></sp-line-chart>`,
  })(
    class Host {
      inputs = inputs;
    },
  );
}

/** Server-renders the chart with @angular/platform-server, as the string gate does (DD-003). */
export function ssr(inputs: Record<string, unknown>, providers: (Provider | EnvironmentProviders)[] = []): Promise<string> {
  const Host = host(inputs);
  return renderApplication(
    (context: BootstrapContext): Promise<ApplicationRef> =>
      bootstrapApplication(Host, { providers: [provideServerRendering(), ...providers] }, context),
    { document: '<html><head></head><body><app-root></app-root></body></html>' },
  );
}
