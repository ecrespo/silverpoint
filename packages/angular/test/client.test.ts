// @vitest-environment happy-dom
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SpLineChart } from '@silverpoint/angular/line-chart';
import { __setDiagnosticSink, type SpCode } from '@silverpoint/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { compareSvg } from '../../../tools/svg-normalizer/normalize';
import { canonical, host } from './harness';

const fixed = { id: 'sp-fixture', width: 320, height: 160 } as const;

let apps: ApplicationRef[] = [];
afterEach(() => {
  for (const app of apps) app.destroy();
  apps = [];
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

async function mount(inputs: Record<string, unknown>): Promise<ApplicationRef> {
  document.body.innerHTML = '<app-root></app-root>';
  const app = await bootstrapApplication(host(inputs), { providers: [provideZonelessChangeDetection()] });
  apps.push(app);
  await app.whenStable();
  return app;
}

describe('sp-line-chart in the browser', () => {
  test('REQ-100 · the client render matches the canonical render', async () => {
    await mount({ ...fixed, title: 'Client' });
    expect(compareSvg(document.body.innerHTML, canonical({ ...fixed, title: 'Client' }))).toEqual({ equal: true });
  });

  test('REQ-009 · the container is measured with ResizeObserver and re-renders at that width', async () => {
    let notify: (width: number) => void = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: (entries: { contentRect: { width: number } }[]) => void) {
          notify = (width) => callback([{ contentRect: { width } }]);
        }
        observe() {}
        disconnect() {}
      },
    );
    const app = await mount({ id: 'sp-measured' });
    expect(document.querySelector('.sp-root')?.getAttribute('data-status')).toBe('deferred');
    notify(400);
    await app.whenStable();
    expect(document.querySelector('svg.sp-chart')?.getAttribute('viewBox')).toMatch(/^0 0 400 /);
  });

  test('REQ-123 · prefers-contrast: more switches to precision, over the input', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-contrast: more'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }));
    await mount({ ...fixed, mode: 'ink' });
    expect(document.querySelector('svg.sp-chart')?.getAttribute('data-mode')).toBe('precision');
  });

  test('REQ-032 · a typeface that fails to load reports SP013 and the chart still renders', async () => {
    const seen: SpCode[] = [];
    const restore = __setDiagnosticSink((code) => seen.push(code));
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { load: () => Promise.reject(new Error('blocked')), check: () => false },
    });
    try {
      await mount(fixed);
      await vi.waitFor(() => expect(seen).toContain('SP013'));
      expect(document.querySelector('svg.sp-chart')).not.toBeNull();
    } finally {
      Reflect.deleteProperty(document, 'fonts');
      restore();
    }
  });

  test('API §8.2 · getGeometry() and toSVGString() answer from the live component', async () => {
    await mount(fixed);
    const instance = findChart();
    expect(instance.getGeometry().viewBox.width).toBe(320);
    expect(compareSvg(instance.toSVGString(), canonical(fixed)).equal).toBe(true);
  });
});

/** The SpLineChart instance under the root host, through Angular's debugging API. */
function findChart(): SpLineChart {
  const element = document.querySelector('sp-line-chart');
  const ng = (globalThis as { ng?: { getComponent(e: Element): unknown } }).ng;
  const found = element && ng ? (ng.getComponent(element) as SpLineChart) : undefined;
  if (!found) throw new Error('sp-line-chart instance not found');
  return found;
}
