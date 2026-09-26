import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { DASHBOARDS } from './catalog';
import { canonicalDashboardFor } from './dashboard-canonical';
import { dashboardMatrix, loadDashboardFixtures } from './dashboard-fixtures';
import { FIXTURES_DIR } from './fixtures';

/** T-115: the dashboard fixtures of Data Model §5 (REQ-210, REQ-182). */
describe('dashboard fixtures', () => {
  const committed = loadDashboardFixtures();

  test('REQ-182 · the catalog lists the three reference dashboards, which every gate iterates', () => {
    expect(DASHBOARDS).toEqual(['kpi-strip', 'ops', 'mixed-spans']);
  });

  test('REQ-210 · REQ-028 · 30 fixtures: 3 dashboards × (4 silverpoint substrates + cyanotype) × 2 modes, at ssrWidth 1280', () => {
    expect(committed).toHaveLength(30);
    expect(committed.filter((f) => f.ground === 'cyanotype').map((f) => f.id)).toEqual(
      ['kpi-strip', 'mixed-spans', 'ops'].flatMap((d) => ['ink', 'precision'].map((m) => `${d}--cyanotype--prussian--${m}`)),
    );
    expect(committed).toEqual([...dashboardMatrix()].sort((a, b) => (a.id < b.id ? -1 : 1)));
    for (const fixture of committed) expect(fixture.ssrWidth).toBe(1280);
  });

  test('REQ-210 · every committed canonical render is current: the core alone draws it', () => {
    for (const fixture of committed) {
      expect(readFileSync(`${FIXTURES_DIR}/${fixture.canonical}`, 'utf8'), fixture.id).toBe(canonicalDashboardFor(fixture));
    }
  });

  test('REQ-212 · the fixture’s substrate and mode are set on the dashboard, and reach every chart', () => {
    const fixture = committed.find((f) => f.id === 'ops--silverpoint--ochre--precision')!;
    const canonical = readFileSync(`${FIXTURES_DIR}/${fixture.canonical}`, 'utf8');
    expect(canonical.match(/<svg [^>]*data-substrate="ochre"/g)).toHaveLength(12);
    expect(canonical.match(/<svg [^>]*data-mode="precision"/g)).toHaveLength(12);
  });
});
