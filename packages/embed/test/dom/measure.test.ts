/** T-302 · measuring and forced precision (REQ-640, REQ-641). */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mount } from '../../src/client/index';
import { host } from './helpers';

type Callback = (entries: { contentRect: { width: number } }[]) => void;
const observers: { callback: Callback; disconnected: boolean }[] = [];
class FakeResizeObserver {
  private readonly record: { callback: Callback; disconnected: boolean };
  constructor(callback: Callback) {
    this.record = { callback, disconnected: false };
    observers.push(this.record);
  }
  observe() {}
  disconnect() {
    this.record.disconnected = true;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  observers.length = 0;
});

const width = (target: HTMLElement) => target.querySelector('svg.sp-chart')!.getAttribute('width');

describe('measuring', () => {
  test('REQ-640 · without width the chart takes its container’s measured width and follows it', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    const target = host();
    Object.defineProperty(target, 'clientWidth', { configurable: true, value: 360 });
    const handle = mount(target, { chart: 'bar-chart' });
    expect(width(target)).toBe('360');
    Object.defineProperty(handle.element, 'getClientRects', { configurable: true, value: () => [{}] });
    observers[0]!.callback([{ contentRect: { width: 520 } }]);
    expect(width(target)).toBe('520');
  });

  test('REQ-640 · a hidden container is not a measurement: the last width stands and nothing is raised', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    const target = host();
    Object.defineProperty(target, 'clientWidth', { configurable: true, value: 400 });
    const onDiagnostic = vi.fn();
    const handle = mount(target, { chart: 'bar-chart' }, { onDiagnostic });
    Object.defineProperty(handle.element, 'getClientRects', { configurable: true, value: () => [] });
    observers[0]!.callback([{ contentRect: { width: 0 } }]);
    expect(width(target)).toBe('400');
    expect(onDiagnostic.mock.calls.filter(([d]) => d.code === 'SP003')).toEqual([]);
  });

  test('REQ-640 · a fixed width is never measured', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    mount(host(), { chart: 'bar-chart', width: 300 });
    expect(observers).toHaveLength(0);
  });

  test('REQ-640 · an unmeasurable container (0 px) falls back to 480', () => {
    const target = host();
    Object.defineProperty(target, 'clientWidth', { configurable: true, value: 0 });
    mount(target, { chart: 'bar-chart' });
    expect(width(target)).toBe('480');
  });

  test('REQ-641 · prefers-contrast: more / forced-colors: active draw in precision, and a change redraws', () => {
    const listeners: (() => void)[] = [];
    const query = { matches: true, addEventListener: (_: string, f: () => void) => listeners.push(f), removeEventListener: vi.fn() };
    vi.stubGlobal('matchMedia', () => query);
    const target = host();
    mount(target, { chart: 'bar-chart', width: 320, mode: 'ink' });
    expect(target.querySelector('svg.sp-chart')!.getAttribute('data-mode')).toBe('precision');
    query.matches = false;
    for (const f of listeners) f();
    expect(target.querySelector('svg.sp-chart')!.getAttribute('data-mode')).toBe('ink');
  });
});
