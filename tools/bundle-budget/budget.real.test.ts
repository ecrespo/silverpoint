import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { UI_COMPONENTS } from '../../packages/core/src/ui';
import { CATALOG } from '../visual-gate/catalog';

const repo = fileURLToPath(new URL('../..', import.meta.url));
const bin = join(repo, 'node_modules/.bin/size-limit');

interface Entry { name: string; path?: string; import?: string | Record<string, string>; limit?: string; gzip?: boolean; ignore?: string[] }
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
    const packages = ['core', 'grounds', 'react', 'vue', 'angular', 'fonts', 'tailwind'];
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

  /**
   * REQ-444 (feature-003, API Spec delta §12): what a release adds must shake out of every existing
   * chart's build. Each one-chart build is held to its size in `0.6.0` (`one-chart-0.6.0.json`,
   * measured on a v0.6.0 worktree, all 60 charts) within an allowance — minified, not gzipped: code
   * that grows grows there, while gzip moves by tens of bytes when the bundler only reorders modules
   * (seen with wave 2). For `0.7.0` the allowance is 2 KB: it holds the palette on the chart path
   * (`resolvePalette`, `paletteStyle`, the SP023 check, Angular's `palette` input and nested
   * `provideSilverpoint`), measured at up to 1.9 KB against 0.3.0 (OQ-C3, user decision 2026-10-19).
   * From 0.7.0 on it is 0.25 KB again. The 45 KB budgets above stay min+gzip.
   */
  const ALLOWANCE = 2000;
  test('REQ-444 · no existing one-chart build grows by more than the allowance, minified, against 0.6.0', () => {
    const record = JSON.parse(readFileSync(join(repo, 'tools/bundle-budget/one-chart-0.6.0.json'), 'utf8')) as { minified: Record<string, number> };
    const dir = mkdtempSync(join(repo, '.size-limit-'));
    try {
      const file = join(dir, 'minified.json');
      // The same entries, uncompressed (size-limit compresses with brotli unless told not to) and
      // unbudgeted; paths absolute, as the config sits elsewhere.
      const absolute = (e: Entry) => ({
        ...e,
        ...(e.path ? { path: join(repo, e.path) } : {}),
        ...(typeof e.import === 'object' ? { import: Object.fromEntries(Object.entries(e.import).map(([f, names]) => [join(repo, f), names])) } : {}),
      });
      writeFileSync(file, JSON.stringify(config.filter((e) => e.name in record.minified).map(({ limit: _limit, ...e }) => ({ ...absolute(e), gzip: false, brotli: false }))));
      const sizes = new Map(sizeLimit(file).results.map((r) => [r.name, r.size]));
      const grown = Object.entries(record.minified).flatMap(([name, before]) => {
        const now = sizes.get(name);
        if (now === undefined) return [`${name}: no longer measured`];
        return now - before > ALLOWANCE ? [`${name}: ${before} B → ${now} B (+${now - before} B)`] : [];
      });
      expect(Object.keys(record.minified).length).toBeGreaterThanOrEqual(60 * 4);
      expect(grown).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);

  /** The components of feature-004, and where each adapter builds their subpaths (REQ-518). */
  const FEATURE_004 = UI_COMPONENTS.filter((row) => ['A1', 'A2', 'B'].includes(row.batch));
  const uiPath = (adapter: 'react' | 'vue' | 'angular', slug: string) =>
    adapter === 'angular' ? `packages/angular/dist/fesm2022/silverpoint-angular-ui-${slug}.mjs` : `packages/${adapter}/dist/ui/${slug}.js`;

  test('REQ-518 · every new component is budgeted in every adapter: the UI runtime and 3 KB, an overlay 4 KB more', () => {
    expect(FEATURE_004).toHaveLength(21);
    const wrong = FEATURE_004.flatMap((row) =>
      (['react', 'vue', 'angular'] as const).flatMap((adapter) => {
        const entry = config.find((e) => e.path === uiPath(adapter, row.slug));
        const limit = row.family === 'overlay' ? '15 kB' : '11 kB';
        // Measured as 0.3.0's rows are: gzip, the framework left out.
        const like = config.find((e) => e.path === uiPath(adapter, 'skeleton'));
        const same = entry?.gzip === true && JSON.stringify(entry.ignore) === JSON.stringify(like?.ignore);
        return entry?.limit === limit && entry.import === `{ ${row.component} }` && same ? [] : [`${adapter} ${row.slug}: ${entry?.limit ?? 'none'}`];
      }),
    );
    expect(wrong).toEqual([]);
  });

  test("REQ-518 · Angular's overlay runtime, an entry of its own, is budgeted at the UI runtime and 4 KB; ui.css at 24 KB, timeline.css at 6 KB", () => {
    const overlay = config.find((e) => e.path === 'packages/angular/dist/fesm2022/silverpoint-angular-ui-overlay.mjs');
    expect(overlay?.limit).toBe('12 kB');
    expect(overlay?.ignore).toEqual(config.find((e) => e.path?.endsWith('silverpoint-angular-ui-skeleton.mjs'))?.ignore);
    expect(config.find((e) => e.path === 'packages/grounds/dist/ui.css')?.limit).toBe('24 kB');
    expect(config.find((e) => e.path === 'packages/grounds/dist/timeline.css')?.limit).toBe('6 kB');
  });

  /** One ink of each preset but silverpoint's, whose values are the ground's own. */
  const PRESET_INKS = ['#8A3A24', '#6B4C2C', '#3C4858', '#2C6355', '#3A4884'];
  /** The bundle size-limit builds for an entry, as text. */
  function bundled(entry: Entry): string {
    const dir = mkdtempSync(join(repo, '.size-limit-'));
    try {
      const file = join(dir, 'one.json');
      const out = join(dir, 'bundle');
      const imports = typeof entry.import === 'object' ? Object.fromEntries(Object.entries(entry.import).map(([f, names]) => [join(repo, f), names])) : entry.import;
      writeFileSync(file, JSON.stringify([{ ...entry, ...(entry.path ? { path: join(repo, entry.path) } : {}), ...(imports ? { import: imports } : {}), limit: undefined }]));
      execFileSync(bin, ['--config', file, '--save-bundle', out], { cwd: repo, stdio: 'ignore' });
      const files = execFileSync('find', [out, '-name', '*.js'], { encoding: 'utf8' }).trim().split('\n');
      return files.map((f) => readFileSync(f, 'utf8')).join('\n');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  test('REQ-519 · REQ-463 · a one-chart build, which takes a palette, holds none of the presets', () => {
    // The probe sees a preset when one is imported.
    const control = bundled({ name: 'control', path: 'packages/core/dist/palettes.js', import: '{ sanguine }' }).toUpperCase();
    expect(control).toContain('#8A3A24');
    const leaks = ['@silverpoint/react + core, LineChart (client)', '@silverpoint/vue + core, SpLineChart', '@silverpoint/angular + core, SpLineChart'].flatMap((name) => {
      const code = bundled(config.find((e) => e.name === name)!).toUpperCase();
      return PRESET_INKS.filter((ink) => code.includes(ink)).map((ink) => `${name}: ${ink}`);
    });
    expect(leaks).toEqual([]);
  }, 120_000);
});
