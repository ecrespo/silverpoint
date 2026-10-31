// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { bindDeck, fullscreenAvailable } from '../src/client';
import { createDeckController, type DeckController } from '../src/controller';

/* bindDeck: keyboard, swipe, hash and fullscreen (T-269, REQ-600..REQ-603, API delta §7.3). */

let root: HTMLElement;
let controller: DeckController;
let cleanup: () => void;
const options = { keyboard: true, swipe: true, hash: false };

function mount(steps = [0, 1, 0, 0], bind = options, extra?: Partial<Parameters<typeof createDeckController>[0]>) {
  document.body.innerHTML = `
    <input id="outside">
    <div class="sp-deck" tabindex="0">
      <div class="sp-deck-viewport">
        <figure class="sp-deck-chart" data-sp-slot="s1-c1"><div class="sp-root" tabindex="0"></div></figure>
        <input id="field"><textarea id="area"></textarea><select id="pick"></select>
        <div id="editable" contenteditable="true"></div>
      </div>
      <div class="sp-deck-controls"><button id="btn" type="button">Next</button></div>
    </div>`;
  root = document.querySelector('.sp-deck')!;
  controller = createDeckController({ total: steps.length, steps, ...extra });
  cleanup = bindDeck(root, controller, bind);
}

const key = (target: Element, k: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
};
const pos = () => [controller.state.page, controller.state.step];

afterEach(() => {
  cleanup?.();
  controller?.destroy();
  history.replaceState(null, '', '/');
});

describe('keyboard (REQ-600)', () => {
  beforeEach(() => mount());

  test.each([
    ['ArrowRight', [2, 0]], ['ArrowDown', [2, 0]], ['PageDown', [2, 0]], [' ', [2, 0]], ['Enter', [2, 0]],
  ])('REQ-600 · %j is next, and the key is consumed', (k, to) => {
    const event = key(root, k);
    expect(pos()).toEqual(to);
    expect(event.defaultPrevented).toBe(true);
  });

  test.each([['ArrowLeft'], ['ArrowUp'], ['PageUp']])('REQ-600 · %s is prev', (k) => {
    controller.goTo(3);
    key(root, k);
    expect(pos()).toEqual([2, 1]);
  });

  test('REQ-600 · Shift+Space is prev; Home and End are first and last', () => {
    controller.goTo(3);
    key(root, ' ', { shiftKey: true });
    expect(pos()).toEqual([2, 1]);
    key(root, 'End');
    expect(pos()).toEqual([4, 0]);
    key(root, 'Home');
    expect(pos()).toEqual([1, 0]);
  });

  test('REQ-600 · o and n toggle the overview and the notes; f toggles fullscreen only when available', () => {
    key(root, 'o');
    expect(controller.state.overview).toBe(true);
    key(root, 'n');
    expect(controller.state.notes).toBe(true);
    const f = key(root, 'f');
    expect(controller.state.fullscreen).toBe(fullscreenAvailable(root));
    expect(f.defaultPrevented).toBe(fullscreenAvailable(root));
  });

  test('REQ-600 · keys are ignored in an input, a textarea, a select and a contenteditable', () => {
    for (const id of ['field', 'area', 'pick', 'editable']) {
      const event = key(document.getElementById(id)!, 'ArrowRight');
      expect(event.defaultPrevented, id).toBe(false);
    }
    expect(pos()).toEqual([1, 0]);
  });

  test('REQ-600 · Enter and Space on a button are the button’s', () => {
    const btn = document.getElementById('btn')!;
    key(btn, 'Enter');
    key(btn, ' ');
    expect(pos()).toEqual([1, 0]);
    key(btn, 'ArrowRight');
    expect(pos()).toEqual([2, 0]);
  });

  test('REQ-600 · a modifier other than Shift leaves the key to the browser', () => {
    for (const mod of ['ctrlKey', 'metaKey', 'altKey'] as const) key(root, 'ArrowRight', { [mod]: true });
    expect(pos()).toEqual([1, 0]);
  });

  test('REQ-600 · the chart’s keyboard model wins while a chart has focus, and a handled key stays handled', () => {
    const chart = document.querySelector('.sp-root')!;
    expect(key(chart, 'ArrowRight').defaultPrevented).toBe(false);
    const handled = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    handled.preventDefault();
    root.dispatchEvent(handled);
    expect(pos()).toEqual([1, 0]);
  });

  test('REQ-600 · it never listens on the document', () => {
    key(document.getElementById('outside')!, 'ArrowRight');
    key(document.body, 'ArrowRight');
    expect(pos()).toEqual([1, 0]);
  });

  test('REQ-604 · in the overview, arrows move the current slide, Enter selects and closes, Escape closes', () => {
    key(root, 'o');
    key(root, 'ArrowRight');
    key(root, 'ArrowRight');
    expect(pos()).toEqual([3, 0]);
    key(root, 'ArrowLeft');
    expect(pos()).toEqual([2, 0]);
    key(root, 'Enter');
    expect(controller.state.overview).toBe(false);
    expect(pos()).toEqual([2, 0]);
    key(root, 'o');
    key(root, 'Escape');
    expect(controller.state.overview).toBe(false);
  });

  test('REQ-604 · in the overview, up and down move by the grid’s columns', () => {
    root.querySelector('.sp-deck-viewport')!.insertAdjacentHTML('beforeend', '<div class="sp-deck-overview" data-sp-columns="2"></div>');
    key(root, 'o');
    key(root, 'ArrowDown');
    expect(pos()).toEqual([3, 0]);
    key(root, 'ArrowUp');
    expect(pos()).toEqual([1, 0]);
  });

  test('keyboard: false binds no key', () => {
    cleanup();
    cleanup = bindDeck(root, controller, { ...options, keyboard: false });
    key(root, 'ArrowRight');
    expect(pos()).toEqual([1, 0]);
  });

  test('the cleanup removes the listeners', () => {
    cleanup();
    key(root, 'ArrowRight');
    expect(pos()).toEqual([1, 0]);
  });
});

