import type { ComponentType } from 'react';
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/example-harness/harness.css';
import { DEMO_PROPS, dashboardFixtureById, dashboardFixtureProps, dashboardPage, fixtureById, fixtureProps, GALLERY, sizeOf, wantsGallery, type HarnessDashboard } from '@silverpoint/example-harness';
import { Dashboard, DashboardCell } from '@silverpoint/react/dashboard';
import { SilverpointProvider } from '@silverpoint/react';
import { LineChart } from '@silverpoint/react/line-chart';
import { BulletChart } from '@silverpoint/react/bullet-chart';
import { PyramidChart } from '@silverpoint/react/pyramid-chart';
import { HeatmapChart } from '@silverpoint/react/heatmap-chart';
import { TreemapChart } from '@silverpoint/react/treemap-chart';
import { SankeyChart } from '@silverpoint/react/sankey-chart';
import { ActivityGrid } from '@silverpoint/react/activity-grid';
import { StepChart } from '@silverpoint/react/step-chart';
import { SparklineRows } from '@silverpoint/react/sparkline-rows';
import { KpiCard } from '@silverpoint/react/kpi-card';
import { BarChart } from '@silverpoint/react/bar-chart';
import { StackedBarChart } from '@silverpoint/react/stacked-bar-chart';
import { ComposedChart } from '@silverpoint/react/composed-chart';
import { WaterfallChart } from '@silverpoint/react/waterfall-chart';
import { FunnelChart } from '@silverpoint/react/funnel-chart';
import { CandlestickChart } from '@silverpoint/react/candlestick-chart';
import { AreaChart } from '@silverpoint/react/area-chart';
import { RangeBandChart } from '@silverpoint/react/range-band-chart';
import { StreamChart } from '@silverpoint/react/stream-chart';
import { ScatterChart } from '@silverpoint/react/scatter-chart';
import { BubbleChart } from '@silverpoint/react/bubble-chart';
import { DonutChart } from '@silverpoint/react/donut-chart';
import { RadarChart } from '@silverpoint/react/radar-chart';
import { PolarBarChart } from '@silverpoint/react/polar-bar-chart';
import { RadialArcGroup } from '@silverpoint/react/radial-arc-group';
import { RadialRings } from '@silverpoint/react/radial-rings';
import { GaugeArc } from '@silverpoint/react/gauge-arc';
import { MeterChart } from '@silverpoint/react/meter-chart';
import { CoxcombChart } from '@silverpoint/react/coxcomb-chart';
import { WindRose } from '@silverpoint/react/wind-rose';
import { VolvelleChart } from '@silverpoint/react/volvelle-chart';
import { ChordRing } from '@silverpoint/react/chord-ring';
import { OrbitChart } from '@silverpoint/react/orbit-chart';
import { LineChart as ServerLineChart } from '@silverpoint/react/server/line-chart';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Every subpath this app imports — the barrel, the client entry and the server entry — must
// resolve the same way under `vite dev` and `vite build` (REQ-033, T-024).
const fixture = fixtureById(new URLSearchParams(location.search).get('fixture'));
const dashboardFixture = dashboardFixtureById(new URLSearchParams(location.search).get('dashboard'));

/** Every chart a fixture can name, by its chart name. */
/** Every chart a fixture can name. A fixture's props fit its own chart; the union cannot say so. */
const CHARTS: Readonly<Record<string, ComponentType<Record<string, unknown>>>> = { LineChart, BulletChart, PyramidChart, HeatmapChart, TreemapChart, SankeyChart, ActivityGrid, StepChart, SparklineRows, KpiCard, BarChart, StackedBarChart, ComposedChart, WaterfallChart, FunnelChart, CandlestickChart, AreaChart, RangeBandChart, StreamChart, ScatterChart, BubbleChart, DonutChart, RadarChart, PolarBarChart, RadialArcGroup, RadialRings, GaugeArc, MeterChart, CoxcombChart, WindRose, VolvelleChart, ChordRing, OrbitChart } as unknown as Readonly<Record<string, ComponentType<Record<string, unknown>>>>;

/** A reference dashboard as a consumer writes it: cells by id, a chart in each (API Spec §7.1). */
function ReferenceDashboard({ dashboard }: { dashboard: HarnessDashboard }) {
  return (
    <Dashboard {...dashboard.props}>
      {dashboard.children.map((child) => {
        const Chart = CHARTS[child.chart]!;
        return (
          <DashboardCell key={child.cell} cell={child.cell}>
            <Chart {...child.props} />
          </DashboardCell>
        );
      })}
    </Dashboard>
  );
}

function App() {
  if (dashboardFixture) {
    return (
      <main>
        <div className="sp-dashboard-harness" data-gate="">
          <ReferenceDashboard dashboard={dashboardFixtureProps(dashboardFixture)} />
        </div>
      </main>
    );
  }
  if (location.pathname === '/dashboard') {
    return (
      <main>
        <h1>silverpoint · Vite + React · dashboard</h1>
        <ReferenceDashboard dashboard={dashboardPage(location.search)} />
      </main>
    );
  }
  if (wantsGallery(location.search)) {
    return (
      <main>
        <h1>silverpoint · Vite + React · gallery</h1>
        <div className="sp-gallery">
          {GALLERY.map(({ chart, props }) => {
            const Chart = CHARTS[chart]!;
            return (
              <div className="sp-harness" data-size="md" key={chart}>
                <Chart {...props} />
              </div>
            );
          })}
        </div>
      </main>
    );
  }
  if (fixture) {
    const FixtureChart = CHARTS[fixture.chart]!;
    return (
      <main>
        <div className="sp-harness" data-gate="" data-size={sizeOf(fixture)}>
          <FixtureChart {...fixtureProps(fixture)} />
        </div>
      </main>
    );
  }
  return (
    <SilverpointProvider substrate="cream">
      <main>
        <h1>silverpoint · Vite + React</h1>
        <div className="sp-harness" data-size="md">
          <LineChart {...DEMO_PROPS} />
        </div>
        <section className="sp-server">
          <ServerLineChart {...DEMO_PROPS} id="sp-demo-server" width={320} height={120} mode="precision" />
        </section>
      </main>
    </SilverpointProvider>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
