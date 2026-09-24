// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { interfaceKeys } from '../../../tools/testing/interface-keys';
import { AFTER_LINE_CHART } from '../../../tools/visual-gate/catalog';

const root = fileURLToPath(new URL('..', import.meta.url));
const repo = fileURLToPath(new URL('../../..', import.meta.url));
/** Every chart component, as the snippet imports them. */
const COMPONENTS = ['SpLineChart', ...AFTER_LINE_CHART.map((e) => `Sp${e.chart}`)].join(', ');

/** Runs vue-tsc on a component snippet placed in a scratch directory inside the package. */
function vueTypeErrors(template: string): string {
  const dir = mkdtempSync(join(root, 'test/.types-'));
  try {
    writeFileSync(
      join(dir, 'Use.vue'),
      `<script setup lang="ts">\nimport { ${COMPONENTS} } from '../../src';\nimport type { ActiveItem } from '@silverpoint/core';\nfunction onNumber(n: number) { return n; }\nfunction onItem(i: ActiveItem | null) { return i; }\nvoid onNumber; void onItem; void [${COMPONENTS}];\n</script>\n<template>${template}</template>\n`,
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

describe('Phase 1 component types', () => {
  test.each(AFTER_LINE_CHART.map((e) => [e.chart, e] as const))('API §4 · Sp%s props match the React adapter name for name', async (_name, entry) => {
    const component = ((await import('../src')) as Record<string, unknown>)[`Sp${entry.chart}`];
    const vueProps = Object.keys((component as { props: Record<string, unknown> }).props).sort();
    expect(vueProps).toEqual(interfaceKeys(join(repo, 'packages/core/src/types/props.ts'), entry.propsInterface));
  });

  const all = (handler: string) => AFTER_LINE_CHART.map((e) => `<Sp${e.chart} @active-change="${handler}" />`).join('');

  test('REQ-108 · every chart types @active-change to ActiveItem | null', () => {
    expect(vueTypeErrors(all('onItem'))).toBe('');
  }, 60_000);

  test('REQ-108 · on every chart, a handler expecting another payload is a type error', () => {
    const errors = vueTypeErrors(all('onNumber'));
    expect(errors.match(/error TS/g)?.length ?? 0).toBeGreaterThanOrEqual(AFTER_LINE_CHART.length);
  }, 60_000);
});