describe('swipe (REQ-601)', () => {
  beforeEach(() => mount([0, 0, 0]));
  const swipe = (dx: number, dy: number, pointerType = 'touch') => {
    root.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 200, pointerType, bubbles: true, isPrimary: true }));
    root.dispatchEvent(new PointerEvent('pointerup', { clientX: 200 + dx, clientY: 200 + dy, pointerType, bubbles: true, isPrimary: true }));
  };

  test('REQ-601 · leftwards past 48 px and steeper than 2:1 is next; rightwards is prev', () => {
    swipe(-60, 10);
    expect(pos()).toEqual([2, 0]);
    swipe(60, -29);
    expect(pos()).toEqual([1, 0]);
  });

  test('REQ-601 · 48 px or less, or flatter than 2:1, is not a swipe; nor is a mouse drag', () => {
    swipe(-48, 0);
    swipe(-80, 41);
    swipe(-200, 0, 'mouse');
    expect(pos()).toEqual([1, 0]);
  });

  test('swipe: false binds none', () => {
    cleanup();
    cleanup = bindDeck(root, controller, { ...options, swipe: false });
    swipe(-100, 0);
    expect(pos()).toEqual([1, 0]);
  });
});

describe('hash (REQ-602)', () => {
  test('REQ-602 · #<n> on mount moves the deck; a page change writes it with replaceState', () => {
    history.replaceState(null, '', '/talk?x=1#3');
    const push = vi.spyOn(history, 'pushState');
    mount([0, 0, 0, 0], { ...options, hash: true });
    expect(pos()).toEqual([3, 0]);
    controller.next();
    expect(location.hash).toBe('#4');
    expect(location.pathname + location.search).toBe('/talk?x=1');
    expect(push).not.toHaveBeenCalled();
  });

  test('REQ-602 · any other hash is ignored and never overwritten', () => {
    history.replaceState(null, '', '/#intro');
    mount([0, 0, 0], { ...options, hash: true });
    expect(pos()).toEqual([1, 0]);
    controller.next();
    expect(location.hash).toBe('#intro');
  });

  test('REQ-602 · an empty hash is written on the first page change; hash: false never writes', () => {
    mount([0, 0, 0], { ...options, hash: true });
    controller.next();
    expect(location.hash).toBe('#2');
    cleanup();
    controller.destroy();
    history.replaceState(null, '', '/');
    mount([0, 0, 0]);
    controller.next();
    expect(location.hash).toBe('');
  });

  test('REQ-602 · a hash beyond the deck is clamped (SP028 by the controller)', () => {
    history.replaceState(null, '', '/#99');
    mount([0, 0], { ...options, hash: true });
    expect(pos()).toEqual([2, 0]);
  });
});

