import type { ActiveItem } from '@silverpoint/core';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { LineChart } from '../src';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fixed = { id: 'sp-interactive', width: 320, height: 160, chrome: 'bare' } as const;

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});

function mount(element: React.ReactElement) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(element));
  cleanup.push(() => {
    act(() => root.unmount());
    host.remove();
  });
  const chartRoot = host.querySelector<HTMLElement>('.sp-root') as HTMLElement;
  const svg = host.querySelector('svg.sp-chart') as SVGSVGElement;
  // The drawing is laid out at its viewBox size, at the page origin.
  const [, , width, height] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width, height, x: 0, y: 0, right: width, bottom: height, toJSON() {} }) as DOMRect;
  return { host, chartRoot };
}

/** A hit area of the rendered chart, read back from the ref-free DOM: the last primary point. */
function pointer(chartRoot: HTMLElement, type: string, x: number, y: number) {
  act(() => {
    chartRoot.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerType: 'mouse', bubbles: true }));
  });
}

function key(chartRoot: HTMLElement, name: string) {
  act(() => {
    chartRoot.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
  });
}

/** Coordinates of the heightened live point, the last value of the primary series. */
function livePoint(host: HTMLElement): { x: number; y: number } {
  const d = host.querySelector('[part="sp-heighten"]')?.getAttribute('d') ?? '';
  const [mx, my] = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  return { x: (mx ?? 0) + 3.5, y: my ?? 0 };
}

describe('LineChart readout', () => {
  test('REQ-141 · hovering a point shows the readout and emits the active item', () => {
    const onActiveChange = vi.fn<(item: ActiveItem | null) => void>();
    const { host, chartRoot } = mount(<LineChart {...fixed} onActiveChange={onActiveChange} />);
    const { x, y } = livePoint(host);
    pointer(chartRoot, 'pointermove', x, y);
    expect(onActiveChange).toHaveBeenLastCalledWith(expect.objectContaining({ seriesKey: 'hits', index: 11, value: 41 }));
    expect(host.querySelector('.sp-readout')?.textContent).toBe('22hits: 41');
    expect(host.querySelector('svg.sp-marker path')).not.toBeNull();
  });

  test('REQ-141 · keyboard focus and arrows surface the same readout as hover', () => {
    const onActiveChange = vi.fn();
    const { host, chartRoot } = mount(<LineChart {...fixed} onActiveChange={onActiveChange} />);
    expect(chartRoot.tabIndex).toBe(0);
    act(() => chartRoot.focus());
    key(chartRoot, 'End');
    const viaKeyboard = host.querySelector('.sp-readout')?.textContent;
    act(() => chartRoot.blur());
    const { x, y } = livePoint(host);
    pointer(chartRoot, 'pointermove', x, y);
    expect(host.querySelector('.sp-readout')?.textContent).toBe(viaKeyboard);
  });

  test('REQ-122 · the active point is announced through a polite live region', () => {
    const { host, chartRoot } = mount(<LineChart {...fixed} />);
    act(() => chartRoot.focus());
    expect(host.querySelector('.sp-live')?.getAttribute('aria-live')).toBe('polite');
    expect(host.querySelector('.sp-live')?.textContent).toBe('hour 00, hits 18');
  });

  test('REQ-143 · leaving the drawing area emits null and leaves no residual state', () => {
    const onActiveChange = vi.fn();
    const { host, chartRoot } = mount(<LineChart {...fixed} onActiveChange={onActiveChange} />);
    const { x, y } = livePoint(host);
    pointer(chartRoot, 'pointermove', x, y);
    // React derives onPointerLeave from `pointerout` towards an element outside the root.
    act(() => {
      chartRoot.dispatchEvent(new PointerEvent('pointerout', { clientX: -1, clientY: -1, bubbles: true, relatedTarget: document.body }));
    });
    expect(onActiveChange).toHaveBeenLastCalledWith(null);
    expect(host.querySelector('.sp-readout')).toBeNull();
    expect(host.querySelector('svg.sp-marker')).toBeNull();
    expect(host.querySelector('.sp-live')?.textContent).toBe('');
  });

  test('REQ-143 · losing focus emits null', () => {
    const onActiveChange = vi.fn();
    const { chartRoot } = mount(<LineChart {...fixed} onActiveChange={onActiveChange} />);
    act(() => chartRoot.focus());
    act(() => chartRoot.blur());
    expect(onActiveChange).toHaveBeenLastCalledWith(null);
  });

  test('API §9 · Enter selects the active item', () => {
    const onSelect = vi.fn();
    const { chartRoot } = mount(<LineChart {...fixed} onSelect={onSelect} />);
    act(() => chartRoot.focus());
    key(chartRoot, 'Enter');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
  });

  test('REQ-142 · a consumer-supplied readout replaces the built-in one', () => {
    const { host, chartRoot } = mount(
      <LineChart {...fixed} tooltip={(active) => <strong className="mine">{`#${active.index}`}</strong>} />,
    );
    act(() => chartRoot.focus());
    expect(host.querySelector('.mine')?.textContent).toBe('#0');
    expect(host.querySelector('.sp-readout-heading')).toBeNull();
  });
});
