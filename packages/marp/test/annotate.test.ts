import { __setDiagnosticSink } from '@silverpoint/core';
import { afterEach, describe, expect, test } from 'vitest';
import { createDeckEngine, DECK_DIRECTIVES } from '../src';

let restore: () => void = () => {};
afterEach(() => restore());
const quiet = () => (restore = __setDiagnosticSink(() => {}));

const section = (html: string) => /<section\b[^>]*>/.exec(html)![0];

describe('slide annotations (T-256)', () => {
  test('REQ-614 · each slide is a group named "Slide n of N", with role description', () => {
    const deck = createDeckEngine({ id: 'a' }).render('# One\n\n---\n\n# Two');
    expect(section(deck.slides[0]!.html)).toContain('role="group"');
    expect(section(deck.slides[0]!.html)).toContain('aria-roledescription="slide"');
    expect(section(deck.slides[0]!.html)).toContain('aria-label="Slide 1 of 2"');
    expect(section(deck.slides[1]!.html)).toContain('aria-label="Slide 2 of 2"');
  });

  test('REQ-573 · the first heading’s text is the slide’s heading; a slide without one has none', () => {
    const deck = createDeckEngine({ id: 'a' }).render('Intro text\n\n## The *first* `heading`\n\n# Later\n\n---\n\nNo heading');
    expect(deck.slides[0]!.heading).toBe('The first heading');
    expect(deck.slides[1]!.heading).toBeUndefined();
  });

  test('the class directive’s tokens are the slide’s classes', () => {
    const deck = createDeckEngine({ id: 'a' }).render('<!-- _class: lead invert -->\n# One\n\n---\n\n# Two');
    expect(deck.slides.map((s) => s.classes)).toEqual([['lead', 'invert'], []]);
  });

  test('advanced backgrounds: only the content section is annotated, and it is the one SlideRender reads', () => {
    const deck = createDeckEngine({ id: 'a' }).render('# Split\n\n![bg left:40%](a.png)\n\n- x\n- y');
    const sections = deck.slides[0]!.html.match(/<section\b[^>]*>/g)!;
    expect(sections.filter((s) => s.includes('aria-roledescription="slide"'))).toHaveLength(1);
    expect(sections.find((s) => s.includes('aria-roledescription'))).toContain('data-marpit-advanced-background="content"');
    expect(deck.slides[0]!.heading).toBe('Split');
  });
});

describe('directives ground, substrate, mode (T-257)', () => {
  const attrs = (html: string) => {
    const s = section(html);
    return [/data-sp-ground="([^"]*)"/.exec(s)?.[1], /data-sp-substrate="([^"]*)"/.exec(s)?.[1], /data-sp-mode="([^"]*)"/.exec(s)?.[1]];
  };

  test('REQ-584 · defaults: the deck options, else silverpoint, its first substrate, ink', () => {
    expect(attrs(createDeckEngine({ id: 'a' }).render('# x').slides[0]!.html)).toEqual(['silverpoint', 'cream', 'ink']);
    expect(attrs(createDeckEngine({ id: 'a', ground: 'cyanotype', mode: 'precision' }).render('# x').slides[0]!.html)).toEqual(['cyanotype', 'prussian', 'precision']);
  });

  test('REQ-584 · front matter applies to every slide; a local one carries on; the spot form to one slide', () => {
    const md = ['---', 'substrate: blue', '---', '# 1', '', '---', '', '<!-- _mode: precision -->', '# 2', '', '---', '', '<!-- substrate: ochre -->', '# 3', '', '---', '', '# 4'].join('\n');
    const deck = createDeckEngine({ id: 'a' }).render(md);
    expect(deck.slides.map((s) => [s.ground, s.substrate, s.mode])).toEqual([
      ['silverpoint', 'blue', 'ink'],
      ['silverpoint', 'blue', 'precision'],
      ['silverpoint', 'ochre', 'ink'],
      ['silverpoint', 'ochre', 'ink'],
    ]);
    expect(deck.slides.map((s) => attrs(s.html))).toEqual(deck.slides.map((s) => [s.ground, s.substrate, s.mode]));
  });

  test('Data Model §2.34 · a ground change resets a substrate the new ground lacks to its first, silently', () => {
    quiet();
    const deck = createDeckEngine({ id: 'a' }).render('<!-- substrate: ochre -->\n# 1\n\n---\n\n<!-- ground: cyanotype -->\n# 2\n\n---\n\n<!-- ground: silverpoint -->\n# 3');
    expect(deck.slides.map((s) => [s.ground, s.substrate])).toEqual([['silverpoint', 'ochre'], ['cyanotype', 'prussian'], ['silverpoint', 'ochre']]);
    expect(deck.diagnostics).toEqual([]);
  });

  test('REQ-586 · I-48 · unknown values raise SP027 once, name the closest values, and the inherited value holds', () => {
    const seen: string[] = [];
    restore = __setDiagnosticSink((code, message) => seen.push(`${code} ${message}`));
    const md = '<!-- mode: precision -->\n# 1\n\n---\n\n<!-- ground: cyanotipe -->\n<!-- mode: inky -->\n# 2\n\n---\n\n# 3\n\n---\n\n<!-- _substrate: purple -->\n# 4';
    const deck = createDeckEngine({ id: 'a' }).render(md);
    expect(deck.slides.map((s) => [s.ground, s.substrate, s.mode])).toEqual([
      ['silverpoint', 'cream', 'precision'],
      ['silverpoint', 'cream', 'precision'],
      ['silverpoint', 'cream', 'precision'],
      ['silverpoint', 'cream', 'precision'],
    ]);
    expect(deck.diagnostics.map((d) => [d.code, d.slide])).toEqual([['SP027', 2], ['SP027', 2], ['SP027', 4]]);
    expect(deck.diagnostics[0]!.message).toMatch(/ground "cyanotipe".*cyanotype/);
    expect(deck.diagnostics[1]!.message).toMatch(/mode "inky".*ink/);
    expect(deck.diagnostics[2]!.message).toMatch(/substrate "purple"/);
    expect(seen.filter((s) => s.startsWith('SP027'))).toHaveLength(3);
  });

  test('DECK_DIRECTIVES describes the three directives as data, read from the ground registry', () => {
    expect(DECK_DIRECTIVES.map((d) => [d.name, d.attribute, d.default])).toEqual([
      ['ground', 'data-sp-ground', 'silverpoint'],
      ['substrate', 'data-sp-substrate', 'cream'],
      ['mode', 'data-sp-mode', 'ink'],
    ]);
    expect(DECK_DIRECTIVES[0]!.values).toEqual(['silverpoint', 'cyanotype']);
    expect(DECK_DIRECTIVES[1]!.values).toBe('per-ground');
    expect(DECK_DIRECTIVES[2]!.values).toEqual(['ink', 'precision']);
  });
});
