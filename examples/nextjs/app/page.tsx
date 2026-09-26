import { DEMO_PROPS, dashboardFixtureById, dashboardFixtureProps, fixtureById, fixtureProps, GALLERY, sizeOf } from '@silverpoint/example-harness';
import { LineChart } from '@silverpoint/react/line-chart';
import { CHARTS } from './charts';
import { ReferenceDashboard } from './reference-dashboard';
import { LineChart as ServerLineChart } from '@silverpoint/react/server/line-chart';
import { Hydrated } from './hydrated';

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
  const dashboard = dashboardFixtureById(params.dashboard);
  if (dashboard) {
    return (
      <main>
        <div className="sp-dashboard-harness" data-gate="">
          <ReferenceDashboard dashboard={dashboardFixtureProps(dashboard)} />
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
        <div className="sp-harness" data-gate="" data-size={sizeOf(fixture)}>
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
