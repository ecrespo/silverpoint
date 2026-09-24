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

  test('REQ-102 · the core may do maths', async () => {
    expect(await rulesHit('packages/core/src/x.ts', 'export const w = (n: number) => Math.round(n);')).toEqual([]);
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
