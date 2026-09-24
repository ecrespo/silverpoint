import { DEMO_PROPS, fixtureById, fixtureProps, GALLERY } from '@silverpoint/example-harness';
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
import { LineChart as ServerLineChart } from '@silverpoint/react/server/line-chart';
import { Hydrated } from './hydrated';

/** Every chart a fixture can name, by its chart name. */
const CHARTS = { LineChart, BulletChart, PyramidChart, HeatmapChart, TreemapChart, SankeyChart, ActivityGrid, StepChart, SparklineRows, KpiCard, BarChart, StackedBarChart, ComposedChart, WaterfallChart, FunnelChart, CandlestickChart, AreaChart, RangeBandChart, StreamChart, ScatterChart, BubbleChart } as const;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  if ('gallery' in params) {
    return (
      <main>
        <h1>silverpoint · Next.js (React) · gallery</h1>
        <div className="sp-gallery">
          {GALLERY.map(({ chart, props }) => {
            const Chart = CHARTS[chart as keyof typeof CHARTS];
            return (
              <div className="sp-harness" data-size="md" key={chart}>
                <Chart {...props} />
              </div>
            );
          })}
        </div>
        <Hydrated />
      </main>
    );
  }
  const fixture = fixtureById(params.fixture);
  if (fixture) {
    const FixtureChart = CHARTS[fixture.chart as keyof typeof CHARTS];
    return (
      <main>
        <div className="sp-harness" data-gate="" data-size="md">
          <FixtureChart {...fixtureProps(fixture)} />
        </div>
        <Hydrated />
      </main>
    );
  }
  return (
    <main>
      <h1>silverpoint · Next.js (React)</h1>
      <div className="sp-harness" data-size="md">
        <LineChart {...DEMO_PROPS} />
      </div>
      {/* A React Server Component: pure SVG, no client JavaScript (REQ-104). */}
      <section className="sp-server">
        <ServerLineChart {...DEMO_PROPS} id="sp-demo-server" width={320} height={120} mode="precision" />
      </section>
      <Hydrated />
    </main>
  );
}
