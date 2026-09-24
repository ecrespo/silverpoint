import '@silverpoint/example-harness/harness.css';
import { DEMO_PROPS, fixtureById, fixtureProps } from '@silverpoint/example-harness';
import { LineChart } from '@silverpoint/react/line-chart';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const fixture = fixtureById(new URLSearchParams(location.search).get('fixture'));

function App() {
  if (fixture) {
    const props = fixtureProps(fixture);
    return (
      <main>
        <div className="sp-harness" data-gate="" data-size="md">
          <LineChart {...props} />
        </div>
      </main>
    );
  }
  return (
    <main>
      <h1>silverpoint · Vite + React</h1>
      <div className="sp-harness" data-size="md">
        <LineChart {...DEMO_PROPS} />
      </div>
    </main>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
