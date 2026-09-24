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
import { SpStepChart } from '@silverpoint/angular/step-chart';
import { SpSparklineRows } from '@silverpoint/angular/sparkline-rows';
import { SpKpiCard } from '@silverpoint/angular/kpi-card';
import { SpBarChart } from '@silverpoint/angular/bar-chart';
import { SpStackedBarChart } from '@silverpoint/angular/stacked-bar-chart';
import { SpComposedChart } from '@silverpoint/angular/composed-chart';
import { SpWaterfallChart } from '@silverpoint/angular/waterfall-chart';
import { SpFunnelChart } from '@silverpoint/angular/funnel-chart';
import { SpCandlestickChart } from '@silverpoint/angular/candlestick-chart';
import { SpAreaChart } from '@silverpoint/angular/area-chart';
import { SpRangeBandChart } from '@silverpoint/angular/range-band-chart';
import { SpStreamChart } from '@silverpoint/angular/stream-chart';
import { SpScatterChart } from '@silverpoint/angular/scatter-chart';
import { SpBubbleChart } from '@silverpoint/angular/bubble-chart';
import { DEMO_PROPS, fixtureById, fixtureProps, GALLERY, wantsGallery } from '@silverpoint/example-harness';

const fixture = fixtureById(new URLSearchParams(location.search).get('fixture'));

/** Every chart a fixture can name, by its chart name. */
const CHARTS: Readonly<Record<string, Type<unknown>>> = { LineChart: SpLineChart, BulletChart: SpBulletChart, PyramidChart: SpPyramidChart, HeatmapChart: SpHeatmapChart, TreemapChart: SpTreemapChart, SankeyChart: SpSankeyChart, ActivityGrid: SpActivityGrid, StepChart: SpStepChart, SparklineRows: SpSparklineRows, KpiCard: SpKpiCard, BarChart: SpBarChart, StackedBarChart: SpStackedBarChart, ComposedChart: SpComposedChart, WaterfallChart: SpWaterfallChart, FunnelChart: SpFunnelChart, CandlestickChart: SpCandlestickChart, AreaChart: SpAreaChart, RangeBandChart: SpRangeBandChart, StreamChart: SpStreamChart, ScatterChart: SpScatterChart, BubbleChart: SpBubbleChart };

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
    } @else if (gallery) {
      <main>
        <h1>silverpoint · Angular · gallery</h1>
        <div class="sp-gallery">
          @for (item of gallery; track item.chart) {
            <div class="sp-harness" data-size="md">
              <ng-container *ngComponentOutlet="item.component; inputs: item.inputs" />
            </div>
          }
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
  protected readonly gallery = wantsGallery(location.search)
    ? GALLERY.map(({ chart, props }) => ({ chart, component: CHARTS[chart] as Type<unknown>, inputs: props }))
    : undefined;
  protected readonly demo = DEMO_PROPS;
}

bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] }).catch((error: unknown) => console.error(error));
