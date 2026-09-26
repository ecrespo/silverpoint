import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const root = fileURLToPath(new URL('../..', import.meta.url));
const eslint = new ESLint({ cwd: root });

/** Lints `code` as if it lived at `path` in the repository, and returns the rule ids hit. */
async function rulesHit(path: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: `${root}${path}` });
  return (result?.messages ?? []).map((message) => message.ruleId ?? `fatal: ${message.message}`);
}

describe('no-nondeterminism', () => {
  test('REQ-004 · Math.random() on the render path fails', async () => {
    expect(await rulesHit('packages/core/src/charts/x.ts', 'export const r = Math.random();')).toEqual([
      'silverpoint/no-nondeterminism',
    ]);
  });

  test('REQ-004 · Date.now() and an argument-less new Date() fail in any package', async () => {
    expect(await rulesHit('packages/grounds/src/x.ts', 'export const a = Date.now(); export const b = new Date();')).toEqual([
      'silverpoint/no-nondeterminism',
      'silverpoint/no-nondeterminism',
    ]);
  });

  test('REQ-004 · a pinned date is deterministic and passes', async () => {
    expect(await rulesHit('packages/core/src/x.ts', "export const d = new Date('2026-06-30');")).toEqual([]);
  });

  test.each([
    ['destructuring', 'const { random } = Math; export const r = random();'],
    ['an alias', 'const M = Math; export const r = M.random();'],
    ['globalThis', 'export const r = globalThis.Math.random();'],
    ['window', 'export const t = window.Date.now();'],
    ['a computed key', "export const r = Math['random']();"],
    ['Date() without new', 'export const d = Date();'],
    ['new Date(undefined)', 'export const d = new Date(undefined);'],
    ['crypto.getRandomValues', 'export const b = crypto.getRandomValues(new Uint8Array(4));'],
    ['crypto.randomUUID', 'export const u = crypto.randomUUID();'],
  ])('REQ-004 · an evasion through %s still fails', async (_how, code) => {
    const hits = await rulesHit('packages/core/src/x.ts', code);
    expect(hits.length).toBeGreaterThan(0);
    expect(new Set(hits)).toEqual(new Set(['silverpoint/no-nondeterminism']));
  });

  test('REQ-004 · a local binding that shadows Math is not the global', async () => {
    expect(await rulesHit('packages/core/src/x.ts', 'export function f(Math: { random(): number }) { return Math.random(); }')).toEqual([]);
  });

  test('REQ-004 · Math.random() in a Vue template fails', async () => {
    const sfc = '<script setup lang="ts">\n</script>\n<template><p>{{ Math.random() }}</p></template>\n';
    expect(await rulesHit('packages/vue/src/X.vue', sfc)).toContain('silverpoint/no-nondeterminism');
  });

  test('REQ-004 · tests are outside the render path', async () => {
    expect(await rulesHit('packages/core/test/x.test.ts', 'export const r = Math.random();')).toEqual([]);
  });
});

