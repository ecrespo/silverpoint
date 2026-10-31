import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { SpDeck, type SpDeckProps } from '../src/deck';
import { CHART_LOADERS } from '../src/deck/chart-loaders';
import { SilverpointProvider } from '../src/provider';
import { compareSvg } from '../../../tools/svg-normalizer/normalize';

/* React `SpDeck` (T-273; REQ-593, REQ-598, REQ-606, REQ-608..REQ-612). */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fence = '```silverpoint\n{"chart":"donut-chart","props":{"title":"Share"}}\n```';
const MD = `# Opening\n\n${fence}\n\n---\n\n## Middle\n\n* a\n* b\n\n---\n\n# End`;

let host: HTMLElement;
let root: Root | undefined;
beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
});
afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function mount(element: React.ReactElement) {
  root = createRoot(host);
  await act(async () => root!.render(element));
  // The chart modules load lazily: let them resolve and mount.
  await act(async () => new Promise((r) => setTimeout(r, 0)));
}
/** Waits until the slot's chart module has loaded and mounted. */
const hydrated = (slot: string) =>
  act(async () => vi.waitFor(() => expect(host.querySelector(`[data-sp-slot="${slot}"]`)!.hasAttribute('data-sp-hydrated')).toBe(true), { timeout: 5000 }));
const deck = () => host.querySelector<HTMLElement>('.sp-deck')!;
const key = (k: string) => act(() => void deck().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true })));

describe('SpDeck — server render (REQ-612, REQ-614)', () => {
  test('REQ-612 · renders on the server: region, current slide, static chart, scoped style, controls without fullscreen', () => {
    const html = renderToString(<SpDeck markdown={MD} id="d1" />);
    expect(html).toMatch(/<div class="sp-deck sp-ground-silverpoint" part="sp-deck" role="region" aria-roledescription="slide deck" aria-label="Opening" tabindex="0"/);
    expect(html).toContain('data-sp-page="1"');
    expect(html).toContain('<style>');
    expect(html).toMatch(/<div class="sp-deck-slide" data-sp-slide="1" data-sp-current="">/);
    expect(html).toMatch(/<div class="sp-deck-slide" data-sp-slide="2" hidden="" inert="">/);
    expect(html).toContain('data-sp-slot="s1-c1"');
    expect(html).toContain('class="sp-root');
    expect(html).toContain('aria-label="Next slide"');
    expect(html).not.toContain('aria-label="Full screen"');
    expect(html).toContain('Slide 1 of 3');
  });

  test('REQ-608 · provider defaults reach the slides; the deck’s own props win', () => {
    const html = renderToString(
      <SilverpointProvider ground="cyanotype">
        <SpDeck markdown="# A" id="d2" />
      </SilverpointProvider>,
    );
    expect(html).toContain('data-sp-ground="cyanotype"');
    expect(renderToString(<SilverpointProvider ground="cyanotype"><SpDeck markdown="# A" id="d3" ground="silverpoint" /></SilverpointProvider>)).toContain('data-sp-ground="silverpoint"');
  });
});

