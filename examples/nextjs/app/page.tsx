import { DEMO_PROPS, fixtureById, fixtureProps, GALLERY } from '@silverpoint/example-harness';
import { LineChart } from '@silverpoint/react/line-chart';
import { BulletChart } from '@silverpoint/react/bullet-chart';
import { PyramidChart } from '@silverpoint/react/pyramid-chart';
import { HeatmapChart } from '@silverpoint/react/heatmap-chart';
import { TreemapChart } from '@silverpoint/react/treemap-chart';
import { SankeyChart } from '@silverpoint/react/sankey-chart';
import { ActivityGrid } from '@silverpoint/react/activity-grid';
import { LineChart as ServerLineChart } from '@silverpoint/react/server/line-chart';
import { Hydrated } from './hydrated';

/** Every chart a fixture can name, by its chart name. */
const CHARTS = { LineChart, BulletChart, PyramidChart, HeatmapChart, TreemapChart, SankeyChart, ActivityGrid } as const;

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
