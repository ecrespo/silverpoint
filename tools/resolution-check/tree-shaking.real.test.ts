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

/** Field names found only in one chart's demo, for demos whose rows are numbers and nothing else. */
const DEMO_FIELDS: Readonly<Record<string, string>> = { WindRose: 'bearing', OrbitChart: 'markers' };

/**
 * The words of each chart's demo table that no other chart's demo uses: if one appears in a bundle
 * of another chart, that demo was not shaken out.
 */
const DEMO_WORDS: ReadonlyMap<string, readonly string[]> = (() => {
  const context = { id: 'sp-demo-words', width: 320, locale: 'en', emptyState: { text: '', rule: false }, domainPadding: 0.1 };
  const texts = (c: (typeof CATALOG)[number]) => {
    const model = c.recipe.build({}, context);
    return [...model.table.rows.flat(), ...model.geometry.labels.map((l) => l.text)];
  };
  // Split into words: a sankey prints "Search 48" and "Search → Visit", never "Search" alone.
  const words = new Map(CATALOG.map((c) => [c.chart, new Set(texts(c).flatMap((t) => t.split(/[^A-Za-z]+/)).filter((t) => /^[A-Z][a-z]{4,}$/.test(t)))] as const));
  return new Map(
    CATALOG.map((c) => [c.chart, [...(words.get(c.chart) ?? [])].filter((w) => CATALOG.every((o) => o.chart === c.chart || !words.get(o.chart)?.has(w)))] as const),
  );
})();

const ENTRIES = (slug: string) => ({
  'react (client)': `packages/react/dist/${slug}.js`,
  'react (server)': `packages/react/dist/server/${slug}.js`,
  vue: `packages/vue/dist/${slug}.js`,
  angular: `packages/angular/dist/fesm2022/silverpoint-angular-${slug}.mjs`,
});

/**
 * REQ-164, PRD NFR "low adoption cost": a consumer importing one chart pays for that chart. The
 * other recipes, and their demo datasets, must shake out of a one-chart bundle, or the 45 KB
 * budget per chart erodes with every chart the catalog adds.
 */
test('REQ-164 · most demos have words of their own to detect them by', () => {
  expect(CATALOG.filter((c) => (DEMO_WORDS.get(c.chart) ?? []).length > 0 || c.chart in DEMO_FIELDS).length).toBeGreaterThanOrEqual(CATALOG.length / 3);
});

describe.each(CATALOG.map((c) => [c.chart, c] as const))('one-chart bundle of %s', (chart, entry) => {
  test.each(Object.entries(ENTRIES(entry.slug)))('REQ-164 · %s carries no other recipe', async (_adapter, file) => {
    const code = await bundle(file);
    const quoted = (name: string) => code.includes(`"${name}"`) || code.includes(`'${name}'`);
    expect(quoted(chart), `${chart} itself`).toBe(true);
    expect(CATALOG.filter((c) => c.chart !== chart && quoted(c.chart)).map((c) => c.chart)).toEqual([]);
    // Demo datasets built through a call the bundler cannot prove pure — a mapped constant, a helper
    // — stay in every bundle; their field names give them away (seen in Phase 3).
    expect(Object.entries(DEMO_FIELDS).filter(([owner, field]) => owner !== chart && new RegExp(`\\b${field}\\b`).test(code)).map(([owner]) => owner)).toEqual([]);
    expect(CATALOG.filter((c) => c.chart !== chart && (DEMO_WORDS.get(c.chart) ?? []).some(quoted)).map((c) => c.chart)).toEqual([]);
  });
});
