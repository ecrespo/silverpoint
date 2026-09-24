import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, type Type } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SpLineChart } from '@silverpoint/angular/line-chart';
import { SpBulletChart } from '@silverpoint/angular/bullet-chart';
import { SpPyramidChart } from '@silverpoint/angular/pyramid-chart';
import { SpHeatmapChart } from '@silverpoint/angular/heatmap-chart';
import { SpTreemapChart } from '@silverpoint/angular/treemap-chart';
import { SpSankeyChart } from '@silverpoint/angular/sankey-chart';
import { SpActivityGrid } from '@silverpoint/angular/activity-grid';
import { DEMO_PROPS, fixtureById, fixtureProps } from '@silverpoint/example-harness';

const fixture = fixtureById(new URLSearchParams(location.search).get('fixture'));

/** Every chart a fixture can name, by its chart name. */
const CHARTS: Readonly<Record<string, Type<unknown>>> = { LineChart: SpLineChart, BulletChart: SpBulletChart, PyramidChart: SpPyramidChart, HeatmapChart: SpHeatmapChart, TreemapChart: SpTreemapChart, SankeyChart: SpSankeyChart, ActivityGrid: SpActivityGrid };

@Component({
  selector: 'app-root',
  imports: [SpLineChart, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (gate) {
      <main>
        <div class="sp-harness" data-gate="" data-size="md">
          <ng-container *ngComponentOutlet="gate.component; inputs: gate.inputs" />
        </div>
      </main>
    } @else {
      <main>
        <h1>silverpoint · Angular</h1>
        <div class="sp-harness" data-size="md">
          <sp-line-chart
            [id]="demo.id" [width]="demo.width" [title]="demo.title" [badge]="demo.badge" [value]="demo.value"
            [unit]="demo.unit" [footerLeft]="demo.footerLeft" [footerRight]="demo.footerRight"
          />
        </div>
      </main>
    }
  `,
})
class App {
  protected readonly gate = fixture ? { component: CHARTS[fixture.chart] as Type<unknown>, inputs: fixtureProps(fixture) } : undefined;
  protected readonly demo = DEMO_PROPS;
}

bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] }).catch((error: unknown) => console.error(error));
