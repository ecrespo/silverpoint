import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/example-harness/harness.css';
import { DEMO_PROPS, fixtureById, fixtureProps } from '@silverpoint/example-harness';
import { SilverpointProvider } from '@silverpoint/react';
import { LineChart } from '@silverpoint/react/line-chart';
import { BulletChart } from '@silverpoint/react/bullet-chart';
import { PyramidChart } from '@silverpoint/react/pyramid-chart';
import { HeatmapChart } from '@silverpoint/react/heatmap-chart';
import { TreemapChart } from '@silverpoint/react/treemap-chart';
import { SankeyChart } from '@silverpoint/react/sankey-chart';
import { ActivityGrid } from '@silverpoint/react/activity-grid';
import { LineChart as ServerLineChart } from '@silverpoint/react/server/line-chart';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Every subpath this app imports — the barrel, the client entry and the server entry — must
// resolve the same way under `vite dev` and `vite build` (REQ-033, T-024).
const fixture = fixtureById(new URLSearchParams(location.search).get('fixture'));

/** Every chart a fixture can name, by its chart name. */
const CHARTS = { LineChart, BulletChart, PyramidChart, HeatmapChart, TreemapChart, SankeyChart, ActivityGrid } as const;

function App() {
  if (fixture) {
    const FixtureChart = CHARTS[fixture.chart as keyof typeof CHARTS];
    return (
      <main>
        <div className="sp-harness" data-gate="" data-size="md">
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
