/**
 * The Art. 3 tree gate over dashboards (REQ-210, DD-017): every adapter server-renders every
 * dashboard fixture, and each output — wrapper and charts — is compared as a parsed tree with the
 * fixture's committed canonical render. Never adapter against adapter.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate dashboard-gate   (after `pnpm build`)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compareDashboard } from '../svg-normalizer/normalize';
import { loadDashboardFixtures, type DashboardFixture } from './dashboard-fixtures';
import { FIXTURES_DIR } from './fixtures';
import { ADAPTERS, markupOf, type Adapter, type GateResult } from './string-gate';

export type DashboardRenderers = Readonly<Record<Adapter, (fixture: DashboardFixture) => Promise<string>>>;

export async function runDashboardGate(
  fixtures: readonly DashboardFixture[],
  renderers: DashboardRenderers,
  canonicalOf: (fixture: DashboardFixture) => string = (fixture) => markupOf(readFileSync(join(FIXTURES_DIR, fixture.canonical), 'utf8')),
): Promise<GateResult[]> {
  const results: GateResult[] = [];
  for (const fixture of fixtures) {
    const expected = canonicalOf(fixture);
    for (const adapter of ADAPTERS) {
      try {
        const comparison = compareDashboard(await renderers[adapter](fixture), expected);
        results.push(comparison.equal ? { fixture: fixture.id, adapter, equal: true } : { fixture: fixture.id, adapter, ...comparison });
      } catch (error) {
        results.push({ fixture: fixture.id, adapter, equal: false, difference: `render failed: ${(error as Error).message}` });
      }
    }
  }
  return results;
}

async function main(): Promise<void> {
  await import('@angular/compiler');
  const { dashboardRenderers } = await import('./dashboard-renderers');
  const results = await runDashboardGate(loadDashboardFixtures(), dashboardRenderers);
  for (const r of results) console.log(`${r.equal ? 'ok   ' : 'FAIL '} ${r.adapter.padEnd(8)} ${r.fixture}${r.equal ? '' : `\n      ${r.difference}`}`);
  const failed = results.filter((r) => !r.equal).length;
  console.log(`dashboard-gate · ${results.length} comparisons · ${failed} failure(s)`);
  process.exit(failed === 0 ? 0 : 1);
}

if (process.argv[1]?.endsWith('dashboard-gate.ts')) void main();
