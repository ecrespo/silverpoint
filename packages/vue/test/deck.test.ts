import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp, createSSRApp, h, nextTick, reactive, type App } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { compareSvg } from '../../../tools/svg-normalizer/normalize';
import { SpDeck } from '../src/deck';
import { CHART_LOADERS } from '../src/deck/chart-loaders';
import { SilverpointProvider } from '../src/provider';

/* Vue `SpDeck` (T-274; REQ-593, REQ-598, REQ-606, REQ-608, REQ-610..REQ-612). */

const fence = '```silverpoint\n{"chart":"donut-chart","props":{"title":"Share"}}\n```';
const MD = `# Opening\n\n${fence}\n\n---\n\n## Middle\n\n* a\n* b\n\n---\n\n# End`;

let app: App | undefined;
let host: HTMLElement;
afterEach(() => {
  app?.unmount();
  app = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

/** Mounts `SpDeck` with reactive props, so a test can change them. */
async function mount(initial: Record<string, unknown>) {
  const props = reactive({ ...initial });
  host = document.createElement('div');
  document.body.append(host);
  app = createApp({ render: () => h(SpDeck, props as never) });
  app.mount(host);
  await nextTick();
  await new Promise((r) => setTimeout(r, 0));
  return props;
}
const deck = () => host.querySelector<HTMLElement>('.sp-deck')!;
const key = async (k: string) => {
  deck().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  await nextTick();
};
const hydrated = (slot: string) => vi.waitFor(() => expect(host.querySelector(`[data-sp-slot="${slot}"]`)!.hasAttribute('data-sp-hydrated')).toBe(true), { timeout: 5000 });

describe('SpDeck — server render (REQ-612, REQ-614)', () => {
  test('REQ-612 · renders on the server: region, current slide, static chart, scoped style, controls without fullscreen', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(SpDeck, { markdown: MD, id: 'd1' }) }));
    expect(html).toMatch(/<div class="sp-deck sp-ground-silverpoint" part="sp-deck" role="region" aria-roledescription="slide deck" aria-label="Opening" tabindex="0"/);
    expect(html).toContain('data-sp-page="1"');
    expect(html).toContain('<style>');
    expect(html).toMatch(/<div class="sp-deck-slide" data-sp-slide="1" data-sp-current(="")?>/);
    expect(html).toMatch(/<div class="sp-deck-slide" data-sp-slide="2" hidden(="")? inert(="")?>/);
    expect(html).toContain('data-sp-slot="s1-c1"');
    expect(html).toContain('aria-label="Next slide"');
    expect(html).not.toContain('aria-label="Full screen"');
    expect(html).toContain('Slide 1 of 3');
  });

  test('REQ-608 · provider defaults reach the slides; the deck’s own props win', async () => {
    const under = (deckProps: Record<string, unknown>) =>
      renderToString(createSSRApp({ render: () => h(SilverpointProvider, { ground: 'cyanotype' }, () => h(SpDeck, { markdown: '# A', ...deckProps })) }));
    expect(await under({ id: 'd2' })).toContain('data-sp-ground="cyanotype"');
    expect(await under({ id: 'd3', ground: 'silverpoint' })).toContain('data-sp-ground="silverpoint"');
  });
});

