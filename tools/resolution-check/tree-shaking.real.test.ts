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
describe.each(CATALOG.map((c) => [c.chart, c] as const))('one-chart bundle of %s', (chart, entry) => {
  test.each(Object.entries(ENTRIES(entry.slug)))('REQ-164 · %s carries no other recipe', async (_adapter, file) => {
    const code = await bundle(file);
    const quoted = (name: string) => code.includes(`"${name}"`) || code.includes(`'${name}'`);
    expect(quoted(chart), `${chart} itself`).toBe(true);
    expect(CATALOG.filter((c) => c.chart !== chart && quoted(c.chart)).map((c) => c.chart)).toEqual([]);
  });
});
