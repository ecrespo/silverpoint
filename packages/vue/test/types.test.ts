// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, test } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
const repo = fileURLToPath(new URL('../../..', import.meta.url));

/** Property names of an exported interface, read with the TypeScript compiler. */
function interfaceKeys(file: string, name: string): string[] {
  const program = ts.createProgram([file], { strict: true, noEmit: true, moduleResolution: ts.ModuleResolutionKind.Bundler, module: ts.ModuleKind.ESNext });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(file);
  if (!source) throw new Error(`Cannot read ${file}`);
  const symbol = checker.getExportsOfModule(checker.getSymbolAtLocation(source) as ts.Symbol).find((s) => s.name === name);
  if (!symbol) throw new Error(`${name} not exported from ${file}`);
  return checker.getDeclaredTypeOfSymbol(symbol).getProperties().map((p) => p.name).sort();
}

/** Runs vue-tsc on a component snippet placed in a scratch directory inside the package. */
function vueTypeErrors(template: string): string {
  const dir = mkdtempSync(join(root, 'test/.types-'));
  try {
    writeFileSync(
      join(dir, 'Use.vue'),
      `<script setup lang="ts">\nimport { SpLineChart } from '../../src';\nimport type { ActiveItem } from '@silverpoint/core';\nfunction onNumber(n: number) { return n; }\nfunction onItem(i: ActiveItem | null) { return i; }\nvoid onNumber; void onItem;\n</script>\n<template>${template}</template>\n`,
    );
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify({ extends: '../../tsconfig.json', include: ['Use.vue', '../../src/**/*.ts', '../../src/**/*.vue'] }),
    );
    try {
      execFileSync(join(repo, 'packages/vue/node_modules/.bin/vue-tsc'), ['--noEmit', '-p', join(dir, 'tsconfig.json')], { encoding: 'utf8' });
      return '';
    } catch (error) {
      return String((error as { stdout?: string }).stdout ?? error);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('SpLineChart types', () => {
  test('API §4 · props match the React adapter name for name', async () => {
    const { SpLineChart } = await import('../src');
    const vueProps = Object.keys((SpLineChart as unknown as { props: Record<string, unknown> }).props).sort();
    expect(vueProps).toEqual(interfaceKeys(join(repo, 'packages/core/src/types/props.ts'), 'LineChartProps'));
  });

  test('REQ-108 · @active-change is typed to ActiveItem | null', () => {
    expect(vueTypeErrors('<SpLineChart @active-change="onItem" />')).toBe('');
  }, 60_000);

  test('REQ-108 · a handler expecting another payload is a type error', () => {
    expect(vueTypeErrors('<SpLineChart @active-change="onNumber" />')).toMatch(/number/);
  }, 60_000);
});
