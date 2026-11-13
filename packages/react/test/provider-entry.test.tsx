import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, test } from 'vitest';
import pkg from '../package.json';
import { LineChart } from '../src/line-chart-entry';
import * as entry from '../src/provider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});

/**
 * The provider's own subpath (#21): under a bundler that keeps a `'use client'` barrel whole
 * (Turbopack), the root entry carries all sixty charts into every route that sets a ground.
 */
describe('@silverpoint/react/provider', () => {
  test('REQ-107 · #21 · the provider has a subpath of its own, declared like a chart\'s', () => {
    expect((pkg.exports as Record<string, unknown>)['./provider']).toEqual({
      '@silverpoint/source': './src/provider.tsx',
      types: './dist/provider.d.ts',
      import: './dist/provider.js',
      default: './dist/provider.js',
    });
  });

  test('REQ-107 · #21 · it is built with the client entries, so it shares their context module and carries "use client"', () => {
    // Read as text: the build config is not part of the package's typechecked sources.
    const config = readFileSync(join(import.meta.dirname, '../tsup.config.ts'), 'utf8');
    const entry = "provider: 'src/provider.tsx'";
    expect(config.split(entry)).toHaveLength(2);
    // The first config block is the client one: it ends with the banner, and the charts are in it.
    const client = config.slice(0, config.indexOf(`banner: { js: "'use client';" }`));
    expect(client).toContain("'line-chart': 'src/line-chart-entry.ts'");
    expect(client).toContain(entry);
  });

  test('REQ-107 · #21 · the entry exports the provider and nothing else', () => {
    expect(Object.keys(entry)).toEqual(['SilverpointProvider']);
  });

  test('API §8.1 · #21 · a chart imported by its subpath reads the provider imported by its own', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    cleanup.push(() => {
      act(() => root.unmount());
      host.remove();
    });
    act(() =>
      root.render(
        <entry.SilverpointProvider ground="cyanotype" mode="precision">
          <LineChart id="sp-provider-entry" width={320} height={160} />
        </entry.SilverpointProvider>,
      ),
    );
    const svg = host.querySelector('svg.sp-chart');
    expect(svg?.getAttribute('class')).toContain('sp-ground-cyanotype');
    expect(svg?.getAttribute('data-mode')).toBe('precision');
  });
});
