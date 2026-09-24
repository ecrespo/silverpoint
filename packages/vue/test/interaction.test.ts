import type { ActiveItem } from '@silverpoint/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import { SpLineChart } from '../src';

const fixed = { id: 'sp-interactive', width: 320, height: 160, chrome: 'bare' } as const;

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});

function mount(props: Record<string, unknown>, slots: Record<string, unknown> = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp({ render: () => h(SpLineChart, props, slots) });
  app.mount(host);
  cleanup.push(() => {
    app.unmount();
    host.remove();
  });
  const chartRoot = host.querySelector<HTMLElement>('.sp-root') as HTMLElement;
  const svg = host.querySelector('svg.sp-chart') as SVGSVGElement;
  const [, , width, height] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width, height, x: 0, y: 0, right: width, bottom: height, toJSON() {} }) as DOMRect;
  return { host, chartRoot };
}

async function fire(target: HTMLElement, event: Event) {
  target.dispatchEvent(event);
  await nextTick();
}

const move = (x: number, y: number) => new PointerEvent('pointermove', { clientX: x, clientY: y, pointerType: 'mouse', bubbles: true });
const keydown = (key: string) => new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });

function livePoint(host: HTMLElement): { x: number; y: number } {
  const d = host.querySelector('[part="sp-heighten"]')?.getAttribute('d') ?? '';
  const [mx, my] = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  return { x: (mx ?? 0) + 3.5, y: my ?? 0 };
}

describe('SpLineChart readout', () => {
  test('REQ-141 · hovering a point shows the readout and emits the active item', async () => {
    const onActiveChange = vi.fn<(item: ActiveItem | null) => void>();
    const { host, chartRoot } = mount({ ...fixed, onActiveChange });
    const { x, y } = livePoint(host);
    await fire(chartRoot, move(x, y));
    expect(onActiveChange).toHaveBeenLastCalledWith(expect.objectContaining({ seriesKey: 'hits', index: 11, value: 41 }));
    expect(host.querySelector('.sp-readout')?.textContent).toBe('22hits: 41');
    expect(host.querySelector('svg.sp-marker path')).not.toBeNull();
  });

  test('REQ-141 · keyboard focus and arrows surface the same readout as hover', async () => {
    const { host, chartRoot } = mount(fixed);
    expect(chartRoot.tabIndex).toBe(0);
    await fire(chartRoot, new FocusEvent('focus'));
    await fire(chartRoot, keydown('End'));
    const viaKeyboard = host.querySelector('.sp-readout')?.textContent;
    await fire(chartRoot, new FocusEvent('blur'));
    const { x, y } = livePoint(host);
    await fire(chartRoot, move(x, y));
    expect(host.querySelector('.sp-readout')?.textContent).toBe(viaKeyboard);
  });

  test('REQ-122 · the active point is announced through a polite live region', async () => {
    const { host, chartRoot } = mount(fixed);
    await fire(chartRoot, new FocusEvent('focus'));
    expect(host.querySelector('.sp-live')?.getAttribute('aria-live')).toBe('polite');
    expect(host.querySelector('.sp-live')?.textContent).toBe('hour 00, hits 18');
  });

  test('REQ-143 · leaving the drawing area emits null and leaves no residual state', async () => {
    const onActiveChange = vi.fn();
    const { host, chartRoot } = mount({ ...fixed, onActiveChange });
    const { x, y } = livePoint(host);
    await fire(chartRoot, move(x, y));
    await fire(chartRoot, new PointerEvent('pointerleave', { bubbles: false }));
    expect(onActiveChange).toHaveBeenLastCalledWith(null);
    expect(host.querySelector('.sp-readout')).toBeNull();
    expect(host.querySelector('svg.sp-marker')).toBeNull();
    expect(host.querySelector('.sp-live')?.textContent).toBe('');
  });

  test('REQ-143 · losing focus emits null', async () => {
    const onActiveChange = vi.fn();
    const { chartRoot } = mount({ ...fixed, onActiveChange });
    await fire(chartRoot, new FocusEvent('focus'));
    await fire(chartRoot, new FocusEvent('blur'));
    expect(onActiveChange).toHaveBeenLastCalledWith(null);
  });

  test('API §9 · Enter selects the active item', async () => {
    const onSelect = vi.fn();
    const { chartRoot } = mount({ ...fixed, onSelect });
    await fire(chartRoot, new FocusEvent('focus'));
    await fire(chartRoot, keydown('Enter'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
  });

  test('REQ-142 · a #tooltip slot replaces the built-in readout', async () => {
    const { host, chartRoot } = mount(fixed, {
      tooltip: ({ active }: { active: ActiveItem }) => h('strong', { class: 'mine' }, `#${active.index}`),
    });
    await fire(chartRoot, new FocusEvent('focus'));
    expect(host.querySelector('.mine')?.textContent).toBe('#0');
    expect(host.querySelector('.sp-readout-heading')).toBeNull();
  });
});
