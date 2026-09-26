import { NgComponentOutlet, PlatformLocation } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, type Type } from '@angular/core';
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
import { SpDonutChart } from '@silverpoint/angular/donut-chart';
import { SpRadarChart } from '@silverpoint/angular/radar-chart';
import { SpPolarBarChart } from '@silverpoint/angular/polar-bar-chart';
import { SpRadialArcGroup } from '@silverpoint/angular/radial-arc-group';
import { SpRadialRings } from '@silverpoint/angular/radial-rings';
import { SpGaugeArc } from '@silverpoint/angular/gauge-arc';
import { SpMeterChart } from '@silverpoint/angular/meter-chart';
import { SpCoxcombChart } from '@silverpoint/angular/coxcomb-chart';
import { SpWindRose } from '@silverpoint/angular/wind-rose';
import { SpVolvelleChart } from '@silverpoint/angular/volvelle-chart';
import { SpChordRing } from '@silverpoint/angular/chord-ring';
import { SpOrbitChart } from '@silverpoint/angular/orbit-chart';
import { DEMO_PROPS, dashboardFixtureById, dashboardFixtureProps, fixtureById, fixtureProps, GALLERY, dashboardPage, sizeOf, wantsGallery } from '@silverpoint/example-harness';
import { SpDashboard, SpDashboardCell } from '@silverpoint/angular/dashboard';

/** Every chart a fixture can name, by its chart name. */
const CHARTS: Readonly<Record<string, Type<unknown>>> = { LineChart: SpLineChart, BulletChart: SpBulletChart, PyramidChart: SpPyramidChart, HeatmapChart: SpHeatmapChart, TreemapChart: SpTreemapChart, SankeyChart: SpSankeyChart, ActivityGrid: SpActivityGrid, StepChart: SpStepChart, SparklineRows: SpSparklineRows, KpiCard: SpKpiCard, BarChart: SpBarChart, StackedBarChart: SpStackedBarChart, ComposedChart: SpComposedChart, WaterfallChart: SpWaterfallChart, FunnelChart: SpFunnelChart, CandlestickChart: SpCandlestickChart, AreaChart: SpAreaChart, RangeBandChart: SpRangeBandChart, StreamChart: SpStreamChart, ScatterChart: SpScatterChart, BubbleChart: SpBubbleChart, DonutChart: SpDonutChart, RadarChart: SpRadarChart, PolarBarChart: SpPolarBarChart, RadialArcGroup: SpRadialArcGroup, RadialRings: SpRadialRings, GaugeArc: SpGaugeArc, MeterChart: SpMeterChart, CoxcombChart: SpCoxcombChart, WindRose: SpWindRose, VolvelleChart: SpVolvelleChart, ChordRing: SpChordRing, OrbitChart: SpOrbitChart };

@Component({
  selector: 'app-root',
  imports: [SpLineChart, SpDashboard, SpDashboardCell, NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dashboard) {
      <main>
        @if (!dashboardGate) {
          <h1>silverpoint · Angular · dashboard</h1>
        }
        <div [attr.class]="dashboardGate ? 'sp-dashboard-harness' : null" [attr.data-gate]="dashboardGate ? '' : null">
          <sp-dashboard
            [id]="dashboard.props.id" [title]="dashboard.props.title" [label]="dashboard.props.label" [description]="dashboard.props.description"
            [layout]="dashboard.props.layout" [link]="dashboard.props.link" [ground]="dashboard.props.ground" [substrate]="dashboard.props.substrate"
            [mode]="dashboard.props.mode" [ssrWidth]="dashboard.props.ssrWidth"
          >
            @for (child of dashboard.children; track child.cell) {
              <sp-dashboard-cell [cell]="child.cell">
                <ng-container *ngComponentOutlet="charts[child.chart]; inputs: child.props" />
              </sp-dashboard-cell>
            }
          </sp-dashboard>
        </div>
      </main>
    } @else if (gate) {
      <main>
        <div class="sp-harness" data-gate="" [attr.data-size]="gate.size">
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
export class App {
  /** The request URL, the same on the server and in the browser: never `location`, which the server has not. */
  private readonly url = inject(PlatformLocation);
  private readonly fixture = fixtureById(new URLSearchParams(this.url.search).get('fixture'));
  private readonly dashboardFixture = dashboardFixtureById(new URLSearchParams(this.url.search).get('dashboard'));
  /** The pixel gate's dashboard fixture, or the `/dashboard` page's reference dashboard (REQ-221). */
  protected readonly dashboard = this.dashboardFixture
    ? dashboardFixtureProps(this.dashboardFixture)
    : this.url.pathname.replace(/\/$/, '') === '/dashboard'
      ? dashboardPage(this.url.search)
      : undefined;
  protected readonly dashboardGate = this.dashboardFixture !== undefined;

  protected readonly gate = this.fixture ? { component: CHARTS[this.fixture.chart] as Type<unknown>, inputs: fixtureProps(this.fixture), size: sizeOf(this.fixture) } : undefined;
  protected readonly gallery = wantsGallery(this.url.search)
    ? GALLERY.map(({ chart, props }) => ({ chart, component: CHARTS[chart] as Type<unknown>, inputs: props }))
    : undefined;
  protected readonly demo = DEMO_PROPS;
  protected readonly charts = CHARTS;
}

