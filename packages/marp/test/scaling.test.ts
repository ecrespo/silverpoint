// @vitest-environment happy-dom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createDeckEngine } from '../src';
import { applyFragments, applyScaling, findChartSlots } from '../src/client';

/* Scaling, chart slots and fragments in the DOM (T-270, REQ-597, REQ-617, REQ-592, DD-051, DD-057). */

class FakeObserver {
  static instances: FakeObserver[] = [];
  observed: Element[] = [];
  disconnected = false;
  constructor(readonly callback: ResizeObserverCallback) {
    FakeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
  fire(width: number) {
    this.callback([{ contentRect: { width } } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  FakeObserver.instances = [];
  document.body.innerHTML = '';
});

const FENCE = '```silverpoint\n{"chart":"donut-chart","props":{"title":"T"}}\n```';
function mountDeck(md: string, size: '16:9' | '4:3' = '16:9') {
  const out = createDeckEngine({ id: 'k', size }).render(md);
  // The engine's own output, as an adapter writes it (fixture HTML from our renderer, not user input).
  document.body.innerHTML = `<div class="sp-deck"><div class="sp-deck-viewport"><div class="sp-deck-k">${out.slides.map((s) => s.html).join('')}</div></div></div>`;
  return { out, root: document.querySelector<HTMLElement>('.sp-deck')!, viewport: document.querySelector<HTMLElement>('.sp-deck-viewport')! };
}

describe('applyScaling (REQ-617, DD-051)', () => {
  test('REQ-617 · one ResizeObserver on the viewport; --sp-deck-scale is width / slide width; data-sp-scaled', () => {
    vi.stubGlobal('ResizeObserver', FakeObserver);
    const { viewport } = mountDeck('# A\n\n---\n\n# B');
    const cleanup = applyScaling(viewport);
    expect(FakeObserver.instances).toHaveLength(1);
    expect(FakeObserver.instances[0]!.observed).toEqual([viewport]);
    expect(viewport.hasAttribute('data-sp-scaled')).toBe(true);
    FakeObserver.instances[0]!.fire(640);
    expect(viewport.style.getPropertyValue('--sp-deck-scale')).toBe('0.5');
    FakeObserver.instances[0]!.fire(1000);
    expect(viewport.style.getPropertyValue('--sp-deck-scale')).toBe('0.7813');
    cleanup();
    expect(FakeObserver.instances[0]!.disconnected).toBe(true);
    expect(viewport.hasAttribute('data-sp-scaled')).toBe(false);
    expect(viewport.style.getPropertyValue('--sp-deck-scale')).toBe('');
  });

  test('REQ-617 · 4:3 decks scale from 960', () => {
    vi.stubGlobal('ResizeObserver', FakeObserver);
    const { viewport } = mountDeck('# A', '4:3');
    applyScaling(viewport);
    FakeObserver.instances[0]!.fire(480);
    expect(viewport.style.getPropertyValue('--sp-deck-scale')).toBe('0.5');
  });

  test('REQ-617 · a zero width (a hidden deck) keeps the last scale', () => {
    vi.stubGlobal('ResizeObserver', FakeObserver);
    const { viewport } = mountDeck('# A');
    applyScaling(viewport);
    FakeObserver.instances[0]!.fire(640);
    FakeObserver.instances[0]!.fire(0);
    expect(viewport.style.getPropertyValue('--sp-deck-scale')).toBe('0.5');
  });

  test('REQ-617 · without ResizeObserver the server markup’s native viewBox scaling stays: no flag', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { viewport } = mountDeck('# A');
    const cleanup = applyScaling(viewport);
    expect(viewport.hasAttribute('data-sp-scaled')).toBe(false);
    expect(() => cleanup()).not.toThrow();
  });
});

describe('findChartSlots (REQ-592)', () => {
  test('REQ-592 · every slot with a spec, in document order; error figures are not slots to hydrate', () => {
    const md = [FENCE, '```silverpoint\n{"chart":"nope"}\n```', `## Two\n\n${FENCE}`].join('\n\n---\n\n');
    const { root } = mountDeck(md);
    const slots = findChartSlots(root);
    expect(slots.map((s) => s.slotId)).toEqual(['s1-c1', 's3-c1']);
    expect(slots[0]!.spec).toEqual({ chart: 'donut-chart', props: { title: 'T' } });
    expect(slots[0]!.element.localName).toBe('figure');
  });

  test('a slot whose data-sp-spec is not JSON is skipped, not thrown', () => {
    document.body.innerHTML = '<figure data-sp-slot="s1-c1" data-sp-spec="{oops"></figure><figure data-sp-slot="s1-c2" data-sp-spec="[1]"></figure>';
    expect(findChartSlots(document.body)).toEqual([]);
  });
});

describe('fragments (REQ-597, DD-057)', () => {
  const md = '# A\n\n* a\n* b\n* c\n\n---\n\n* x\n* y';

  test('REQ-597 · the engine marks every fragment pending: every slide starts at step 0, so the first paint is final', () => {
    const { out } = mountDeck(md);
    expect(out.slides[0]!.html.match(/data-marpit-fragment="\d" data-sp-pending=""/g)).toHaveLength(3);
    expect(createDeckEngine({ id: 'k' }).render('- a').slides[0]!.html).not.toContain('data-sp-pending');
  });

  test('REQ-597 · applyFragments moves data-sp-pending on the current slide: fragment k is shown iff k ≤ step', () => {
    const { root } = mountDeck(md);
    const pending = (slide: number) => [...root.querySelectorAll('.sp-deck-slide')[slide - 1]!.querySelectorAll('[data-marpit-fragment]')].map((el) => el.hasAttribute('data-sp-pending'));
    applyFragments(root, 1, 2);
    expect(pending(1)).toEqual([false, false, true]);
    applyFragments(root, 1, 0);
    expect(pending(1)).toEqual([true, true, true]);
    applyFragments(root, 2, 2);
    expect(pending(2)).toEqual([false, false]);
    expect(pending(1)).toEqual([true, true, true]);
  });

  test('applyFragments on a page that is not rendered does nothing', () => {
    const { root } = mountDeck(md);
    expect(() => applyFragments(root, 9, 1)).not.toThrow();
  });
});
