import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { CATALOG } from '../visual-gate/catalog';

const repo = fileURLToPath(new URL('../..', import.meta.url));
// Resolve as an app would: from the bench's own node_modules.
const resolve = createRequire(join(repo, 'examples/vite-react/package.json')).resolve;

/** Relative imports a built module makes, to check it does not drag the barrel in. */
function relativeImports(file: string): string[] {
  return [...readFileSync(file, 'utf8').matchAll(/from\s*['"](\.[^'"]+)['"]/g)].map((m) => m[1] as string);
}

describe.each(CATALOG.map((c) => [c.slug, c] as const))('per-chart subpaths of %s (REQ-107)', (slug, { chart }) => {
  test(`REQ-107 · @silverpoint/react/${slug} exports ${chart} without importing the barrel`, async () => {
    const file = resolve(`@silverpoint/react/${slug}`);
    expect(Object.keys(await import(file))).toContain(chart);
    expect(relativeImports(file).some((path) => /\/index\.js$/.test(path))).toBe(false);
  });

  test(`REQ-107 · @silverpoint/react/server/${slug} is its own entry`, async () => {
    const file = resolve(`@silverpoint/react/server/${slug}`);
    expect(file).toMatch(new RegExp(`dist/server/${slug}\\.js$`));
    expect(Object.keys(await import(file))).toContain(chart);
    expect(relativeImports(file).some((path) => /index\.js$/.test(path))).toBe(false);
  });

  test(`REQ-107 · @silverpoint/vue/${slug} exports Sp${chart} without importing the barrel`, () => {
    const file = createRequire(join(repo, 'examples/vite-vue/package.json')).resolve(`@silverpoint/vue/${slug}`);
    expect(readFileSync(file, 'utf8')).toMatch(new RegExp(`Sp${chart}`));
    expect(relativeImports(file).some((path) => /\/index\.js$/.test(path))).toBe(false);
  });

  test(`REQ-107 · @silverpoint/angular/${slug} is a secondary entry point of its own`, () => {
    const file = createRequire(join(repo, 'examples/angular/package.json')).resolve(`@silverpoint/angular/${slug}`);
    expect(file).toMatch(new RegExp(`fesm2022/silverpoint-angular-${slug}\\.mjs$`));
    expect(dirname(file)).toMatch(/dist\/fesm2022$/);
  });
});
