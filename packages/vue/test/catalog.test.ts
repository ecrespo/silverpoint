import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ActiveItem } from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp, createSSRApp, h, nextTick, type Component } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { compareSvg } from '../../../tools/svg-normalizer/normalize';
import { AFTER_LINE_CHART, type CatalogEntry } from '../../../tools/visual-gate/catalog';
import * as library from '../src';

const fixed = { id: 'sp-fixture', width: 320, height: 150 } as const;
// happy-dom replaces URL, so paths are built from the directory, not from import.meta.url.
const packageDir = join(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')) as {
  exports: Record<string, Record<string, string>>;
};

const canonical = (entry: CatalogEntry, props: Record<string, unknown>) =>
  toSVGString(renderChart(entry.recipe, props, { id: 'unused' }));
const component = (entry: CatalogEntry) => (library as unknown as Record<string, Component | undefined>)[`Sp${entry.chart}`];

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});

describe.each(AFTER_LINE_CHART.map((e) => [`Sp${e.chart}`, e] as const))('%s', (_name, entry) => {
  const variants = {
    'demo, ink': { ...fixed, mode: 'ink', title: entry.chart },
    'demo, precision': { ...fixed, mode: 'precision' },
    'consumer data': { ...fixed, ...entry.sample },
    bare: { ...fixed, chrome: 'bare' },
  } as const;

  test('REQ-100 · exported from the package root', () => {
    expect(component(entry)).toBeDefined();
  });

  test.each(Object.entries(variants))('REQ-100 · server-rendered, %s: identical to the canonical render', async (_v, props) => {
    const html = await renderToString(createSSRApp({ render: () => h(component(entry) as Component, props) }));
    expect(compareSvg(html, canonical(entry, props))).toEqual({ equal: true });
  });

  test('REQ-107 · published at its own subpath', async () => {
    const target = pkg.exports[`./${entry.slug}`];
    expect(target).toBeDefined();
    expect(existsSync(join(packageDir, target?.['@silverpoint/source'] ?? '-'))).toBe(true);
    expect(target?.import).toBe(`./dist/${entry.slug}.js`);
    const entryModule = (await import(`../src/${entry.slug}.ts`)) as Record<string, unknown>;
    expect(entryModule[`Sp${entry.chart}`]).toBe(component(entry));
  });

  test('REQ-108 · REQ-122 · the keyboard reaches an item and emits activeChange', async () => {
    const onActiveChange = vi.fn<(item: ActiveItem | null) => void>();
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({ render: () => h(component(entry) as Component, { ...fixed, onActiveChange }) });
    app.mount(host);
    cleanup.push(() => {
      app.unmount();
      host.remove();
    });
    const chartRoot = host.querySelector<HTMLElement>('.sp-root') as HTMLElement;
    chartRoot.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    await nextTick();
    expect(onActiveChange).toHaveBeenLastCalledWith(expect.objectContaining({ index: expect.any(Number) }));
  });
});