describe('adapter-boundary', () => {
  test("REQ-106 · import 'd3-scale' in the React adapter fails", async () => {
    expect(await rulesHit('packages/react/src/x.tsx', "import { scaleLinear } from 'd3-scale';\nexport { scaleLinear };")).toEqual([
      'silverpoint/adapter-boundary',
    ]);
  });

  test("REQ-106 · TypeScript's `import x = require('d3-scale')` in an adapter fails", async () => {
    expect(await rulesHit('packages/react/src/x.ts', "import d3 = require('d3-scale');\nexport const s = d3.scaleLinear;")).toEqual([
      'silverpoint/adapter-boundary',
    ]);
  });

  test("REQ-106 · a type query `import('d3-scale').T` in an adapter fails", async () => {
    expect(await rulesHit('packages/vue/src/x.ts', "export type S = import('d3-scale').ScaleLinear<number, number>;")).toEqual([
      'silverpoint/adapter-boundary',
    ]);
  });

  test('REQ-106 · a d3 import inside a Vue SFC fails', async () => {
    const sfc = "<script setup lang=\"ts\">\nimport { line } from 'd3-shape';\nline();\n</script>\n<template><svg /></template>\n";
    expect(await rulesHit('packages/vue/src/X.vue', sfc)).toEqual(['silverpoint/adapter-boundary']);
  });

  test('REQ-027 · the Angular adapter may not import the inking engine', async () => {
    expect(await rulesHit('packages/angular/src/x.ts', "import rough from 'roughjs';\nexport { rough };")).toEqual([
      'silverpoint/adapter-boundary',
    ]);
  });

  test('REQ-027 · grounds, which houses RoughInker, may import it', async () => {
    expect(await rulesHit('packages/grounds/src/x.ts', "import rough from 'roughjs';\nexport { rough };")).toEqual([]);
  });

  test('REQ-102 · an adapter declaring maths of its own fails', async () => {
    expect(await rulesHit('packages/react/src/x.ts', 'export const w = (n: number) => Math.round(n);')).toEqual([
      'silverpoint/adapter-boundary',
    ]);
  });

  test('REQ-102 · maths inside a Vue template binding fails', async () => {
    const sfc = '<script setup lang="ts">\nconst x = 1;\n</script>\n<template><path :d="`M${Math.round(x)},0`" /></template>\n';
    expect(await rulesHit('packages/vue/src/X.vue', sfc)).toEqual(['silverpoint/adapter-boundary']);
  });

  test('REQ-102 · REQ-004 · the Angular secondary entry points are adapter code too', async () => {
    expect(await rulesHit('packages/angular/line-chart/x.ts', 'export const w = (n: number) => Math.round(n);')).toEqual([
      'silverpoint/adapter-boundary',
    ]);
    expect(await rulesHit('packages/angular/line-chart/x.ts', "import { scaleLinear } from 'd3-scale';\nexport { scaleLinear };")).toEqual([
      'silverpoint/adapter-boundary',
    ]);
    expect(await rulesHit('packages/angular/line-chart/y.ts', 'export const d = Date.now();')).toContain('silverpoint/no-nondeterminism');
  });

  test('REQ-102 · the core may do maths', async () => {
    expect(await rulesHit('packages/core/src/x.ts', 'export const w = (n: number) => Math.round(n);')).toEqual([]);
  });
});

describe('dashboard-no-layout-maths (T-114)', () => {
  const RULE = 'silverpoint/dashboard-no-layout-maths';

  test.each([
    ['React', 'packages/react/src/dashboard-markup.tsx', 'export const w = (width: number, cols: number) => width / cols;'],
    ['React server', 'packages/react/src/server/dashboard.tsx', 'export const h = (row: number, gap: number) => row * 240 + gap;'],
    ['Vue', 'packages/vue/src/SpDashboard.ts', 'export const w = (width: number, gap: number) => width - gap;'],
    ['Angular', 'packages/angular/dashboard/sp-dashboard.ts', 'export const span = (n: number) => n % 4;'],
  ])('REQ-201 · Art. 2 · a seeded size computation in the %s dashboard fails', async (_adapter, path, code) => {
    expect(await rulesHit(path, code)).toContain(RULE);
  });

  test.each([
    ['a numeric literal', 'export const gap = 16;'],
    ['a compound assignment', 'export function f(x: number) { x += 1; return x; }'],
    ['an increment', 'export function f(x: number) { x++; return x; }'],
    ['a unary minus', 'export const f = (x: number) => -x;'],
  ])('REQ-201 · %s in a dashboard file fails: every number comes from the model', async (_what, code) => {
    expect(await rulesHit('packages/angular/dashboard/x.ts', code)).toContain(RULE);
  });

  test('REQ-201 · numbers in type positions and template strings are allowed', async () => {
    const code = "export type Level = 2 | 3 | 4;\nexport const tag = (level: Level) => `h${level}`;\nexport const none = null;";
    expect(await rulesHit('packages/react/src/dashboard-markup.tsx', code)).toEqual([]);
  });

  test('REQ-201 · the rule covers the dashboard files only: a chart’s overlay may place its readout', async () => {
    expect(await rulesHit('packages/react/src/overlay.tsx', 'export const x = (a: number) => a / 2;')).not.toContain(RULE);
  });

  test('REQ-201 · the shipped dashboard files hold to it', async () => {
    const files = [
      'packages/react/src/dashboard-markup.tsx',
      'packages/react/src/dashboard.tsx',
      'packages/react/src/server/dashboard.tsx',
      'packages/vue/src/SpDashboard.ts',
      'packages/vue/src/SpDashboardCell.ts',
      'packages/vue/src/dashboard.ts',
      'packages/vue/src/dashboard-context.ts',
      'packages/angular/dashboard/sp-dashboard.ts',
      'packages/angular/dashboard/sp-dashboard-cell.ts',
      'packages/angular/src/dashboard-cell.ts',
    ];
    const results = await eslint.lintFiles(files.map((file) => `${root}${file}`));
    expect(results).toHaveLength(files.length);
    expect(results.flatMap((r) => r.messages.map((m) => `${r.filePath}: ${m.ruleId} ${m.message}`))).toEqual([]);
  });
});

