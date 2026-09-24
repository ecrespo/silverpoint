/**
 * The Art. 3 string gate (REQ-180, DD-003, DD-004): every adapter server-renders every fixture,
 * and each output is compared — as a parsed, normalised tree — with the fixture's committed
 * canonical render. Never adapter against adapter: a failure names the guilty adapter.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate string-gate   (after `pnpm build`)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compareSvg } from '../svg-normalizer/normalize';
import { FIXTURES_DIR, loadFixtures, type Fixture } from './fixtures';

export type Adapter = 'react' | 'vue' | 'angular';
export const ADAPTERS: readonly Adapter[] = ['react', 'vue', 'angular'];
export type Renderers = Readonly<Record<Adapter, (fixture: Fixture) => Promise<string>>>;

export interface GateResult {
  readonly fixture: string;
  readonly adapter: Adapter;
  readonly equal: boolean;
  readonly difference?: string;
}

/** The committed canonical render, turned back into markup the comparison parses. */
function committedCanonical(fixture: Fixture): string {
  return readFileSync(join(FIXTURES_DIR, fixture.canonical), 'utf8');
}

/** Rebuilds markup from the one-node-per-line canonical form, so both sides parse the same way. */
function markupOf(canonical: string): string {
  const out: string[] = [];
  const open: { tag: string; depth: number }[] = [];
  for (const line of canonical.split('\n')) {
    const depth = (line.length - line.trimStart().length) / 2;
    while (open.length > 0 && (open.at(-1)?.depth ?? -1) >= depth) out.push(`</${open.pop()?.tag}>`);
    const text = line.trim();
    if (text.startsWith('"')) {
      out.push((JSON.parse(text) as string).replace(/&/g, '&amp;').replace(/</g, '&lt;'));
      continue;
    }
    const match = /^<([^\s>]+)(.*)>$/.exec(text);
    if (!match) continue;
    const attrs = [...(match[2] ?? '').matchAll(/ ([^=\s]+)=("(?:[^"\\]|\\.)*")/g)]
      .map(([, name, value]) => ` ${name}="${(JSON.parse(value as string) as string).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
      .join('');
    out.push(`<${match[1]}${attrs}>`);
    open.push({ tag: match[1] as string, depth });
  }
  while (open.length > 0) out.push(`</${open.pop()?.tag}>`);
  return out.join('');
}

/** Runs every adapter over every fixture and compares each output with the canonical render. */
export async function runStringGate(
  fixtures: readonly Fixture[],
  renderers: Renderers,
  canonicalOf: (fixture: Fixture) => string = (fixture) => markupOf(committedCanonical(fixture)),
): Promise<GateResult[]> {
  const results: GateResult[] = [];
  for (const fixture of fixtures) {
    const expected = canonicalOf(fixture);
    for (const adapter of ADAPTERS) {
      try {
        const comparison = compareSvg(await renderers[adapter](fixture), expected);
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
  const { adapterRenderers } = await import('./renderers');
  const results = await runStringGate(loadFixtures(), adapterRenderers);
  for (const result of results) {
    console.log(`${result.equal ? 'ok   ' : 'FAIL '} ${result.adapter.padEnd(8)} ${result.fixture}${result.equal ? '' : `\n      ${result.difference}`}`);
  }
  const failed = results.filter((r) => !r.equal).length;
  console.log(`string-gate · ${results.length} comparisons · ${failed} failure(s)`);
  process.exit(failed === 0 ? 0 : 1);
}

if (process.argv[1]?.endsWith('string-gate.ts')) void main();
