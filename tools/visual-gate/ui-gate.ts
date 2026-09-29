/**
 * The Art. 3 tree gate over UI components (REQ-327, DD-027): every adapter server-renders every
 * UI fixture, and each output is compared as a parsed tree with the fixture's committed canonical
 * render. Never adapter against adapter.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate ui-gate   (after `pnpm build`)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compareUi } from '../svg-normalizer/normalize';
import { FIXTURES_DIR } from './fixtures';
import { ADAPTERS, markupOf, type Adapter, type GateResult } from './string-gate';
import { loadUiFixtures, type UiFixture } from './ui-fixtures';

export type UiRenderers = Readonly<Record<Adapter, (fixture: UiFixture) => Promise<string>>>;

/** The committed canonical render, as markup: the tree every adapter must write (REQ-327). */
export const committedUi = (fixture: UiFixture): string => markupOf(readFileSync(join(FIXTURES_DIR, fixture.canonical), 'utf8'));

export async function runUiGate(
  fixtures: readonly UiFixture[],
  renderers: UiRenderers,
  expectedOf: (fixture: UiFixture) => string = committedUi,
): Promise<GateResult[]> {
  const results: GateResult[] = [];
  for (const fixture of fixtures) {
    const expected = expectedOf(fixture);
    for (const adapter of ADAPTERS) {
      try {
        const comparison = compareUi(await renderers[adapter](fixture), expected);
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
  const { uiRenderers } = await import('./ui-renderers');
  const results = await runUiGate(loadUiFixtures(), uiRenderers);
  for (const r of results) console.log(`${r.equal ? 'ok   ' : 'FAIL '} ${r.adapter.padEnd(8)} ${r.fixture}${r.equal ? '' : `\n      ${r.difference}`}`);
  const failed = results.filter((r) => !r.equal).length;
  console.log(`ui-gate · ${results.length} comparisons · ${failed} failure(s)`);
  process.exit(failed === 0 ? 0 : 1);
}

if (process.argv[1]?.endsWith('ui-gate.ts')) void main();
