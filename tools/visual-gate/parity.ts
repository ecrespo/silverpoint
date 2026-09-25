/**
 * The documentation's parity page (PRD acceptance of REQ-100): a few fixtures, each server-rendered
 * by the three adapters over the published builds, with the string gate's verdict for each.
 *
 * Usage (after `pnpm build`): pnpm --filter @silverpoint/visual-gate parity
 */
import { writeFileSync } from 'node:fs';
import { loadFixtures } from './fixtures';
import { ADAPTERS, runStringGate, type Adapter } from './string-gate';

/** A line, a ring and a flow chart, in three substrates and both modes. */
export const PARITY_FIXTURES = [
  'line-chart--silverpoint--cream--ink--md',
  'donut-chart--silverpoint--ochre--ink--md',
  'sankey-chart--silverpoint--green--precision--md',
];

export interface ParityEntry {
  readonly id: string;
  readonly chart: string;
  /** Each adapter's `<svg>`, as its server renderer wrote it. */
  readonly renders: Readonly<Record<Adapter, string>>;
  /** Whether each equals the fixture's canonical render, as the string gate compares them. */
  readonly equal: Readonly<Record<Adapter, boolean>>;
}

const svgOf = (markup: string) => /<svg\b[\s\S]*<\/svg>/.exec(markup)?.[0] ?? '';

export async function adapterParity(): Promise<ParityEntry[]> {
  await import('@angular/compiler');
  const { adapterRenderers } = await import('./renderers');
  const fixtures = PARITY_FIXTURES.map((id) => {
    const fixture = loadFixtures('full').find((f) => f.id === id);
    if (!fixture) throw new Error(`No fixture ${id}`);
    return fixture;
  });
  const verdicts = await runStringGate(fixtures, adapterRenderers);
  const entries: ParityEntry[] = [];
  for (const fixture of fixtures) {
    const renders = {} as Record<Adapter, string>;
    const equal = {} as Record<Adapter, boolean>;
    for (const adapter of ADAPTERS) {
      renders[adapter] = svgOf(await adapterRenderers[adapter](fixture));
      equal[adapter] = verdicts.find((v) => v.fixture === fixture.id && v.adapter === adapter)?.equal ?? false;
    }
    entries.push({ id: fixture.id, chart: fixture.chart, renders, equal });
  }
  return entries;
}

if (process.argv[1]?.endsWith('parity.ts')) {
  const out = new URL('../../docs/site/generated/parity.json', import.meta.url);
  writeFileSync(out, `${JSON.stringify(await adapterParity(), null, 2)}\n`);
  console.log(`wrote ${out.pathname}`);
}
