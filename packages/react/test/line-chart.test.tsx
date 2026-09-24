import { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { compareSvg } from '../../../tools/svg-normalizer/normalize';
import { LineChart, SilverpointProvider, type ChartHandle } from '../src';
import { LineChart as ServerLineChart } from '../src/server/line-chart';
import { canonical } from './helpers';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fixed = { id: 'sp-fixture', width: 320, height: 160 } as const;

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
  vi.unstubAllGlobals();
});

function mount(element: React.ReactElement): HTMLElement {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(element));
  cleanup.push(() => {
    act(() => root.unmount());
    host.remove();
  });
  return host;
}

describe('server LineChart', () => {
  test.each(['ink', 'precision'] as const)('REQ-100 · %s mode renders identically to the canonical render', (mode) => {
    const props = { ...fixed, mode, title: 'Throughput', unit: 'requests' };
    const result = compareSvg(renderToStaticMarkup(<ServerLineChart {...props} />), canonical(props, { id: 'x' }));
    expect(result).toEqual({ equal: true });
  });

  test.each(['cream', 'green', 'blue', 'ochre'] as const)('REQ-046 · substrate %s reaches the markup', (substrate) => {
    const markup = renderToStaticMarkup(<ServerLineChart {...fixed} substrate={substrate} />);
    expect(compareSvg(markup, canonical({ ...fixed, substrate })).equal).toBe(true);
    expect(markup).toContain(`data-substrate="${substrate}"`);
  });

  test("REQ-095 · chrome: 'bare' renders only the drawing area", () => {
    const props = { ...fixed, chrome: 'bare', title: 'Hidden' } as const;
    const markup = renderToStaticMarkup(<ServerLineChart {...props} />);
    expect(compareSvg(markup, canonical(props)).equal).toBe(true);
    expect(markup).not.toMatch(/data-kind="title"/);
  });

  test('REQ-104 · the server variant is a plain function: no hooks, no client state', () => {
    // Calling a component outside a React render throws on the first hook it uses.
    expect(() => ServerLineChart({ ...fixed })).not.toThrow();
  });

  test('REQ-121 · the tabular alternative is rendered, hidden for sight by default', () => {
    const markup = renderToStaticMarkup(<ServerLineChart {...fixed} title="Hits" />);
    expect(markup).toMatch(/<table class="sp-table" id="sp-fixture-table" data-visibility="hidden">/);
    expect(markup).toMatch(/<caption>Hits<\/caption>/);
    expect(markup.match(/<tr>/g)).toHaveLength(13);
  });

  test("REQ-121 · dataTable: 'none' omits the table and 'visible' shows it", () => {
    expect(renderToStaticMarkup(<ServerLineChart {...fixed} dataTable="none" />)).not.toMatch(/<table/);
    expect(renderToStaticMarkup(<ServerLineChart {...fixed} dataTable="visible" />)).toMatch(/data-visibility="visible"/);
  });

  test('REQ-041 · the root carries the ground class and substrate for the stylesheet', () => {
    const markup = renderToStaticMarkup(<ServerLineChart {...fixed} className="mine" />);
    expect(markup).toMatch(/^<div class="sp-root sp-ground-silverpoint mine" data-substrate="cream"/);
  });
});

describe('client LineChart', () => {
  test('REQ-100 · server-rendered with a pinned width it matches the canonical render', () => {
    const props = { ...fixed, title: 'Client' };
    expect(compareSvg(renderToStaticMarkup(<LineChart {...props} />), canonical(props)).equal).toBe(true);
  });

  test('REQ-009 · without a width it renders deferred on the server, with no NaN', () => {
    const markup = renderToStaticMarkup(<LineChart id="sp-deferred" />);
    expect(markup).toMatch(/data-status="deferred"/);
    expect(markup).not.toMatch(/NaN/);
  });

  test('REQ-009 · the container is measured with ResizeObserver and the chart re-renders at that width', () => {
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
    const host = mount(<LineChart id="sp-measured" />);
    expect(host.querySelector('.sp-root')?.getAttribute('data-status')).toBe('deferred');
    act(() => notify(400));
    expect(host.querySelector('svg.sp-chart')?.getAttribute('viewBox')).toMatch(/^0 0 400 /);
  });

  test('API §8.1 · the provider supplies ground, substrate and mode; a prop wins over it', () => {
    const host = mount(
      <SilverpointProvider substrate="ochre" mode="precision">
        <LineChart {...fixed} />
        <LineChart {...fixed} id="sp-second" substrate="blue" />
      </SilverpointProvider>,
    );
    const [first, second] = host.querySelectorAll('svg.sp-chart');
    expect(first?.getAttribute('data-substrate')).toBe('ochre');
    expect(first?.getAttribute('data-mode')).toBe('precision');
    expect(second?.getAttribute('data-substrate')).toBe('blue');
  });

  test('REQ-123 · prefers-contrast: more switches to precision, over the prop', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-contrast: more'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }));
    const host = mount(<LineChart {...fixed} mode="ink" />);
    expect(host.querySelector('svg.sp-chart')?.getAttribute('data-mode')).toBe('precision');
  });

  test('API §8.1 · the ref exposes getGeometry() and toSVGString(), and nothing else', () => {
    const ref = createRef<ChartHandle>();
    mount(<LineChart {...fixed} ref={ref} />);
    expect(Object.keys(ref.current ?? {}).sort()).toEqual(['getGeometry', 'toSVGString']);
    expect(ref.current?.getGeometry().viewBox.width).toBe(320);
    expect(compareSvg(ref.current?.toSVGString() ?? '', canonical(fixed)).equal).toBe(true);
  });

  test('REQ-060 · consumer data is drawn through accessor keys', () => {
    const data = [
      { day: 'Mon', hits: 3 },
      { day: 'Tue', hits: 5 },
    ];
    const props = { ...fixed, data, xKey: 'day', valueKey: 'hits' };
    expect(compareSvg(renderToStaticMarkup(<LineChart {...props} />), canonical(props)).equal).toBe(true);
  });
});
