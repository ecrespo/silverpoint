/**
 * T-187 · `onRootChange` of the two drillable charts (REQ-439, REQ-108): activating a node emits its
 * id, the drawn root emits its parent, and the component keeps no root of its own, so the server
 * render with `rootId` draws what the client render does (I-30).
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SquarifiedTreemap, SunburstChart } from '../src';
import { SquarifiedTreemap as ServerSquarifiedTreemap } from '../src/server/squarified-treemap';
import { SunburstChart as ServerSunburstChart } from '../src/server/sunburst-chart';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fixed = { id: 'sp-drill', width: 420, height: 240, chrome: 'bare' } as const;

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
  return { host, chartRoot: host.querySelector<HTMLElement>('.sp-root') as HTMLElement, rerender: (next: React.ReactElement) => act(() => root.render(next)) };
}

function keys(chartRoot: HTMLElement, ...names: string[]) {
  act(() => chartRoot.focus());
  for (const name of names) act(() => void chartRoot.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true })));
}

const paths = (root: ParentNode) => [...root.querySelectorAll('svg.sp-chart path')].map((p) => p.getAttribute('d'));

describe.each([
  ['SquarifiedTreemap', SquarifiedTreemap, ServerSquarifiedTreemap],
  ['SunburstChart', SunburstChart, ServerSunburstChart],
] as const)('%s · onRootChange (T-187)', (_name, Chart, ServerChart) => {
  test('REQ-439 · Enter on a node emits its id, alongside onSelect', () => {
    const onRootChange = vi.fn<(id: string | null) => void>();
    const onSelect = vi.fn();
    const { chartRoot } = mount(<Chart {...fixed} onRootChange={onRootChange} onSelect={onSelect} />);
    keys(chartRoot, 'Home', 'ArrowDown', 'Enter');
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onRootChange).toHaveBeenCalledWith((onSelect.mock.calls[0]?.[0] as { datum: { id: string } }).datum.id);
  });

  test('REQ-439 · REQ-108 · the drawn root emits its parent; the chart redraws only when rootId changes', () => {
    const onRootChange = vi.fn<(id: string | null) => void>();
    const { host, chartRoot, rerender } = mount(<Chart {...fixed} rootId="works-01" onRootChange={onRootChange} />);
    const before = paths(host);
    keys(chartRoot, 'Home', 'Enter');
    expect(onRootChange).toHaveBeenLastCalledWith('works');
    // Controlled: emitting changes nothing until the consumer passes the new root back.
    expect(paths(host)).toEqual(before);
    rerender(<Chart {...fixed} rootId="works" onRootChange={onRootChange} />);
    expect(paths(host)).not.toEqual(before);
    keys(chartRoot, 'Home', 'Enter');
    expect(onRootChange).toHaveBeenLastCalledWith(null);
  });

  test('REQ-439 · I-30 · the server render with rootId draws what the client render does', () => {
    const { host } = mount(<Chart {...fixed} rootId="parks" />);
    const server = document.createElement('div');
    server.innerHTML = renderToStaticMarkup(<ServerChart {...fixed} rootId="parks" />);
    expect(paths(server)).toEqual(paths(host));
  });
});
