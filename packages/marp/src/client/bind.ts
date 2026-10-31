/**
 * The deck's DOM bindings (T-269, REQ-600..REQ-603, API delta §7.3): keys on the deck element
 * only, a touch swipe, the `#<n>` hash and the Fullscreen API. Every listener is removed by the
 * returned cleanup (REQ-610).
 */
import type { DeckController } from '../controller';

export interface BindOptions {
  readonly keyboard: boolean;
  readonly swipe: boolean;
  readonly hash: boolean;
}

/** A swipe is longer than this, in CSS px (REQ-601). */
export const SWIPE_DISTANCE = 48;
/** …and at least this many times wider than tall. */
export const SWIPE_RATIO = 2;

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const PAGE_HASH = /^#(\d+)$/;

/** Whether the Fullscreen API can put this element in full screen (REQ-603). */
export function fullscreenAvailable(element: Element): boolean {
  if (typeof document === 'undefined') return false;
  return typeof (element as HTMLElement).requestFullscreen === 'function' && document.fullscreenEnabled === true;
}

function asElement(target: EventTarget | null): Element | null {
  return target && typeof (target as Element).closest === 'function' ? (target as Element) : null;
}

export function bindDeck(root: HTMLElement, controller: DeckController, options: BindOptions): () => void {
  const undo: (() => void)[] = [];
  const listen = <K extends keyof HTMLElementEventMap>(target: HTMLElement | Document, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    target.addEventListener(type, fn as EventListener);
    undo.push(() => target.removeEventListener(type, fn as EventListener));
  };

  if (options.keyboard) listen(root, 'keydown', (event) => onKey(root, controller, event));
  listen(root, 'click', (event) => onClick(root, controller, event));
  bindOverviewFocus(root, controller, undo);
  if (options.swipe) bindSwipe(root, controller, listen);
  if (options.hash) bindHash(controller, undo);
  bindFullscreen(root, controller, listen, undo);

  return () => {
    for (const fn of undo.splice(0).reverse()) fn();
  };
}

function overviewColumns(root: HTMLElement): number {
  const n = Number(root.querySelector<HTMLElement>('.sp-deck-overview')?.dataset.spColumns);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function onKey(root: HTMLElement, controller: DeckController, event: KeyboardEvent): void {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  const target = asElement(event.target);
  if (target && target !== root) {
    if (target.closest(EDITABLE)) return;
    // A hydrated chart has its own keyboard model (REQ-600): it wins while it has focus.
    if (target.closest('.sp-deck-chart')) return;
  }
  const onButton = !!target?.closest('button, a[href], summary');
  const { key, shiftKey } = event;
  const state = controller.state;

  const thumb = state.overview ? target?.closest<HTMLElement>('.sp-deck-thumb') : null;
  let handled = true;
  if (thumb && (key === 'Enter' || key === ' ')) select(controller, thumb);
  else if (key === 'n') controller.toggleNotes();
  else if (key === 'f' && fullscreenAvailable(root)) controller.toggleFullscreen();
  else if (state.overview) {
    const columns = overviewColumns(root);
    if (key === 'ArrowRight') controller.goTo(state.page + 1);
    else if (key === 'ArrowLeft') controller.goTo(state.page - 1);
    else if (key === 'ArrowDown') controller.goTo(state.page + columns);
    else if (key === 'ArrowUp') controller.goTo(state.page - columns);
    else if (key === 'Home') controller.first();
    else if (key === 'End') controller.last();
    else if ((key === 'Enter' || key === ' ') && !onButton) controller.toggleOverview(false);
    else if (key === 'Escape' || key === 'o') controller.toggleOverview(false);
    else handled = false;
  } else if (key === 'ArrowRight' || key === 'ArrowDown' || key === 'PageDown' || ((key === 'Enter' || key === ' ') && !shiftKey && !onButton)) {
    controller.next();
  } else if (key === 'ArrowLeft' || key === 'ArrowUp' || key === 'PageUp' || (key === ' ' && shiftKey && !onButton)) {
    controller.prev();
  } else if (key === 'Home') controller.first();
  else if (key === 'End') controller.last();
  else if (key === 'o') controller.toggleOverview();
  else handled = false;

  if (handled) event.preventDefault();
}

/** A thumbnail of the overview picks its slide and closes the overview (REQ-604). */
function select(controller: DeckController, thumb: HTMLElement): void {
  const n = Number(thumb.getAttribute('data-sp-slide'));
  if (Number.isInteger(n)) controller.goTo(n);
  controller.toggleOverview(false);
}

/** The controls are buttons of the view, told apart by `data-sp-action` (REQ-613): one listener for all. */
function onClick(root: HTMLElement, controller: DeckController, event: MouseEvent): void {
  const target = asElement(event.target);
  const button = target?.closest<HTMLButtonElement>('[data-sp-action]');
  if (button && root.contains(button)) {
    if (button.disabled) return;
    const action = button.getAttribute('data-sp-action');
    if (action === 'prev') controller.prev();
    else if (action === 'next') controller.next();
    else if (action === 'overview') controller.toggleOverview();
    else if (action === 'notes') controller.toggleNotes();
    else if (action === 'fullscreen' && fullscreenAvailable(root)) controller.toggleFullscreen();
    return;
  }
  const thumb = target?.closest<HTMLElement>('.sp-deck-thumb');
  if (thumb && root.contains(thumb) && controller.state.overview) select(controller, thumb);
}

/**
 * In the overview, focus follows the current thumbnail once the adapter has rendered it; leaving
 * the overview from a thumbnail returns focus to the deck (REQ-604).
 */
function bindOverviewFocus(root: HTMLElement, controller: DeckController, undo: (() => void)[]): void {
  if (typeof document === 'undefined') return;
  const later = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn: () => void) => setTimeout(fn, 0) as unknown as number;
  const cancel = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : (id: number) => clearTimeout(id);
  let frame: number | undefined;
  let page = controller.state.page;
  let overview = controller.state.overview;
  undo.push(
    controller.on('state', (state) => {
      const moved = state.page !== page || state.overview !== overview;
      const closed = overview && !state.overview;
      page = state.page;
      overview = state.overview;
      if (!moved || !root.contains(document.activeElement)) return;
      if (frame !== undefined) cancel(frame);
      frame = later(() => {
        frame = undefined;
        if (state.overview) root.querySelector<HTMLElement>('.sp-deck-thumb[data-sp-current]')?.focus();
        else if (closed) root.focus();
      });
    }),
    () => {
      if (frame !== undefined) cancel(frame);
    },
  );
}

