import { describe, expect, test } from 'vitest';
import { canonicalDashboardMarkup } from './dashboard-canonical';
import { runDashboardGate } from './dashboard-gate';
import { dashboardMatrix } from './dashboard-fixtures';

/** The gate itself, with stand-in renderers: it names the adapter that differs (T-116). */
describe('dashboard gate', () => {
  const [fixture] = dashboardMatrix();

  test('REQ-210 · an adapter that writes the canonical markup passes; one that changes a wrapper attribute fails, alone', async () => {
    const good = async () => canonicalDashboardMarkup(fixture!);
    const bad = async () => canonicalDashboardMarkup(fixture!).replace('part="dashboard-grid"', 'part="grid"');
    const results = await runDashboardGate([fixture!], { react: good, vue: bad, angular: good });
    expect(results.map((r) => [r.adapter, r.equal])).toEqual([
      ['react', true],
      ['vue', false],
      ['angular', true],
    ]);
    expect(results[1]?.difference).toMatch(/part/);
  });

  test('DD-017 · an extra comment in one adapter’s wrapper fails', async () => {
    const good = async () => canonicalDashboardMarkup(fixture!);
    const noisy = async () => canonicalDashboardMarkup(fixture!).replace('<div class="sp-dashboard-grid"', '<!-- noise --><div class="sp-dashboard-grid"');
    const results = await runDashboardGate([fixture!], { react: good, vue: good, angular: noisy });
    expect(results.map((r) => r.equal)).toEqual([true, true, false]);
  });

  test('REQ-210 · a render that throws is a failure, never a pass', async () => {
    const results = await runDashboardGate([fixture!], {
      react: async () => canonicalDashboardMarkup(fixture!),
      vue: async () => {
        throw new Error('boom');
      },
      angular: async () => canonicalDashboardMarkup(fixture!),
    });
    expect(results[1]).toMatchObject({ adapter: 'vue', equal: false });
  });
});
