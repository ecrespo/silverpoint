/**
 * Writes the fixture matrix and its canonical renders.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate canonical
 *
 * Regenerating a canonical file changes the normalised SVG output, which is never a patch
 * (API Spec §13): commit it deliberately, with a changeset that says so.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { canonicalFor, FIXTURES_DIR, fixtureId, SIZES, type Fixture } from './fixtures';

/** The PR matrix of Phase 0: the line chart × 2 modes × 4 substrates at `md`. */
function matrix(): Fixture[] {
  const fixtures: Fixture[] = [];
  for (const mode of ['ink', 'precision'] as const) {
    for (const substrate of ['cream', 'green', 'blue', 'ochre']) {
      const cell = { chart: 'LineChart', ground: 'silverpoint', substrate, mode, hatchFill: 'tile', size: SIZES.md } as const;
      const id = fixtureId(cell);
      fixtures.push({
        ...cell,
        id,
        req: 'REQ-060',
        seed: 1592,
        props: { title: 'Throughput per hour', badge: 'Live', value: 88, unit: 'requests', footerLeft: '00–22 h', footerRight: 'silverpoint' },
        data: null,
        canonical: `line-chart/${id}.canonical.txt`,
      });
    }
  }
  return fixtures;
}

for (const fixture of matrix()) {
  const json = join(FIXTURES_DIR, dirname(fixture.canonical), `${fixture.id}.fixture.json`);
  mkdirSync(dirname(json), { recursive: true });
  writeFileSync(json, `${JSON.stringify(fixture, null, 2)}\n`);
  writeFileSync(join(FIXTURES_DIR, fixture.canonical), canonicalFor(fixture));
  console.log(`wrote ${fixture.id}`);
}
