/**
 * The palette gate (T-218, REQ-516, I-25): every adapter server-renders every palette fixture over
 * the published builds and is compared with the fixture's committed canonical render. A UI target
 * is compared as any UI fixture. A chart's palette is on the adapter's `.sp-root` frame and on the
 * core's `<svg>` (`toSVGString`, REQ-461): the trees must agree once that `style` is set aside, and
 * the declarations must be the same.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate palette-gate   (after `pnpm build`)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compareSvg, compareUi, parseSvg } from '../svg-normalizer/normalize';
import { FIXTURES_DIR } from './fixtures';
import { loadPaletteFixtures, paletteChartFixture, paletteUiFixture, type PaletteFixture } from './palette-fixtures';
import { ADAPTERS, markupOf, type Adapter, type GateResult } from './string-gate';

type Comparison = { equal: true } | { equal: false; difference: string };

/** A `style` as its sorted declarations, so spacing and order do not count. */
const declarations = (style: string | undefined): string =>
  (style ?? '')
    .split(';')
    .map((d) => d.trim().replace(/\s*:\s*/, ':'))
    .filter(Boolean)
    .sort()
    .join(';');

/** The `style` of the first `.sp-root` opening tag: every adapter's server render quotes its attributes with `"`. */
function rootStyle(markup: string): string | undefined {
  const open = /<[a-z][\w-]*\b[^>]*\bclass="(?:[^"]*\s)?sp-root(?:\s[^"]*)?"[^>]*>/.exec(markup)?.[0];
  return open === undefined ? undefined : /\sstyle="([^"]*)"/.exec(open)?.[1]?.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

/** An adapter's chart against the core's: the same drawing, and the frame's palette the `<svg>`'s. */
export function comparePaletteChart(markup: string, canonical: string): Comparison {
  const expected = parseSvg(canonical).attrs.find(([name]) => name === 'style')?.[1];
  const tree = compareSvg(
    markup,
    canonical.replace(/<svg\b[^>]*>/, (open) => open.replace(/ style="[^"]*"/, '')),
  );
  if (!tree.equal) return tree;
  const actual = rootStyle(markup);
  if (declarations(actual) !== declarations(expected)) {
    return { equal: false, difference: `.sp-root: style ${JSON.stringify(actual ?? null)} ≠ ${JSON.stringify(expected ?? null)}` };
  }
  return { equal: true };
}

const committed = (fixture: PaletteFixture): string => markupOf(readFileSync(join(FIXTURES_DIR, fixture.canonical), 'utf8'));

export async function runPaletteGate(fixtures: readonly PaletteFixture[]): Promise<GateResult[]> {
  await import('@angular/compiler');
  const { adapterRenderers } = await import('./renderers');
  const { uiRenderers } = await import('./ui-renderers');
  const results: GateResult[] = [];
  for (const fixture of fixtures) {
    const expected = committed(fixture);
    for (const adapter of ADAPTERS as readonly Adapter[]) {
      try {
        const comparison =
          fixture.target === 'line-chart'
            ? comparePaletteChart(await adapterRenderers[adapter](paletteChartFixture(fixture)), expected)
            : compareUi(await uiRenderers[adapter](paletteUiFixture(fixture)), expected);
        results.push(comparison.equal ? { fixture: fixture.id, adapter, equal: true } : { fixture: fixture.id, adapter, ...comparison });
      } catch (error) {
        results.push({ fixture: fixture.id, adapter, equal: false, difference: `render failed: ${(error as Error).message}` });
      }
    }
  }
  return results;
}

async function main(): Promise<void> {
  const results = await runPaletteGate(loadPaletteFixtures());
  for (const r of results) console.log(`${r.equal ? 'ok   ' : 'FAIL '} ${r.adapter.padEnd(8)} ${r.fixture}${r.equal ? '' : `\n      ${r.difference}`}`);
  const failed = results.filter((r) => !r.equal).length;
  console.log(`palette-gate · ${results.length} comparisons · ${failed} failure(s)`);
  process.exit(failed === 0 ? 0 : 1);
}

if (process.argv[1]?.endsWith('palette-gate.ts')) void main();
