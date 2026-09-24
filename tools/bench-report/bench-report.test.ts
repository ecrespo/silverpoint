import { describe, expect, test } from 'vitest';
import { benchReport, GEOMETRY_BUDGET_MS } from './bench-report';

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
    expect(report.markdown).toContain('| FunnelChart | 3.500 | 7.000 | 500 | **over** |');
    expect(report.markdown).toContain('| LineChart | 0.260 | 0.520 | 500 | within |');
  });

  test('TD §2 · a run without benchmarks is reported as such, never as a pass', () => {
    const report = benchReport({ testResults: [] });
    expect(report.rows).toEqual([]);
    expect(report.markdown).toMatch(/no benchmark results/i);
  });
});
