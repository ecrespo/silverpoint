import { describe, expect, test } from 'vitest';
import { dashboardMatrix } from '../visual-gate/dashboard-fixtures';
import { DASHBOARD_HTML_BUDGET, dashboardWeightProblems, measureDashboardHtml } from './measure';

/** T-119: the weight of the 12-card reference dashboard's server HTML (API Spec §12, DD-007). */
describe('dashboard weight', () => {
  const ops = dashboardMatrix().filter((f) => f.dashboard === 'ops');

  test('API Spec §12 · the budget is 480 KB of server HTML for the ops reference dashboard', () => {
    expect(DASHBOARD_HTML_BUDGET).toBe(480 * 1_024);
    // Four silverpoint substrates and cyanotype's one, in both modes (Data Model §5, delta-012).
    expect(ops).toHaveLength(10);
  });

  test('API Spec §12 · NFR · ops stays under 480 KB in every ground, substrate and mode', () => {
    for (const fixture of ops) expect(measureDashboardHtml(fixture), fixture.id).toBeLessThanOrEqual(DASHBOARD_HTML_BUDGET);
    expect(dashboardWeightProblems()).toEqual([]);
  });

  test('API Spec §12 · a lowered budget fails, naming the fixtures over it', () => {
    const problems = dashboardWeightProblems(100 * 1_024);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.join(' ')).toMatch(/ops--silverpoint--/);
  });
});
