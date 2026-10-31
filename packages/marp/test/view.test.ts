import { __setDiagnosticSink } from '@silverpoint/core';
import type { UiElement, UiNode } from '@silverpoint/core/ui';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createDeckEngine, deckView, type DeckViewOptions, type DeckViewState } from '../src';

/* The deck's view, shared by the three adapters (T-276, Art. 2, Art. 3, API delta §8). */

let sunk: string[] = [];
let restore: () => void;
beforeEach(() => {
  sunk = [];
  restore = __setDiagnosticSink((code, message) => sunk.push(`${code} ${message}`));
});
afterEach(() => restore());

const MD = '# Opening\n\n- a\n\n<!-- note one -->\n\n---\n\n## Middle\n\n* x\n* y\n\n---\n\nEnd';
const render = createDeckEngine({ id: 'v1' }).render(MD);
const STATE: DeckViewState = { page: 1, step: 0, overview: false, notes: false, fullscreen: false };
const OPTIONS: DeckViewOptions = { showControls: true, fullscreenAvailable: true, ground: 'silverpoint', substrate: 'cream', mode: 'ink' };
const view = (state: Partial<DeckViewState> = {}, options: Partial<DeckViewOptions> = {}, r = render) => deckView(r, { ...STATE, ...state }, { ...OPTIONS, ...options });

const buttons = (node: UiNode | undefined): UiElement[] => {
  if (!node || !('tag' in node)) return [];
  return [...(node.tag === 'button' ? [node] : []), ...node.children.flatMap(buttons)];
};
const texts = (node: UiNode): string => ('text' in node ? node.text : 'children' in node ? node.children.map(texts).join('') : '');

describe('deckView — the root (REQ-614)', () => {
  test('REQ-614 · a labelled region, focusable, carrying page, step and overview; the ground’s tokens for the chrome', () => {
    expect(view({ page: 2, step: 1 }).root).toEqual({
      class: 'sp-deck sp-ground-silverpoint',
      part: 'sp-deck',
      role: 'region',
      'aria-roledescription': 'slide deck',
      'aria-label': 'Opening',
      tabindex: '0',
      'data-substrate': 'cream',
      'data-mode': 'ink',
      'data-sp-page': '2',
      'data-sp-step': '1',
      'data-sp-overview': 'false',
    });
  });

  test('REQ-614 · label wins over the first heading; neither raises SP018 and names it "Slide deck"', () => {
    expect(view({}, { label: 'Q3' }).root['aria-label']).toBe('Q3');
    const bare = createDeckEngine({ id: 'v2' }).render('just text');
    expect(view({}, {}, bare).root['aria-label']).toBe('Slide deck');
    expect(sunk.filter((s) => s.startsWith('SP018'))).toHaveLength(1);
  });

  test('a palette style rides on the root', () => {
    expect(view({}, { style: '--sp-ink:#202020' }).root.style).toBe('--sp-ink:#202020');
  });
});

describe('deckView — slides (REQ-614, DD-057)', () => {
  test('REQ-614 · the current box is marked; the others are hidden and inert; the inner HTML is the engine’s svg', () => {
    const { slides, container } = view({ page: 2 });
    expect(container).toEqual({ class: 'sp-deck-v1' });
    expect(slides.map((s) => s.attrs)).toEqual([
      { class: 'sp-deck-slide', 'data-sp-slide': '1', hidden: true, inert: true },
      { class: 'sp-deck-slide', 'data-sp-slide': '2', 'data-sp-current': true },
      { class: 'sp-deck-slide', 'data-sp-slide': '3', hidden: true, inert: true },
    ]);
    expect(slides[1]!.html.startsWith('<svg data-marpit-svg=')).toBe(true);
    expect(`<div class="sp-deck-slide">${slides[1]!.html}</div>`).toBe(render.slides[1]!.html);
    expect(slides.map((s) => s.key)).toEqual(['v1-1', 'v1-2', 'v1-3']);
  });

  test('REQ-604 · the overview: every slide a focusable thumbnail, the current one aria-current; the container is the grid', () => {
    const { slides, container, viewport } = view({ page: 3, overview: true });
    expect(container).toEqual({ class: 'sp-deck-v1 sp-deck-overview', part: 'sp-deck-overview', 'data-sp-columns': '4' });
    expect(viewport).toEqual({ class: 'sp-deck-viewport', part: 'sp-deck-viewport' });
    expect(slides[2]!.attrs).toEqual({ class: 'sp-deck-slide sp-deck-thumb', 'data-sp-slide': '3', 'data-sp-current': true, role: 'button', tabindex: '0', 'aria-label': 'Go to slide 3 of 3', 'aria-current': 'true' });
    expect(slides[0]!.attrs).toEqual({ class: 'sp-deck-slide sp-deck-thumb', 'data-sp-slide': '1', role: 'button', tabindex: '0', 'aria-label': 'Go to slide 1 of 3' });
    expect(slides.filter((s) => s.attrs['aria-current'])).toHaveLength(1);
  });

  test('REQ-597 · DD-057 · the inner HTML never depends on the state: the client moves the fragments, hydrated charts stay', () => {
    expect(view({ page: 2, step: 2 }).slides.map((s) => s.html)).toEqual(view({ page: 1, step: 0, overview: true }).slides.map((s) => s.html));
  });
});

