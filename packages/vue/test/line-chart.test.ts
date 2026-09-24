import { lineChart, type LineChartProps } from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp, createSSRApp, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { compareSvg } from '../../../tools/svg-normalizer/normalize';
import { provideSilverpoint, SpLineChart } from '../src';

const fixed = { id: 'sp-fixture', width: 320, height: 160 } as const;

function canonical(props: LineChartProps): string {
  return toSVGString(renderChart(lineChart, props, { id: 'unused' }));
}

function ssr(props: Record<string, unknown>): Promise<string> {
  return renderToString(createSSRApp({ render: () => h(SpLineChart, props) }));
}

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
  vi.unstubAllGlobals();
});

function mount(render: () => ReturnType<typeof h>, plugin?: ReturnType<typeof provideSilverpoint>) {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp({ render });
  if (plugin) app.use(plugin);
  app.mount(host);
  cleanup.push(() => {
    app.unmount();
    host.remove();
  });
  return host;
}

describe('SpLineChart under @vue/server-renderer', () => {
  test.each(['ink', 'precision'] as const)('REQ-100 · %s mode renders identically to the canonical render', async (mode) => {
    const props = { ...fixed, mode, title: 'Throughput', unit: 'requests' };
    expect(compareSvg(await ssr(props), canonical(props))).toEqual({ equal: true });
  });

  test.each(['cream', 'green', 'blue', 'ochre'] as const)('REQ-046 · substrate %s reaches the markup', async (substrate) => {
    const html = await ssr({ ...fixed, substrate });
    expect(compareSvg(html, canonical({ ...fixed, substrate })).equal).toBe(true);
    expect(html).toContain(`data-substrate="${substrate}"`);
  });

  test("REQ-095 · chrome: 'bare' renders only the drawing area", async () => {
    const props = { ...fixed, chrome: 'bare', title: 'Hidden' } as const;
    const html = await ssr(props);
    expect(compareSvg(html, canonical(props)).equal).toBe(true);
    expect(html).not.toMatch(/data-kind="title"/);
  });

  test('REQ-121 · the tabular alternative is rendered, hidden for sight by default', async () => {
    const html = await ssr({ ...fixed, title: 'Hits' });
    expect(html).toMatch(/<table class="sp-table" id="sp-fixture-table" data-visibility="hidden">/);
    expect(html).toMatch(/<caption>Hits<\/caption>/);
    expect(html.match(/<tr>/g)).toHaveLength(13);
  });

  test("REQ-121 · dataTable: 'none' omits the table and 'visible' shows it", async () => {
    expect(await ssr({ ...fixed, dataTable: 'none' })).not.toMatch(/<table/);
    expect(await ssr({ ...fixed, dataTable: 'visible' })).toMatch(/data-visibility="visible"/);
  });

  test('REQ-041 · the root carries the ground class and substrate for the stylesheet', async () => {
    expect(await ssr({ ...fixed, className: 'mine' })).toMatch(/^<div class="sp-root sp-ground-silverpoint mine" data-substrate="cream"/);
  });

  test('REQ-060 · consumer data is drawn through accessor keys', async () => {
    const data = [
      { day: 'Mon', hits: 3 },
      { day: 'Tue', hits: 5 },
    ];
    const props = { ...fixed, data, xKey: 'day', valueKey: 'hits' };
    expect(compareSvg(await ssr(props), canonical(props)).equal).toBe(true);
  });

  test('REQ-009 · without a width it renders deferred on the server, with no NaN', async () => {
    const html = await ssr({ id: 'sp-deferred' });
    expect(html).toMatch(/data-status="deferred"/);
    expect(html).not.toMatch(/NaN/);
  });
});

describe('SpLineChart in the browser', () => {
  test('REQ-109 · server markup hydrates with no mismatch', async () => {
    const props = { ...fixed, title: 'Hydrated' };
    const host = document.createElement('div');
    host.innerHTML = await ssr(props);
    document.body.append(host);
    const warnings: string[] = [];
    const app = createSSRApp({ render: () => h(SpLineChart, props) });
    app.config.warnHandler = (message) => warnings.push(message);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    app.mount(host);
    await nextTick();
    expect(warnings.filter((w) => /hydration/i.test(w))).toEqual([]);
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/hydration/i);
    app.unmount();
    host.remove();
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
    const host = mount(() => h(SpLineChart, { id: 'sp-measured' }));
    expect(host.querySelector('.sp-root')?.getAttribute('data-status')).toBe('deferred');
    notify(400);
    await nextTick();
    expect(host.querySelector('svg.sp-chart')?.getAttribute('viewBox')).toMatch(/^0 0 400 /);
  });

  test('API §8.3 · provideSilverpoint supplies ground, substrate and mode; a prop wins over it', () => {
    const host = mount(
      () => [h(SpLineChart, fixed), h(SpLineChart, { ...fixed, id: 'sp-second', substrate: 'blue' })] as never,
      provideSilverpoint({ substrate: 'ochre', mode: 'precision' }),
    );
    const [first, second] = [...host.querySelectorAll('svg.sp-chart')];
    expect(first?.getAttribute('data-substrate')).toBe('ochre');
    expect(first?.getAttribute('data-mode')).toBe('precision');
    expect(second?.getAttribute('data-substrate')).toBe('blue');
  });

  test('REQ-123 · prefers-contrast: more switches to precision, over the prop', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-contrast: more'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }));
    const host = mount(() => h(SpLineChart, { ...fixed, mode: 'ink' }));
    await nextTick();
    expect(host.querySelector('svg.sp-chart')?.getAttribute('data-mode')).toBe('precision');
  });

  test('API §8.3 · the template ref exposes getGeometry() and toSVGString()', () => {
    const chart = ref<{ getGeometry(): { viewBox: { width: number } }; toSVGString(): string }>();
    mount(() => h(SpLineChart, { ...fixed, ref: chart }));
    expect(chart.value?.getGeometry().viewBox.width).toBe(320);
    expect(compareSvg(chart.value?.toSVGString() ?? '', canonical(fixed)).equal).toBe(true);
  });
});
