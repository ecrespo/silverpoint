import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rolldown } from 'rolldown';
import { describe, expect, test } from 'vitest';
import { CATALOG } from '../visual-gate/catalog';

const repo = fileURLToPath(new URL('../..', import.meta.url));

/** Bundles one published entry as a consumer's bundler would, frameworks left external. */
async function bundle(entry: string): Promise<string> {
  const build = await rolldown({
    input: join(repo, entry),
    external: [/^react/, /^vue/, /^@angular\//, /^rxjs/, 'tslib'],
    logLevel: 'silent',
  });
  const { output } = await build.generate({ format: 'esm' });
  return output.map((chunk) => ('code' in chunk ? chunk.code : '')).join('\n');
}

/** Each chart's demo module source, or `''` for a chart without one. */
const DEMO_SOURCE: ReadonlyMap<string, string> = new Map(
  CATALOG.map((c) => {
    const file = join(repo, 'packages/core/src/charts', c.slug, 'demo.ts');
    return [c.chart, existsSync(file) ? readFileSync(file, 'utf8') : ''] as const;
  }),
);
const literals = (source: string) => new Set([...source.matchAll(/'([^'\\\n]{3,})'/g)].map((m) => m[1] as string));

/** The string literals of the library itself, demos aside: a demo's "Home" is also a key name. */
const LIBRARY = (() => {
  const found = new Set<string>();
  for (const pkg of ['core', 'react', 'vue', 'angular']) {
    for (const file of readdirSync(join(repo, 'packages', pkg), { recursive: true, encoding: 'utf8' })) {
      if (!/\.(ts|tsx|vue)$/.test(file) || file.endsWith('demo.ts') || /(^|\/)(node_modules|dist|test)\//.test(file)) continue;
      for (const text of literals(readFileSync(join(repo, 'packages', pkg, file), 'utf8'))) found.add(text);
    }
  }
  return found;
})();

/**
 * What gives each chart's demo away in a bundle (Phase 3 final review, I-6: words of the demo's
 * table missed 18 charts). Two signals: the names its module exports (`CHORD_RING_DEMO`), which a
 * bundler keeps in unminified output unless it inlines the constant; and the string literals of
 * its rows that no other demo uses, which survive inlining.
 */
const DEMO_SIGNS: ReadonlyMap<string, { readonly names: readonly string[]; readonly strings: readonly string[] }> = new Map(
  CATALOG.map((c) => {
    const source = DEMO_SOURCE.get(c.chart) ?? '';
    const names = [...source.matchAll(/^export const (\w+)/gm)].map((m) => m[1] as string);
    const strings = [...literals(source)].filter((text) => !LIBRARY.has(text) && CATALOG.every((o) => o.chart === c.chart || !literals(DEMO_SOURCE.get(o.chart) ?? '').has(text)));
    return [c.chart, { names, strings }] as const;
  }),
);

const ENTRIES = (slug: string) => ({
  'react (client)': `packages/react/dist/${slug}.js`,
  'react (server)': `packages/react/dist/server/${slug}.js`,
  vue: `packages/vue/dist/${slug}.js`,
  angular: `packages/angular/dist/fesm2022/silverpoint-angular-${slug}.mjs`,
});

/** Whether a bundle carries `chart`'s demo dataset. */
function carriesDemo(chart: string, code: string): boolean {
  const signs = DEMO_SIGNS.get(chart);
  if (!signs) return false;
  return signs.names.some((name) => new RegExp(`\\b${name}\\b`).test(code)) || signs.strings.some((text) => code.includes(`"${text}"`) || code.includes(`'${text}'`));
}

/** The charts without a demo dataset: a scalar reads one number, shared by the scalar family. */
const NO_DATASET = ['GaugeArc', 'MeterChart'];

// Phase 3 final review (I-6): the leak check below is only as good as this detector, so it must
// find every chart's demo in that chart's own bundle — otherwise its absence elsewhere proves nothing.
test('REQ-164 · every chart but the scalars has a demo module to detect it by', () => {
  expect(CATALOG.filter((c) => (DEMO_SIGNS.get(c.chart)?.names ?? []).length === 0).map((c) => c.chart)).toEqual(NO_DATASET);
});

test.each(CATALOG.filter((c) => !NO_DATASET.includes(c.chart)).map((c) => [c.chart, c.slug] as const))(
  'REQ-164 · the demo of %s is detected in its own bundle',
  async (chart, slug) => {
    expect(carriesDemo(chart, await bundle(`packages/react/dist/${slug}.js`))).toBe(true);
  },
);

/**
 * REQ-164, PRD NFR "low adoption cost": a consumer importing one chart pays for that chart. The
 * other recipes, and their demo datasets, must shake out of a one-chart bundle, or the 45 KB
 * budget per chart erodes with every chart the catalog adds.
 */
describe.each(CATALOG.map((c) => [c.chart, c] as const))('one-chart bundle of %s', (chart, entry) => {
  test.each(Object.entries(ENTRIES(entry.slug)))('REQ-164 · %s carries no other recipe', async (_adapter, file) => {
    const code = await bundle(file);
    const quoted = (name: string) => code.includes(`"${name}"`) || code.includes(`'${name}'`);
    expect(quoted(chart), `${chart} itself`).toBe(true);
    expect(CATALOG.filter((c) => c.chart !== chart && quoted(c.chart)).map((c) => c.chart)).toEqual([]);
    // Demo datasets built through a call the bundler cannot prove pure — a mapped constant, a helper
    // — stay in every bundle (seen in Phase 3).
    expect(CATALOG.filter((c) => c.chart !== chart && carriesDemo(c.chart, code)).map((c) => c.chart)).toEqual([]);
  });
});
