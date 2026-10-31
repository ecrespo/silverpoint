import { describe, expect, test } from 'vitest';
import { createDeckEngine, deckMarkup, deckView, type DeckViewOptions, type DeckViewState } from '../src';

/* deckMarkup: the deck's static HTML, the canonical render the adapters are compared with (T-278, REQ-623). */

const MD = '# One <b>\n\n<!-- a & b < c -->\n\n---\n\n## Two\n\n* x\n* y';
const STATE: DeckViewState = { page: 1, step: 0, overview: false, notes: true, fullscreen: false };
const OPTIONS: DeckViewOptions = { showControls: true, fullscreenAvailable: false, ground: 'silverpoint', mode: 'ink' };
const render = createDeckEngine({ id: 'm1' }).render(MD);
const html = deckMarkup(deckView(render, STATE, OPTIONS));

describe('deckMarkup', () => {
  test('REQ-623 · the root with its attributes, then the raw scoped style, the viewport and the slides', () => {
    expect(html).toMatch(/^<div class="sp-deck sp-ground-silverpoint" part="sp-deck" role="region" aria-roledescription="slide deck" aria-label="One &lt;b&gt;" tabindex="0"/);
    // The style's text is CSS, unescaped: Marpit's child combinators stay `>` (T-277).
    const css = /<style>([\s\S]*?)<\/style>/.exec(html)![1]!;
    expect(css).toBe(render.css);
    expect(css).toContain(' > ');
    expect(html.indexOf('<style>')).toBeLessThan(html.indexOf('sp-deck-viewport'));
  });

  test('REQ-623 · slide boxes carry the engine’s HTML as is; a flag is an empty attribute', () => {
    expect(html).toContain(`<div class="sp-deck-slide" data-sp-slide="1" data-sp-current="">${deckView(render, STATE, OPTIONS).slides[0]!.html}</div>`);
    expect(html).toMatch(/<div class="sp-deck-slide" data-sp-slide="2" hidden="" inert="">/);
  });

  test('REQ-607 · REQ-614 · notes and status are text, escaped; the controls are the core’s buttons', () => {
    expect(html).toContain('<aside class="sp-deck-notes" part="sp-deck-notes" aria-label="Speaker notes"><p>a &amp; b &lt; c</p></aside>');
    expect(html).toMatch(/<button[^>]*aria-label="Next slide"[^>]*>/);
    expect(html).toMatch(/<p class="sp-deck-status"[^>]*>Slide 1 of 2<\/p><\/div>$/);
  });

  test('REQ-613 · without controls or notes, nothing is written for them', () => {
    const bare = deckMarkup(deckView(render, { ...STATE, notes: false }, { ...OPTIONS, showControls: false }));
    expect(bare).not.toContain('<aside');
    expect(bare).not.toContain('<button');
  });
});