type Listen = <K extends keyof HTMLElementEventMap>(target: HTMLElement | Document, type: K, fn: (e: HTMLElementEventMap[K]) => void) => void;

function bindSwipe(root: HTMLElement, controller: DeckController, listen: Listen): void {
  let start: { x: number; y: number; id: number } | null = null;
  listen(root, 'pointerdown', (e) => {
    // A mouse drag selects text; a swipe is a finger or a pen.
    start = e.isPrimary && e.pointerType !== 'mouse' ? { x: e.clientX, y: e.clientY, id: e.pointerId } : null;
  });
  listen(root, 'pointercancel', () => {
    start = null;
  });
  listen(root, 'pointerup', (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) <= SWIPE_DISTANCE || Math.abs(dx) < SWIPE_RATIO * Math.abs(dy)) return;
    if (dx < 0) controller.next();
    else controller.prev();
  });
}

function bindHash(controller: DeckController, undo: (() => void)[]): void {
  if (typeof location === 'undefined' || typeof history === 'undefined') return;
  const read = PAGE_HASH.exec(location.hash);
  if (read) controller.goTo(Number(read[1]));
  let written = controller.state.page;
  undo.push(
    controller.on('state', (state) => {
      if (state.page === written) return;
      written = state.page;
      // Only an empty hash or a page hash is the deck's; any other is the host's (REQ-602).
      if (location.hash !== '' && !PAGE_HASH.test(location.hash)) return;
      history.replaceState(history.state, '', `${location.pathname}${location.search}#${state.page}`);
    }),
  );
}

function bindFullscreen(root: HTMLElement, controller: DeckController, listen: Listen, undo: (() => void)[]): void {
  if (typeof document === 'undefined') return;
  const isFullscreen = () => document.fullscreenElement === root;
  listen(document, 'fullscreenchange', () => controller.toggleFullscreen(isFullscreen()));
  undo.push(
    controller.on('state', (state) => {
      if (state.fullscreen === isFullscreen()) return;
      if (!fullscreenAvailable(root)) {
        if (state.fullscreen) controller.toggleFullscreen(false);
        return;
      }
      const request = state.fullscreen ? root.requestFullscreen() : document.exitFullscreen();
      // Refused (no user gesture, a policy): the state follows what the browser did.
      Promise.resolve(request).catch(() => controller.toggleFullscreen(isFullscreen()));
    }),
  );
}
