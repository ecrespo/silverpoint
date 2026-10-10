/**
 * T-187 · `@root-change` of the two drillable charts (REQ-439, REQ-108): activating a node emits its
 * id, the drawn root emits its parent, and the component holds no root ref (I-30), so the server
 * render with `rootId` draws what the client render does.
 */
import { renderToString } from 'vue/server-renderer';
import { afterEach, describe, expect, test } from 'vitest';
import { createApp, createSSRApp, h, nextTick, ref, type Component } from 'vue';
import { SpSquarifiedTreemap, SpSunburstChart } from '../src';

const fixed = { id: 'sp-drill', width: 420, height: 240, chrome: 'bare' } as const;

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});

function mount(chart: Component, rootId: string | null | undefined) {
  const host = document.createElement('div');
  document.body.append(host);
  const emitted: (string | null)[] = [];
  const selected: unknown[] = [];
  const current = ref(rootId);
  const app = createApp({
    render: () => h(chart, { ...fixed, rootId: current.value, onRootChange: (id: string | null) => emitted.push(id), onSelect: (item: unknown) => selected.push(item) }),
  });
  app.mount(host);
  cleanup.push(() => {
    app.unmount();
    host.remove();
  });
  return { host, chartRoot: host.querySelector<HTMLElement>('.sp-root') as HTMLElement, emitted, selected, current };
}

async function keys(chartRoot: HTMLElement, ...names: string[]) {
  chartRoot.dispatchEvent(new FocusEvent('focus'));
  for (const key of names) {
    chartRoot.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    await nextTick();
  }
}

const paths = (root: ParentNode) => [...root.querySelectorAll('svg.sp-chart path')].map((p) => p.getAttribute('d'));

describe.each([
  ['SpSquarifiedTreemap', SpSquarifiedTreemap],
  ['SpSunburstChart', SpSunburstChart],
] as const)('%s · @root-change (T-187)', (_name, chart) => {
  test('REQ-439 · Enter on a node emits its id, alongside select', async () => {
    const { chartRoot, emitted, selected } = mount(chart, undefined);
    await keys(chartRoot, 'Home', 'ArrowDown', 'Enter');
    expect(selected).toHaveLength(1);
    expect(emitted).toEqual([(selected[0] as { datum: { id: string } }).datum.id]);
  });

  test('REQ-439 · REQ-108 · the drawn root emits its parent; the chart redraws only when rootId changes', async () => {
    const { host, chartRoot, emitted, current } = mount(chart, 'works-01');
    const before = paths(host);
    await keys(chartRoot, 'Home', 'Enter');
    expect(emitted).toEqual(['works']);
    expect(paths(host)).toEqual(before);
    current.value = 'works';
    await nextTick();
    expect(paths(host)).not.toEqual(before);
    await keys(chartRoot, 'Home', 'Enter');
    expect(emitted).toEqual(['works', null]);
  });

  test('REQ-439 · I-30 · the server render with rootId draws what the client render does', async () => {
    const { host } = mount(chart, 'parks');
    const server = document.createElement('div');
    server.innerHTML = await renderToString(createSSRApp({ render: () => h(chart, { ...fixed, rootId: 'parks' }) }));
    expect(paths(server)).toEqual(paths(host));
  });
});
