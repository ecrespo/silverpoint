import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { CATALOG } from '../visual-gate/catalog';

const repo = fileURLToPath(new URL('../..', import.meta.url));
const bin = join(repo, 'node_modules/.bin/size-limit');

interface Entry { name: string; path?: string; import?: string | Record<string, string>; limit?: string }
interface Result { name: string; passed: boolean; size: number }

function sizeLimit(config?: string): { status: number; results: Result[] } {
  const args = ['--json', ...(config ? ['--config', config] : [])];
  let status = 0;
  let stdout: string;
  try {
    stdout = execFileSync(bin, args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (error) {
    const failure = error as { status: number; stdout: string };
    status = failure.status;
    stdout = failure.stdout;
  }
  const parsed: unknown = JSON.parse(stdout);
  // size-limit reports a failure to measure as `{ "error": "…" }`: show it, not a TypeError.
  if (!Array.isArray(parsed)) throw new Error(`size-limit could not measure: ${JSON.stringify(parsed)}`);
  return { status, results: parsed as Result[] };
}

const config = JSON.parse(readFileSync(join(repo, '.size-limit.json'), 'utf8')) as Entry[];

describe('bundle budgets (size-limit)', () => {
  test('REQ-164 · every package declares a budget', () => {
    const packages = ['core', 'grounds', 'react', 'vue', 'angular', 'fonts'];
    for (const pkg of packages) {
      expect(config.some((e) => e.path?.startsWith(`packages/${pkg}/`) && e.limit), pkg).toBe(true);
    }
  });

  test('REQ-164 · core + react with the line chart is budgeted at 45 KB min+gzip', () => {
    expect(config.find((e) => e.path === 'packages/react/dist/line-chart.js')?.limit).toBe('45 kB');
  });

  test('REQ-164 · every chart of the catalog is budgeted at 45 KB in every adapter', () => {
    const missing = CATALOG.flatMap(({ slug }) =>
      [
        `packages/react/dist/${slug}.js`,
        `packages/react/dist/server/${slug}.js`,
        `packages/vue/dist/${slug}.js`,
        `packages/angular/dist/fesm2022/silverpoint-angular-${slug}.mjs`,
      ].filter((path) => config.find((e) => e.path === path)?.limit !== '45 kB'),
    );
    expect(missing).toEqual([]);
  });

  test('REQ-164 · every budget holds on the built packages', () => {
    const run = sizeLimit();
    expect(run.results.filter((r) => !r.passed).map((r) => `${r.name}: ${r.size} B`)).toEqual([]);
    expect(run.status).toBe(0);
  }, 120_000);

  test('REQ-164 · exceeding a budget breaks the build', () => {
    const dir = mkdtempSync(join(repo, '.size-limit-'));
    try {
      const tight = join(dir, 'tight.json');
      const entry = config.find((e) => e.path === 'packages/react/dist/line-chart.js');
      writeFileSync(tight, JSON.stringify([{ ...entry, path: join(repo, entry?.path ?? ''), limit: '1 kB' }]));
      expect(sizeLimit(tight).status).not.toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);

  /**
   * Each dashboard entry, the one-chart entry it is measured against, and the adapter's allowance
   * in bytes (REQ-220): 2 KB for React and Vue, 3 KB for Angular, whose partial-compilation output
   * carries each component's template and input metadata (TD DD-018, delta-012).
   */
  const DASHBOARD_PAIRS = [
    ['@silverpoint/react + core, Dashboard + LineChart (client)', '@silverpoint/react + core, LineChart (client)', 2000],
    ['@silverpoint/react + core, Dashboard + LineChart (server)', '@silverpoint/react + core, LineChart (server)', 2000],
    ['@silverpoint/vue + core, SpDashboard + SpLineChart', '@silverpoint/vue + core, SpLineChart', 2000],
    ['@silverpoint/angular + core, SpDashboard + SpLineChart', '@silverpoint/angular + core, SpLineChart', 3000],
  ] as const;

  test('REQ-220 · each adapter’s dashboard subpath is budgeted at its one-chart budget plus its allowance', () => {
    for (const [dashboard, alone, allowance] of DASHBOARD_PAIRS) {
      expect(config.find((e) => e.name === alone)?.limit, alone).toBe('45 kB');
      expect(config.find((e) => e.name === dashboard)?.limit, dashboard).toBe(`${45 + allowance / 1000} kB`);
    }
  });

  test('REQ-220 · the dashboard adds no more than its adapter’s allowance over the one-chart build', () => {
    const sizes = new Map(sizeLimit().results.map((r) => [r.name, r.size]));
    const over = DASHBOARD_PAIRS.flatMap(([dashboard, alone, allowance]) => {
      const added = (sizes.get(dashboard) ?? Number.NaN) - (sizes.get(alone) ?? Number.NaN);
      return added <= allowance ? [] : [`${dashboard}: +${added} B > ${allowance} B`];
    });
    expect(over).toEqual([]);
  }, 120_000);

  test('REQ-220 · every dashboard budget holds on the built packages', () => {
    const names = DASHBOARD_PAIRS.map(([dashboard]) => dashboard);
    const results = sizeLimit().results.filter((r) => names.includes(r.name as (typeof names)[number]));
    expect(results.map((r) => r.name).sort()).toEqual([...names].sort());
    expect(results.filter((r) => !r.passed).map((r) => `${r.name}: ${r.size} B`)).toEqual([]);
  }, 120_000);

  test('REQ-220 · exceeding the dashboard budget breaks the build', () => {
    const dir = mkdtempSync(join(repo, '.size-limit-'));
    try {
      const tight = join(dir, 'tight.json');
      const entry = config.find((e) => e.name === DASHBOARD_PAIRS[0][0]);
      const imports = Object.fromEntries(Object.entries((entry?.import ?? {}) as Record<string, string>).map(([file, names]) => [join(repo, file), names]));
      // Lowered to the one-chart build's own size: the dashboard's bytes alone push it over.
      const alone = sizeLimit().results.find((r) => r.name === DASHBOARD_PAIRS[0][1])?.size ?? 0;
      writeFileSync(tight, JSON.stringify([{ ...entry, import: imports, limit: `${alone} B` }]));
      expect(sizeLimit(tight).status).not.toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});
