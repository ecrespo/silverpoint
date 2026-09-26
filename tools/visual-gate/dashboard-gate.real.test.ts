import { describe, expect, test } from 'vitest';
import { DASHBOARDS } from './catalog';
import { runDashboardGate } from './dashboard-gate';
import { loadDashboardFixtures } from './dashboard-fixtures';
import { dashboardRenderers } from './dashboard-renderers';

/** T-116: the Art. 3 tree gate over the dashboard wrapper and its charts (DD-017). */
describe('the dashboard tree gate over the published builds', () => {
  test('REQ-210 · REQ-212 · REQ-028 · every dashboard fixture is identical across 3 adapters × 2 modes × 5 ground substrates', async () => {
    const fixtures = loadDashboardFixtures();
    expect(fixtures).toHaveLength(DASHBOARDS.length * 10);
    const results = await runDashboardGate(fixtures, dashboardRenderers);
    const failures = results.filter((r) => !r.equal).map((r) => `${r.adapter} · ${r.fixture} · ${r.difference}`);
    expect(failures).toEqual([]);
    expect(results).toHaveLength(DASHBOARDS.length * 10 * 3);
  }, 600_000);
});
