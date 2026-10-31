// @vitest-environment happy-dom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createDeckEngine, deckView, hydrationPlan } from '../src';
import { attachDeck, createDeckController, type DeckController } from '../src/client';

/* attachDeck: what every adapter runs after mount (T-273..T-275, REQ-593, REQ-610, REQ-611). */

const fence = '```silverpoint\n{"chart":"donut-chart"}\n```';
const MD = `# One\n\n${fence}\n\n---\n\n* a\n* b\n\n${fence}\n\n---\n\n# Three`;

/** Writes the view as an adapter would (the engine's own markup, not user input). */
function mount(md = MD) {
  const render = createDeckEngine({ id: 'a1' }).render(md);
  const controller = createDeckController({ total: render.total, steps: render.slides.map((s) => s.fragments) });
  const view = deckView(render, controller.state, { showControls: true, fullscreenAvailable: false, ground: 'silverpoint', substrate: 'cream', mode: 'ink' });
  document.body.innerHTML = `<div class="sp-deck" tabindex="0"><div class="sp-deck-viewport"><div class="${view.container.class}">${view.slides
    .map((s) => `<div class="sp-deck-slide" data-sp-slide="${s.attrs['data-sp-slide']}">${s.html}</div>`)
    .join('')}</div></div></div>`;
  return { render, controller, root: document.querySelector<HTMLElement>('.sp-deck')! };
}

let controller: DeckController | undefined;
afterEach(() => {
  controller?.destroy();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('attachDeck', () => {
  test('REQ-593 · every planned slot is mounted with its element and entry; REQ-594 · no plan, no mount', () => {
    const m = mount();
    controller = m.controller;
    const mounted: [string, string][] = [];
    const cleanup = attachDeck(m.root, m.controller, { keyboard: true, swipe: true, hash: false }, {
      plan: hydrationPlan(m.render),
      mountChart: (element, entry) => {
        mounted.push([element.getAttribute('data-sp-slot')!, entry.props.id]);
        return () => {};
      },
    });
    expect(mounted).toEqual([['s1-c1', 'a1-s1-c1'], ['s2-c1', 'a1-s2-c1']]);
    cleanup();
    const none = attachDeck(m.root, m.controller, { keyboard: true, swipe: true, hash: false });
    none();
  });

  test('REQ-597 · the fragments of the current slide follow the state', () => {
    const m = mount();
    controller = m.controller;
    const cleanup = attachDeck(m.root, m.controller, { keyboard: true, swipe: true, hash: false });
    const pending = () => [...m.root.querySelectorAll('[data-sp-slide="2"] [data-marpit-fragment]')].map((e) => e.hasAttribute('data-sp-pending'));
    m.controller.next();
    expect(pending()).toEqual([true, true]);
    m.controller.next();
    expect(pending()).toEqual([false, true]);
    m.controller.goTo(2, 'all');
    expect(pending()).toEqual([false, false]);
    cleanup();
  });

  test('REQ-597 · on attach, the current step is applied (a re-render keeps it)', () => {
    const m = mount();
    controller = m.controller;
    m.controller.goTo(2, 1);
    const cleanup = attachDeck(m.root, m.controller, { keyboard: true, swipe: true, hash: false });
    expect([...m.root.querySelectorAll('[data-sp-slide="2"] [data-marpit-fragment]')].map((e) => e.hasAttribute('data-sp-pending'))).toEqual([false, true]);
    cleanup();
  });

  test('REQ-610 · REQ-611 · the cleanup destroys every chart, observer and listener; nothing stays on document or window', () => {
    const observers: { disconnected: boolean }[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        disconnected = false;
        constructor() {
          observers.push(this);
        }
        observe() {}
        disconnect() {
          this.disconnected = true;
        }
      },
    );
    const count = (target: EventTarget) => {
      let live = 0;
      const add = target.addEventListener.bind(target);
      const remove = target.removeEventListener.bind(target);
      vi.spyOn(target, 'addEventListener').mockImplementation((...a: Parameters<EventTarget['addEventListener']>) => (live++, add(...a)));
      vi.spyOn(target, 'removeEventListener').mockImplementation((...a: Parameters<EventTarget['removeEventListener']>) => (live--, remove(...a)));
      return () => live;
    };
    const m = mount();
    controller = m.controller;
    const onDocument = count(document);
    const onWindow = count(window);
    const onRoot = count(m.root);
    let charts = 0;
    const cleanup = attachDeck(m.root, m.controller, { keyboard: true, swipe: true, hash: true }, {
      plan: hydrationPlan(m.render),
      mountChart: () => (charts++, () => void charts--),
    });
    expect(charts).toBe(2);
    expect(onRoot()).toBeGreaterThan(0);
    cleanup();
    expect(charts).toBe(0);
    expect([onDocument(), onWindow(), onRoot()]).toEqual([0, 0, 0]);
    expect(observers.every((o) => o.disconnected)).toBe(true);
    // The controller's subscriptions are gone too: a state change touches nothing.
    m.controller.goTo(2, 'all');
    expect(m.root.querySelector('[data-sp-slide="2"] [data-marpit-fragment]')!.hasAttribute('data-sp-pending')).toBe(true);
  });

  test('a mount that throws does not stop the others, and is reported', () => {
    const m = mount();
    controller = m.controller;
    vi.stubGlobal('reportError', undefined);
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mounted: string[] = [];
    const cleanup = attachDeck(m.root, m.controller, { keyboard: false, swipe: false, hash: false }, {
      plan: hydrationPlan(m.render),
      mountChart: (element) => {
        if (element.getAttribute('data-sp-slot') === 's1-c1') throw new Error('boom');
        mounted.push(element.getAttribute('data-sp-slot')!);
        return () => {};
      },
    });
    expect(mounted).toEqual(['s2-c1']);
    expect(report).toHaveBeenCalledTimes(1);
    expect(String(report.mock.calls[0]![0])).toContain('boom');
    cleanup();
  });
});