describe('deckView — notes, controls, status (REQ-607, REQ-613, REQ-614)', () => {
  test('REQ-607 · notes of the current slide, as text, when notes are on', () => {
    expect(view().notes).toBeUndefined();
    expect(view({ notes: true }).notes).toEqual({ attrs: { class: 'sp-deck-notes', part: 'sp-deck-notes', 'aria-label': 'Speaker notes' }, paragraphs: ['note one'] });
    expect(view({ notes: true, page: 2 }).notes!.paragraphs).toEqual([]);
  });

  test('REQ-613 · native buttons from the UI layer, named, with aria-pressed; a tabular counter', () => {
    const { controls } = view({ page: 2, overview: false, notes: true });
    expect(controls!.attrs).toEqual({ class: 'sp-deck-controls', part: 'sp-deck-controls', role: 'toolbar', 'aria-label': 'Deck controls' });
    const all = buttons(controls!);
    expect(all.map((b) => [b.attrs['data-sp-action'], b.attrs['aria-label'], b.attrs['aria-pressed']])).toEqual([
      ['prev', 'Previous slide', undefined],
      ['next', 'Next slide', undefined],
      ['overview', 'Overview', 'false'],
      ['notes', 'Speaker notes', 'true'],
      ['fullscreen', 'Full screen', 'false'],
    ]);
    for (const b of all) {
      expect(b.attrs.type).toBe('button');
      expect(b.attrs.class).toMatch(/^sp-ui sp-button sp-ground-silverpoint/);
      expect(b.bind).toBe('trigger');
    }
    expect(texts(controls!)).toContain('2 / 3');
    expect(controls!.children.some((c) => 'tag' in c && c.attrs.part === 'sp-deck-counter' && c.attrs.class === 'sp-deck-counter')).toBe(true);
  });

  test('REQ-613 · first and last slides disable prev and next; no fullscreen button without the API (REQ-603)', () => {
    const first = buttons(view({ page: 1 }).controls!);
    expect(first[0]!.attrs.disabled).toBe(true);
    expect(first[1]!.attrs.disabled).toBeUndefined();
    const last = buttons(view({ page: 3, step: 0 }).controls!);
    expect(last[1]!.attrs.disabled).toBe(true);
    expect(buttons(view({}, { fullscreenAvailable: false }).controls!).map((b) => b.attrs['data-sp-action'])).not.toContain('fullscreen');
  });

  test('REQ-613 · next stays enabled on the last slide while fragments remain', () => {
    const r = createDeckEngine({ id: 'v3' }).render('# A\n\n* x\n* y');
    expect(buttons(view({ page: 1, step: 1 }, {}, r).controls!)[1]!.attrs.disabled).toBeUndefined();
    expect(buttons(view({ page: 1, step: 2 }, {}, r).controls!)[1]!.attrs.disabled).toBe(true);
  });

  test('showControls: false renders none', () => {
    expect(view({}, { showControls: false }).controls).toBeUndefined();
  });

  test('REQ-614 · a polite, visually hidden status announcing the page', () => {
    expect(view({ page: 2 }).status).toEqual({ attrs: { class: 'sp-deck-status', 'aria-live': 'polite' }, text: 'Slide 2 of 3' });
  });

  test('the deck’s CSS is the render’s', () => {
    expect(view().css).toBe(render.css);
  });

  test('Art. 3 · the same inputs give the same view', () => {
    expect(view({ page: 2, notes: true })).toEqual(view({ page: 2, notes: true }));
  });
});
