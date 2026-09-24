import { DEMO_PROPS, fixtureById, fixtureProps } from '@silverpoint/example-harness';
import { LineChart } from '@silverpoint/react/line-chart';
import { LineChart as ServerLineChart } from '@silverpoint/react/server/line-chart';
import { Hydrated } from './hydrated';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const fixture = fixtureById((await searchParams).fixture);
  if (fixture) {
    return (
      <main>
        <div className="sp-harness" data-gate="" data-size="md">
          <LineChart {...fixtureProps(fixture)} />
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
