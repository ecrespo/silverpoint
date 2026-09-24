import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Type } from '@angular/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import { describe, expect, test } from 'vitest';
import { compareSvg } from '../../../tools/svg-normalizer/normalize';
import { interfaceKeys } from '../../../tools/testing/interface-keys';
import { AFTER_LINE_CHART, type CatalogEntry } from '../../../tools/visual-gate/catalog';
import { ssrFor } from './harness';

const packageDir = join(import.meta.dirname, '..');
const repo = join(packageDir, '../..');
const fixed = { id: 'sp-fixture', width: 320, height: 150 } as const;

const canonical = (entry: CatalogEntry, props: Record<string, unknown>) =>
  toSVGString(renderChart(entry.recipe, props, { id: 'unused' }));
const load = async (entry: CatalogEntry) =>
  ((await import(/* @vite-ignore */ `@silverpoint/angular/${entry.slug}`)) as Record<string, Type<unknown>>)[`Sp${entry.chart}`] as Type<unknown>;

describe.each(AFTER_LINE_CHART.map((e) => [`sp-${e.slug}`, e] as const))('%s', (selector, entry) => {
  const variants = {
    'demo, ink': { ...fixed, mode: 'ink', title: entry.chart },
    'demo, precision': { ...fixed, mode: 'precision' },
    'consumer data': { ...fixed, ...entry.sample },
    bare: { ...fixed, chrome: 'bare' },
  } as const;

  test.each(Object.entries(variants))('REQ-100 · server-rendered, %s: identical to the canonical render', async (_v, props) => {
    const html = await ssrFor(await load(entry), selector, props);
    expect(compareSvg(html, canonical(entry, props))).toEqual({ equal: true });
  });

  test(`REQ-101 · standalone, OnPush, selector ${selector}`, async () => {
    const definition = ((await load(entry)) as unknown as { ɵcmp: Record<string, unknown> }).ɵcmp;
    expect(definition.standalone).toBe(true);
    expect(definition.onPush).toBe(true);
    expect(definition.selectors).toEqual([[selector]]);
  });

  test(`REQ-101 · every input is a signal input, named as ${entry.propsInterface}`, async () => {
    const inputs = ((await load(entry)) as unknown as { ɵcmp: { inputs: Record<string, [string, number]> } }).ɵcmp.inputs;
    const names = Object.keys(inputs).sort();
    expect(names).toEqual(interfaceKeys(join(repo, 'packages/core/src/types/props.ts'), entry.propsInterface));
    // InputFlags.SignalBased = 1 (Angular's input metadata encoding).
    for (const name of names) expect((inputs[name]?.[1] ?? 0) & 1, name).toBe(1);
  });

  test('API §9 · emits activeChange and select', async () => {
    const definition = ((await load(entry)) as unknown as { ɵcmp: { outputs: object } }).ɵcmp;
    expect(Object.keys(definition.outputs).sort()).toEqual(['activeChange', 'select']);
  });

  test('REQ-105 · REQ-107 · a secondary entry point of its own', () => {
    const config = JSON.parse(readFileSync(join(packageDir, entry.slug, 'ng-package.json'), 'utf8')) as { lib: { entryFile: string } };
    expect(existsSync(join(packageDir, entry.slug, config.lib.entryFile))).toBe(true);
    expect(existsSync(join(packageDir, `dist/fesm2022/silverpoint-angular-${entry.slug}.mjs`))).toBe(true);
  });
});
