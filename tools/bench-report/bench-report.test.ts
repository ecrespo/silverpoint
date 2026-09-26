import { describe, expect, test } from 'vitest';
import { benchReport, DASHBOARD_BUDGET_MS, GEOMETRY_BUDGET_MS, RENDER_BUDGET_MS } from './bench-report';

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
});