describe('SpDeck — client (REQ-593, REQ-598, REQ-606, REQ-610, REQ-611)', () => {
  test('REQ-598 · REQ-606 · uncontrolled: keys move the deck; events are plain objects; v-model:page follows', async () => {
    const onPageChange = vi.fn();
    const onFragmentChange = vi.fn();
    const onReady = vi.fn();
    const onUpdatePage = vi.fn();
    await mount({ markdown: MD, id: 'c1', onPageChange, onFragmentChange, onReady, 'onUpdate:page': onUpdatePage });
    expect(onReady).toHaveBeenCalledWith({ total: 3 });
    await key('ArrowRight');
    expect(onPageChange).toHaveBeenLastCalledWith({ page: 2, total: 3 });
    expect(onUpdatePage).toHaveBeenLastCalledWith(2);
    expect(onFragmentChange).toHaveBeenLastCalledWith({ page: 2, step: 0, steps: 2 });
    expect(deck().getAttribute('data-sp-page')).toBe('2');
    expect(host.querySelector('[data-sp-slide="2"]')!.hasAttribute('data-sp-current')).toBe(true);
    expect(host.querySelector('[data-sp-slide="1"]')!.hasAttribute('hidden')).toBe(true);
    expect(host.querySelector('.sp-deck-status')!.textContent).toBe('Slide 2 of 3');
    await key('ArrowRight');
    expect(host.querySelector('[data-sp-slide="2"] [data-marpit-fragment="1"]')!.hasAttribute('data-sp-pending')).toBe(false);
  });

  test('REQ-598 · controlled: a move asks the parent, and lands when it answers', async () => {
    const onPageChange = vi.fn();
    const props = await mount({ markdown: MD, id: 'c2', page: 2, onPageChange });
    await key('ArrowLeft');
    expect(onPageChange).toHaveBeenLastCalledWith({ page: 1, total: 3 });
    expect(deck().getAttribute('data-sp-page')).toBe('2');
    props.page = 1;
    await nextTick();
    await nextTick();
    expect(deck().getAttribute('data-sp-page')).toBe('1');
  });

  test('REQ-613 · the control buttons drive the deck', async () => {
    await mount({ markdown: MD, id: 'c3' });
    host.querySelector<HTMLButtonElement>('[data-sp-action="next"]')!.click();
    await nextTick();
    expect(deck().getAttribute('data-sp-page')).toBe('2');
    host.querySelector<HTMLButtonElement>('[data-sp-action="overview"]')!.click();
    await nextTick();
    expect(deck().getAttribute('data-sp-overview')).toBe('true');
    expect(host.querySelectorAll('.sp-deck-thumb')).toHaveLength(3);
  });

  test('REQ-593 · each slot hydrates with the Vue chart, once, in place of the static one', async () => {
    const load = vi.spyOn(CHART_LOADERS, 'donut-chart');
    await mount({ markdown: MD, id: 'c4' });
    await hydrated('s1-c1');
    expect(load).toHaveBeenCalledTimes(1);
    expect(host.querySelectorAll('[data-sp-slot="s1-c1"] .sp-root')).toHaveLength(1);
  });

  test('Art. 3 · REQ-593 · the hydrated chart draws the static chart’s tree', async () => {
    await mount({ markdown: MD, id: 'c8', interactive: false });
    const staticSvg = host.querySelector('[data-sp-slot="s1-c1"] svg.sp-chart')!.outerHTML;
    app!.unmount();
    document.body.innerHTML = '';
    await mount({ markdown: MD, id: 'c8' });
    await hydrated('s1-c1');
    expect(compareSvg(host.querySelector('[data-sp-slot="s1-c1"] svg.sp-chart')!.outerHTML, staticSvg)).toEqual({ equal: true });
  });

  test('REQ-594 · interactive: false keeps the static chart', async () => {
    const load = vi.spyOn(CHART_LOADERS, 'donut-chart');
    await mount({ markdown: MD, id: 'c5', interactive: false });
    expect(load).not.toHaveBeenCalled();
    expect(host.querySelector('[data-sp-slot="s1-c1"]')!.hasAttribute('data-sp-hydrated')).toBe(false);
    expect(host.querySelectorAll('[data-sp-slot="s1-c1"] .sp-root')).toHaveLength(1);
  });

  test('REQ-610 · new markdown re-renders, re-hydrates and keeps the page, clamped', async () => {
    const onReady = vi.fn();
    const props = await mount({ markdown: MD, id: 'c6', onReady });
    await key('End');
    expect(deck().getAttribute('data-sp-page')).toBe('3');
    props.markdown = `# New\n\n${fence}\n\n---\n\n# Two`;
    await nextTick();
    await nextTick();
    await hydrated('s1-c1');
    expect(deck().getAttribute('data-sp-page')).toBe('2');
    expect(onReady).toHaveBeenLastCalledWith({ total: 2 });
    expect(host.querySelectorAll('.sp-deck-slide')).toHaveLength(2);
    expect(host.querySelectorAll('[data-sp-slot="s1-c1"] .sp-root')).toHaveLength(1);
  });

  test('REQ-611 · unmount leaves nothing on document or window', async () => {
    // The listeners added while the deck lives; one removed is gone. Others predate the test.
    const live = new Set<unknown>();
    for (const target of [document, window] as EventTarget[]) {
      const add = target.addEventListener.bind(target);
      const remove = target.removeEventListener.bind(target);
      vi.spyOn(target, 'addEventListener').mockImplementation((...a: Parameters<EventTarget['addEventListener']>) => (live.add(a[1]), add(...a)));
      vi.spyOn(target, 'removeEventListener').mockImplementation((...a: Parameters<EventTarget['removeEventListener']>) => (live.delete(a[1]), remove(...a)));
    }
    await mount({ markdown: MD, id: 'c7', hash: true });
    await hydrated('s1-c1');
    expect(live.size).toBeGreaterThan(0);
    const slot = host.querySelector('[data-sp-slot="s1-c1"]') as HTMLElement & { _vnode?: unknown };
    expect(slot._vnode).toBeTruthy();
    app!.unmount();
    app = undefined;
    expect(live.size).toBe(0);
    // The chart rendered into the slot is unmounted too (`render(null, slot)`).
    expect(slot._vnode ?? null).toBeNull();
  });
});
