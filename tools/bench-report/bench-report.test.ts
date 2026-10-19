import { describe, expect, test } from 'vitest';
import { benchReport, DASHBOARD_BUDGET_MS, FIELD_BUDGET_MS, GEOMETRY_BUDGET_MS, NETWORK_BUDGET_MS, RENDER_BUDGET_MS, SORT_BUDGET_MS, STATS_BUDGET_MS, UI_BUDGET_MS } from './bench-report';

/** The shape `vitest bench --reporter=json` writes: each test case carries its benchmarks. */
const run = (means: Record<string, number>) => ({
  testResults: [
    {
      assertionResults: Object.entries(means).map(([name, mean]) => ({
        title: `geometry of a 100-point ${name}`,
        benchmarks: [{ name, tasks: [{ name, latency: { mean, p99: mean * 2, samplesCount: 500 } }] }],
      })),
    },
  ],
});

describe('bench report (TD §2, run nightly)', () => {
  test('TD §2 · the budget is the NFR: 2 ms of geometry for 100 points', () => {
    expect(GEOMETRY_BUDGET_MS).toBe(2);
  });

  test('TD §2 · one row per benchmark, slowest first, with mean, p99 and the verdict', () => {
    const report = benchReport(run({ LineChart: 0.26, FunnelChart: 3.5 }));
    expect(report.rows.map((r) => r.name)).toEqual(['FunnelChart', 'LineChart']);
    expect(report.over).toEqual(['FunnelChart']);
    expect(report.markdown).toContain('| FunnelChart | 3.500 | 7.000 | 500 | 2 ms | **over** |');
    expect(report.markdown).toContain('| LineChart | 0.260 | 0.520 | 500 | 2 ms | within |');
  });

  test('TD §2 · a run without benchmarks is reported as such, never as a pass', () => {
    const report = benchReport({ testResults: [] });
    expect(report.rows).toEqual([]);
    expect(report.markdown).toMatch(/no benchmark results/i);
  });

  test('TD §2 · a render benchmark is held to 16 ms, a geometry one to 2 ms (T-093)', () => {
    expect(RENDER_BUDGET_MS).toBe(16);
    const report = benchReport(run({ 'render · DonutChart': 9.5, 'render · WindRose': 17, LineChart: 2.5 }));
    expect(report.over.sort()).toEqual(['LineChart', 'render · WindRose']);
    expect(report.markdown).toContain('| render · DonutChart | 9.500 | 19.000 | 500 | 16 ms | within |');
    expect(report.markdown).toContain('| LineChart | 2.500 | 5.000 | 500 | 2 ms | **over** |');
  });

  test('API Spec §12 · resolving a 24-cell dashboard is held to 0.5 ms (T-109)', () => {
    expect(DASHBOARD_BUDGET_MS).toBe(0.5);
    const report = benchReport(run({ 'dashboard · resolve 24 cells': 0.6, 'dashboard · resolve ops': 0.1 }));
    expect(report.over).toEqual(['dashboard · resolve 24 cells']);
    expect(report.markdown).toContain('| dashboard · resolve ops | 0.100 | 0.200 | 500 | 0.5 ms | within |');
  });

  test('REQ-302 · a UI component computation or keyboard transition is held to 0.05 ms (feature-002 T-136)', () => {
    expect(UI_BUDGET_MS).toBe(0.05);
    const report = benchReport(run({ 'ui · uiRovingKey': 0.01, 'ui · uiProgressArc': 0.06 }));
    expect(report.over).toEqual(['ui · uiProgressArc']);
    expect(report.markdown).toContain('| ui · uiRovingKey | 0.010 | 0.020 | 500 | 0.05 ms | within |');
  });

  test('REQ-474 · sorting 10,000 table rows is held to 10 ms (feature-004 T-202)', () => {
    expect(SORT_BUDGET_MS).toBe(10);
    const report = benchReport(run({ 'sort · uiSortRows (10,000 rows)': 6, 'sort · uiSortRows (mixed)': 11 }));
    expect(report.over).toEqual(['sort · uiSortRows (mixed)']);
    expect(report.markdown).toContain('| sort · uiSortRows (10,000 rows) | 6.000 | 12.000 | 500 | 10 ms | within |');
  });

  test('REQ-445 · a statistic over 1 000 observations 4 ms, a 60 × 60 field 8 ms, a 150-node network 16 ms (T-165)', () => {
    expect([STATS_BUDGET_MS, FIELD_BUDGET_MS, NETWORK_BUDGET_MS]).toEqual([4, 8, 16]);
    const report = benchReport(run({ 'stats · bins of 1 000': 3, 'stats · kde of 1 000': 5, 'field · contours 60 × 60': 9, 'network · 150 nodes': 15 }));
    expect(report.over).toEqual(['field · contours 60 × 60', 'stats · kde of 1 000']);
    expect(report.markdown).toContain('| stats · bins of 1 000 | 3.000 | 6.000 | 500 | 4 ms | within |');
    expect(report.markdown).toContain('| network · 150 nodes | 15.000 | 30.000 | 500 | 16 ms | within |');
  });
});