describe('SpDeck — client (REQ-593, REQ-598, REQ-606, REQ-610, REQ-611)', () => {
  test('REQ-598 · REQ-606 · uncontrolled: keys move the deck and the events carry plain objects', async () => {
    const onPageChange = vi.fn();
    const onFragmentChange = vi.fn();
    const onReady = vi.fn();
    await mount(<SpDeck markdown={MD} id="c1" onPageChange={onPageChange} onFragmentChange={onFragmentChange} onReady={onReady} />);
    expect(onReady).toHaveBeenCalledWith({ total: 3 });
    key('ArrowRight');
    expect(onPageChange).toHaveBeenLastCalledWith({ page: 2, total: 3 });
    expect(onFragmentChange).toHaveBeenLastCalledWith({ page: 2, step: 0, steps: 2 });
    expect(deck().getAttribute('data-sp-page')).toBe('2');
    expect(host.querySelector('[data-sp-slide="2"]')!.hasAttribute('data-sp-current')).toBe(true);
    expect(host.querySelector('[data-sp-slide="1"]')!.hasAttribute('hidden')).toBe(true);
    expect(host.querySelector('.sp-deck-status')!.textContent).toBe('Slide 2 of 3');
    key('ArrowRight');
    expect(host.querySelector('[data-sp-slide="2"] [data-marpit-fragment="1"]')!.hasAttribute('data-sp-pending')).toBe(false);
  });

  test('REQ-598 · controlled: a move asks the parent, and lands when it answers', async () => {
    const onPageChange = vi.fn();
    await mount(<SpDeck markdown={MD} id="c2" page={2} onPageChange={onPageChange} />);
    key('ArrowLeft');
    expect(onPageChange).toHaveBeenLastCalledWith({ page: 1, total: 3 });
    expect(deck().getAttribute('data-sp-page')).toBe('2');
    await act(async () => root!.render(<SpDeck markdown={MD} id="c2" page={1} onPageChange={onPageChange} />));
    expect(deck().getAttribute('data-sp-page')).toBe('1');
  });

  test('REQ-613 · the control buttons drive the deck', async () => {
    await mount(<SpDeck markdown={MD} id="c3" />);
    act(() => host.querySelector<HTMLButtonElement>('[data-sp-action="next"]')!.click());
    expect(deck().getAttribute('data-sp-page')).toBe('2');
    act(() => host.querySelector<HTMLButtonElement>('[data-sp-action="overview"]')!.click());
    expect(deck().getAttribute('data-sp-overview')).toBe('true');
    expect(host.querySelectorAll('.sp-deck-thumb')).toHaveLength(3);
  });

  test('REQ-593 · each slot hydrates with the React chart, once, in place of the static one', async () => {
    const load = vi.spyOn(CHART_LOADERS, 'donut-chart');
    await mount(<SpDeck markdown={MD} id="c4" />);
    await hydrated('s1-c1');
    expect(load).toHaveBeenCalledTimes(1);
    const slot = host.querySelector('[data-sp-slot="s1-c1"]')!;
    expect(slot.querySelectorAll('.sp-root')).toHaveLength(1);
    expect(slot.hasAttribute('data-sp-hydrated')).toBe(true);
  });

  test('Art. 3 · REQ-593 · the hydrated chart draws the static chart’s tree', async () => {
    await mount(<SpDeck markdown={MD} id="c8" interactive={false} />);
    const staticSvg = host.querySelector('[data-sp-slot="s1-c1"] svg.sp-chart')!.outerHTML;
    act(() => root!.unmount());
    root = undefined;
    host.innerHTML = '';
    await mount(<SpDeck markdown={MD} id="c8" />);
    await hydrated('s1-c1');
    const live = host.querySelector('[data-sp-slot="s1-c1"] svg.sp-chart')!.outerHTML;
    expect(compareSvg(live, staticSvg)).toEqual({ equal: true });
  });

  test('REQ-594 · interactive: false keeps the static chart', async () => {
    const load = vi.spyOn(CHART_LOADERS, 'donut-chart');
    await mount(<SpDeck markdown={MD} id="c5" interactive={false} />);
    expect(load).not.toHaveBeenCalled();
    expect(host.querySelector('[data-sp-slot="s1-c1"]')!.hasAttribute('data-sp-hydrated')).toBe(false);
    expect(host.querySelectorAll('[data-sp-slot="s1-c1"] .sp-root')).toHaveLength(1);
  });

  test('REQ-610 · new markdown re-renders, re-hydrates and keeps the page, clamped', async () => {
    const onReady = vi.fn();
    await mount(<SpDeck markdown={MD} id="c6" onReady={onReady} />);
    key('End');
    expect(deck().getAttribute('data-sp-page')).toBe('3');
    await act(async () => root!.render(<SpDeck markdown={`# New\n\n${fence}\n\n---\n\n# Two`} id="c6" onReady={onReady} />));
    await hydrated('s1-c1');
    expect(deck().getAttribute('data-sp-page')).toBe('2');
    expect(onReady).toHaveBeenLastCalledWith({ total: 2 });
    expect(host.querySelectorAll('.sp-deck-slide')).toHaveLength(2);
    expect(host.querySelectorAll('[data-sp-slot="s1-c1"] .sp-root')).toHaveLength(1);
  });

  test('REQ-611 · unmount leaves nothing on document or window', async () => {
    let live = 0;
    for (const target of [document, window] as EventTarget[]) {
      const add = target.addEventListener.bind(target);
      const remove = target.removeEventListener.bind(target);
      vi.spyOn(target, 'addEventListener').mockImplementation((...a: Parameters<EventTarget['addEventListener']>) => (live++, add(...a)));
      vi.spyOn(target, 'removeEventListener').mockImplementation((...a: Parameters<EventTarget['removeEventListener']>) => (live--, remove(...a)));
    }
    await mount(<SpDeck markdown={MD} id="c7" hash />);
    act(() => root!.unmount());
    root = undefined;
    expect(live).toBe(0);
  });
});

test('REQ-609 · every prop is a string, a number, a boolean or a handler', () => {
  const sample: Required<SpDeckProps> = {
    markdown: '', page: 1, defaultPage: 1, id: '', label: '', theme: '', ground: '', substrate: '', mode: 'ink', palette: '', size: '16:9',
    showNotes: false, showControls: true, keyboard: true, swipe: true, hash: false, interactive: true,
    onPageChange: () => {}, onFragmentChange: () => {}, onReady: () => {},
  };
  for (const [name, value] of Object.entries(sample)) expect(['string', 'number', 'boolean', 'function'], name).toContain(typeof value);
});
