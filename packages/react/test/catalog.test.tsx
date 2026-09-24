import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, createElement, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ActiveItem } from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { compareSvg } from '../../../tools/svg-normalizer/normalize';
import { PHASE_1, type CatalogEntry } from '../../../tools/visual-gate/catalog';
import * as client from '../src';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fixed = { id: 'sp-fixture', width: 320, height: 150 } as const;
// happy-dom replaces URL, so paths are built from the directory, not from import.meta.url.
const packageDir = join(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')) as {
  exports: Record<string, Record<string, string>>;
};

const canonical = (entry: CatalogEntry, props: Record<string, unknown>) =>
  toSVGString(renderChart(entry.recipe, props, { id: 'unused' }));
const component = (entry: CatalogEntry) =>
  (client as unknown as Record<string, ComponentType<Record<string, unknown>> | undefined>)[entry.chart];

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});

describe.each(PHASE_1.map((e) => [e.chart, e] as const))('%s', (_name, entry) => {
  const variants = {
    'demo, ink': { ...fixed, mode: 'ink', title: entry.chart },
    'demo, precision': { ...fixed, mode: 'precision' },
    'consumer data': { ...fixed, ...entry.sample },
    bare: { ...fixed, chrome: 'bare' },
  } as const;

  test('REQ-100 · the client component is exported from the package root', () => {
    expect(component(entry)).toBeDefined();
  });

  test.each(Object.entries(variants))('REQ-100 · client, %s: identical to the canonical render', (_v, props) => {
    const Chart = component(entry) as ComponentType<Record<string, unknown>>;
    expect(compareSvg(renderToStaticMarkup(createElement(Chart, props)), canonical(entry, props))).toEqual({ equal: true });
  });

  test.each(Object.entries(variants))('REQ-104 · server, %s: identical to the canonical render', async (_v, props) => {
    const { [entry.chart]: Server } = (await import(`../src/server/${entry.slug}.tsx`)) as Record<string, ComponentType<Record<string, unknown>>>;
    expect(compareSvg(renderToStaticMarkup(createElement(Server as ComponentType<Record<string, unknown>>, props)), canonical(entry, props))).toEqual({ equal: true });
  });

  test('REQ-107 · published at its own client and server subpaths', async () => {
    for (const subpath of [`./${entry.slug}`, `./server/${entry.slug}`]) {
      const target = pkg.exports[subpath];
      expect(target, subpath).toBeDefined();
      expect(existsSync(join(packageDir, target?.['@silverpoint/source'] ?? '-')), subpath).toBe(true);
      expect(target?.import).toBe(`./dist/${subpath.slice(2)}.js`);
    }
    const entryModule = (await import(`../${pkg.exports[`./${entry.slug}`]?.['@silverpoint/source']}`)) as Record<string, unknown>;
    expect(entryModule[entry.chart]).toBe(component(entry));
  });

  test('REQ-122 · the keyboard reaches an item and reports it', () => {
    const seen: (ActiveItem | null)[] = [];
    const Chart = component(entry) as ComponentType<Record<string, unknown>>;
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    act(() => root.render(createElement(Chart, { ...fixed, onActiveChange: (item: ActiveItem | null) => seen.push(item) })));
    cleanup.push(() => {
      act(() => root.unmount());
      host.remove();
    });
    const chartRoot = host.querySelector('.sp-root') as HTMLElement;
    act(() => {
      chartRoot.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      chartRoot.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    });
    expect(seen.at(-1)).toMatchObject({ index: expect.any(Number) });
  });
});

describe('server entry types', () => {
  test('REQ-104 · every server variant is a plain function: no hooks, no client state', async () => {
    for (const entry of PHASE_1) {
      const { [entry.chart]: Server } = (await import(`../src/server/${entry.slug}.tsx`)) as Record<string, (p: object) => unknown>;
      expect(() => Server?.({ ...fixed }), entry.chart).not.toThrow();
    }
  });
});

vi.setConfig({ testTimeout: 20_000 });