describe('fullscreen (REQ-603)', () => {
  test('REQ-603 · unavailable without the Fullscreen API on the element', () => {
    mount();
    expect(fullscreenAvailable(document.createElement('div'))).toBe(typeof document.createElement('div').requestFullscreen === 'function' && document.fullscreenEnabled !== false);
  });

  test('REQ-603 · toggling calls requestFullscreen on the deck and exitFullscreen; fullscreenchange syncs the state', async () => {
    mount();
    const request = vi.fn(async () => {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => root });
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    const exit = vi.fn(async () => {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => null });
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    Object.assign(root, { requestFullscreen: request });
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit });
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, get: () => true });
    cleanup();
    cleanup = bindDeck(root, controller, options);
    expect(fullscreenAvailable(root)).toBe(true);
    key(root, 'f');
    expect(request).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(controller.state.fullscreen).toBe(true);
    // The user leaves with the browser's own Escape.
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => null });
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(controller.state.fullscreen).toBe(false);
    expect(exit).not.toHaveBeenCalled();
    key(root, 'f');
    await Promise.resolve();
    controller.toggleFullscreen(false);
    expect(exit).toHaveBeenCalledTimes(1);
  });
});

describe('clicks and the overview’s focus (REQ-604, REQ-613)', () => {
  function mountView() {
    document.body.innerHTML = `
      <div class="sp-deck" tabindex="0">
        <div class="sp-deck-viewport"><div class="sp-deck-v">
          <div class="sp-deck-slide" data-sp-slide="1"></div><div class="sp-deck-slide" data-sp-slide="2"></div><div class="sp-deck-slide" data-sp-slide="3"></div>
        </div></div>
        <div class="sp-deck-controls">
          <button type="button" data-sp-action="prev"><span>‹</span></button><button type="button" data-sp-action="next"><span>›</span></button>
          <button type="button" data-sp-action="overview"></button><button type="button" data-sp-action="notes"></button>
          <button type="button" data-sp-action="fullscreen"></button><button type="button" data-sp-action="bogus"></button>
        </div>
      </div>`;
    root = document.querySelector('.sp-deck')!;
    controller = createDeckController({ total: 3, steps: [0, 1, 0] });
    cleanup = bindDeck(root, controller, options);
  }
  const click = (selector: string) => (root.querySelector(selector) as HTMLElement).click();

  test('REQ-613 · a control button runs its action, from a click anywhere inside it', () => {
    mountView();
    (root.querySelector('[data-sp-action="next"] span') as HTMLElement).click();
    expect(pos()).toEqual([2, 0]);
    click('[data-sp-action="next"]');
    expect(pos()).toEqual([2, 1]);
    click('[data-sp-action="prev"]');
    expect(pos()).toEqual([2, 0]);
    click('[data-sp-action="notes"]');
    expect(controller.state.notes).toBe(true);
    click('[data-sp-action="overview"]');
    expect(controller.state.overview).toBe(true);
    click('[data-sp-action="bogus"]');
    expect(pos()).toEqual([2, 0]);
  });

  test('REQ-604 · a click on a thumbnail selects it and closes the overview', () => {
    mountView();
    controller.toggleOverview(true);
    for (const box of root.querySelectorAll('.sp-deck-slide')) box.classList.add('sp-deck-thumb');
    click('.sp-deck-thumb[data-sp-slide="3"]');
    expect(pos()).toEqual([3, 0]);
    expect(controller.state.overview).toBe(false);
  });

  test('REQ-604 · Enter on a focused thumbnail selects that one, not the current', () => {
    mountView();
    controller.toggleOverview(true);
    for (const box of root.querySelectorAll('.sp-deck-slide')) box.classList.add('sp-deck-thumb');
    key(root.querySelector('.sp-deck-thumb[data-sp-slide="2"]')!, 'Enter');
    expect(pos()).toEqual([2, 0]);
    expect(controller.state.overview).toBe(false);
  });

  test('REQ-604 · in the overview, focus follows the current thumbnail once the adapter has rendered it', async () => {
    mountView();
    controller.toggleOverview(true);
    for (const box of root.querySelectorAll('.sp-deck-slide')) {
      box.classList.add('sp-deck-thumb');
      box.setAttribute('tabindex', '0');
    }
    root.focus();
    key(root, 'ArrowRight');
    // The adapter marks the new current box on its own render.
    root.querySelector('[data-sp-current]')?.removeAttribute('data-sp-current');
    root.querySelector('[data-sp-slide="2"]')!.setAttribute('data-sp-current', '');
    await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    expect(document.activeElement).toBe(root.querySelector('[data-sp-slide="2"]'));
  });
});
