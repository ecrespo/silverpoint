import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { CATALOG } from '../visual-gate/catalog';

const repo = fileURLToPath(new URL('../..', import.meta.url));
const bin = join(repo, 'node_modules/.bin/size-limit');

interface Entry { name: string; path: string; limit?: string }
interface Result { name: string; passed: boolean; size: number }

function sizeLimit(config?: string): { status: number; results: Result[] } {
  const args = ['--json', ...(config ? ['--config', config] : [])];
  try {
    return { status: 0, results: JSON.parse(execFileSync(bin, args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })) };
  } catch (error) {
    const failure = error as { status: number; stdout: string };
    return { status: failure.status, results: JSON.parse(failure.stdout) };
  }
}

const config = JSON.parse(readFileSync(join(repo, '.size-limit.json'), 'utf8')) as Entry[];

describe('bundle budgets (size-limit)', () => {
  test('REQ-164 · every package declares a budget', () => {
    const packages = ['core', 'grounds', 'react', 'vue', 'angular', 'fonts'];
    for (const pkg of packages) {
      expect(config.some((e) => e.path.startsWith(`packages/${pkg}/`) && e.limit), pkg).toBe(true);
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
});
