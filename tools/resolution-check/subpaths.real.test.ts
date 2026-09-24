import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const repo = fileURLToPath(new URL('../..', import.meta.url));
// Resolve as an app would: from the bench's own node_modules.
const resolve = createRequire(join(repo, 'examples/vite-react/package.json')).resolve;

/** Relative imports a built module makes, to check it does not drag the barrel in. */
function relativeImports(file: string): string[] {
  return [...readFileSync(file, 'utf8').matchAll(/from\s*['"](\.[^'"]+)['"]/g)].map((m) => m[1] as string);
}

describe('per-chart subpaths (REQ-107)', () => {
  test('REQ-107 · @silverpoint/react/line-chart exports LineChart without importing the barrel', async () => {
    const file = resolve('@silverpoint/react/line-chart');
    expect(Object.keys(await import(file))).toContain('LineChart');
    expect(relativeImports(file).some((path) => /\/index\.js$/.test(path))).toBe(false);
  });

  test('REQ-107 · @silverpoint/react/server/line-chart is its own entry', async () => {
    const file = resolve('@silverpoint/react/server/line-chart');
    expect(file).toMatch(/dist\/server\/line-chart\.js$/);
    expect(relativeImports(file).some((path) => /index\.js$/.test(path))).toBe(false);
  });

  test('REQ-107 · @silverpoint/vue/line-chart exports SpLineChart without importing the barrel', () => {
    const file = createRequire(join(repo, 'examples/vite-vue/package.json')).resolve('@silverpoint/vue/line-chart');
    expect(readFileSync(file, 'utf8')).toMatch(/SpLineChart/);
    expect(relativeImports(file).some((path) => /\/index\.js$/.test(path))).toBe(false);
  });

  test('REQ-107 · @silverpoint/angular/line-chart is a secondary entry point of its own', () => {
    const file = createRequire(join(repo, 'examples/angular/package.json')).resolve('@silverpoint/angular/line-chart');
    expect(file).toMatch(/fesm2022\/silverpoint-angular-line-chart\.mjs$/);
    expect(dirname(file)).toMatch(/dist\/fesm2022$/);
  });
});
