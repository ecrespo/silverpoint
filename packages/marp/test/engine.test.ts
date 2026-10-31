import { describe, expect, test } from 'vitest';
import { createDeckEngine } from '../src';

const MD = ['# One', '', '<!-- a note -->', '', '---', '', '## Two', '', '* a', '* b', '', '<!-- first -->', '<!-- second -->', '', '---', '', 'Three'].join('\n');

describe('createDeckEngine — render (T-254)', () => {
  test('REQ-573 · I-43 · one SlideRender per slide, 1-based, with notes and fragment counts', () => {
    const deck = createDeckEngine({ id: 'd1' }).render(MD);
    expect(deck.total).toBe(3);
    expect(deck.slides.map((s) => s.index)).toEqual([1, 2, 3]);
    expect(deck.slides.map((s) => s.notes)).toEqual([['a note'], ['first', 'second'], []]);
    expect(deck.slides.map((s) => s.fragments)).toEqual([0, 2, 0]);
    expect(deck.size).toEqual({ width: 1280, height: 720 });
  });

  test('REQ-571 · REQ-572 · each slide is Marpit inline SVG in its slide box; CSS scoped to div.sp-deck-<id>', () => {
    const deck = createDeckEngine({ id: 'd1' }).render(MD);
    for (const slide of deck.slides) {
      expect(slide.html).toMatch(/^<div class="sp-deck-slide"><svg data-marpit-svg="" viewBox="0 0 1280 720"><foreignObject width="1280" height="720"><section/);
      expect(slide.html.endsWith('</svg></div>')).toBe(true);
    }
    expect(deck.css).toContain('div.sp-deck-d1 > div.sp-deck-slide > svg > foreignObject > section');
  });

  test('REQ-571 · the deck id is sanitised to [a-z0-9-]', () => {
    expect(createDeckEngine({ id: 'My Deck: 2026!' }).render('# x').id).toBe('my-deck-2026');
    expect(createDeckEngine({ id: ':r1:' }).render('# x').id).toBe('r1');
    expect(() => createDeckEngine({ id: '!!!' })).toThrow(/deck id/);
  });

  test('REQ-572 · no anchors: no id attribute reaches the slides', () => {
    const deck = createDeckEngine({ id: 'd1' }).render('# Heading\n\n## Sub');
    expect(deck.slides[0]!.html).not.toMatch(/\sid="/);
  });

  test('REQ-572 · REQ-575 · raw HTML is text, and cannot be turned on', () => {
    const engine = createDeckEngine({ id: 'd1', ...({ html: true } as object) });
    const html = engine.render('<b onclick="x()">bold</b>\n\n<script>alert(1)</script>').slides[0]!.html;
    expect(html).toContain('&lt;b onclick=&quot;x()&quot;&gt;bold&lt;/b&gt;');
    expect(html).not.toMatch(/<script|<b[\s>]/);
  });

  test('REQ-574 · I-44 · identical input gives a deep-equal render; two engines do not share state', () => {
    const a = createDeckEngine({ id: 'd1' }).render(MD);
    const b = createDeckEngine({ id: 'd1' }).render(MD);
    const engine = createDeckEngine({ id: 'd1' });
    engine.render('# other\n\n---\n\n# deck');
    expect(engine.render(MD)).toEqual(a);
    expect(b).toEqual(a);
  });

  test('REQ-574 · the render touches no DOM (this project runs in Node, with no document)', () => {
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
    expect(() => createDeckEngine({ id: 'd1' }).render(MD)).not.toThrow();
  });

  test('size 4:3 is 960×720', () => {
    const deck = createDeckEngine({ id: 'd1', size: '4:3' }).render('# x');
    expect(deck.size).toEqual({ width: 960, height: 720 });
    expect(deck.slides[0]!.html).toContain('viewBox="0 0 960 720"');
  });
});
