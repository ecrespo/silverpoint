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

describe('the provider subpath (#21)', () => {
  test('REQ-107 · #21 · @silverpoint/react/provider is a client entry of its own, sharing the charts\' context and not the barrel', async () => {
    const file = resolve('@silverpoint/react/provider');
    expect(file).toMatch(/dist\/provider\.js$/);
    expect(Object.keys(await import(file))).toEqual(['SilverpointProvider']);
    expect(readFileSync(file, 'utf8')).toMatch(/^['"]use client['"];/);
    expect(relativeImports(file).some((path) => /\/index\.js$/.test(path))).toBe(false);
    // One context for both: the chunk that creates it is imported by the provider and by a chart.
    const chunks = (path: string) => [...readFileSync(path, 'utf8').matchAll(/(?:from|import)\s*['"](\.[^'"]+)['"]/g)].map((m) => m[1] as string);
    const creates = (path: string) => /createContext\(/.test(readFileSync(join(dirname(file), path), 'utf8'));
    const context = chunks(file).filter(creates);
    expect(context).toHaveLength(1);
    expect(chunks(resolve('@silverpoint/react/line-chart'))).toContain(context[0]);
  });
});

describe('the stylesheet as text (#19)', () => {
  test('#19 · @silverpoint/grounds/styles-text is the published stylesheet, as a string', async () => {
    const file = resolve('@silverpoint/grounds/styles-text');
    expect(file).toMatch(/dist\/styles-text\.js$/);
    const { default: text } = (await import(file)) as { default: string };
    expect(text).toBe(readFileSync(resolve('@silverpoint/grounds/styles.css'), 'utf8'));
    expect(readFileSync(file.replace(/\.js$/, '.d.ts'), 'utf8')).toMatch(/export default/);
  });
});