describe('core-allowlist', () => {
  test('REQ-162 · the core may import the allowlisted d3 modules and relative files', async () => {
    const code = "import { scaleLinear } from 'd3-scale';\nimport { line } from 'd3-shape';\nimport { x } from './x';\nexport { scaleLinear, line, x };";
    expect(await rulesHit('packages/core/src/y.ts', code)).toEqual([]);
  });

  test('REQ-162 · a module outside the allowlist fails in the core', async () => {
    expect(await rulesHit('packages/core/src/y.ts', "import { extent } from 'd3-array';\nexport { extent };")).toEqual([
      'silverpoint/core-allowlist',
    ]);
  });
});

/**
 * TD §6: user text enters as a text node, never as markup — "neither `innerHTML` nor
 * `dangerouslySetInnerHTML` is used anywhere" (T-090: the canonical page used `innerHTML`).
 */
describe('no markup injection', () => {
  test.each([
    ['innerHTML', 'examples/vite-react/src/x.ts', 'export function f(el: Element, s: string) { el.innerHTML = s; }'],
    ['outerHTML', 'packages/grounds/src/x.ts', 'export function f(el: Element, s: string) { el.outerHTML = s; }'],
    ['insertAdjacentHTML', 'packages/vue/src/x.ts', "export function f(el: Element, s: string) { el.insertAdjacentHTML('beforeend', s); }"],
    ['dangerouslySetInnerHTML', 'packages/react/src/x.tsx', 'export const C = (p: { s: string }) => <div dangerouslySetInnerHTML={{ __html: p.s }} />;'],
    ['dangerouslySetInnerHTML in an example', 'examples/nextjs/app/x.tsx', 'export const C = (p: { s: string }) => <div dangerouslySetInnerHTML={{ __html: p.s }} />;'],
  ])('TD §6 · %s fails', async (_what, path, code) => {
    expect(await rulesHit(path, code)).toEqual(['no-restricted-syntax']);
  });

  test('TD §6 · reading innerHTML in a test is allowed', async () => {
    expect(await rulesHit('packages/react/test/x.test.tsx', 'export const read = (el: Element) => el.innerHTML;')).toEqual([]);
  });

  test('TD §6 · no Vue template uses v-html', () => {
    const vue = (dir: string): string[] =>
      readdirSync(join(root, dir), { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.vue') && !f.includes('node_modules'));
    const offenders = ['packages/vue/src', 'examples/vite-vue/src'].flatMap((dir) => vue(dir).filter((f) => readFileSync(join(root, dir, f), 'utf8').includes('v-html')));
    expect(offenders).toEqual([]);
  });
});
