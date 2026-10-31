import { resolveSeed } from '@silverpoint/core';
import { cyanotype, silverpoint, slideBackdrop } from '@silverpoint/grounds';
import { describe, expect, test } from 'vitest';
import { createDeckEngine } from '../src';

/* The backdrop wired into the slide (T-260, REQ-587): `--sp-deck-backdrop` on the content section. */

const decode = (value: string) => value.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const backdropOf = (html: string): string | undefined => {
  const style = /<section [^>]*style="([^"]*)"/.exec(html)?.[1];
  return style === undefined ? undefined : /--sp-deck-backdrop:url\("([^"]*)"\)/.exec(decode(style))?.[1];
};
const seed = (deck: string, n: number) => resolveSeed(undefined, `${deck}-s${n}`);

describe('slide backdrops (T-260)', () => {
  test('REQ-587 · plate and hatched slides carry the grounds backdrop, seeded by deck id and slide', () => {
    const out = createDeckEngine({ id: 'b1' }).render('<!-- _class: plate -->\n# One\n\n---\n\n<!-- _class: lead hatched -->\n# Two\n\n---\n\n# Three');
    expect(backdropOf(out.slides[0]!.html)).toBe(slideBackdrop(silverpoint, 'cream', { kind: 'plate', seed: seed('b1', 1), mode: 'ink', width: 1280, height: 720 }).dataUri);
    expect(backdropOf(out.slides[1]!.html)).toBe(slideBackdrop(silverpoint, 'cream', { kind: 'hatched', seed: seed('b1', 2), mode: 'ink', width: 1280, height: 720 }).dataUri);
    expect(out.slides[2]!.html).not.toContain('--sp-deck-backdrop');
  });

  test('REQ-587 · the slide’s ground, substrate, mode and size draw it', () => {
    const md = '<!-- _class: plate -->\n<!-- _ground: cyanotype -->\n# One\n\n---\n\n<!-- _class: plate -->\n<!-- _mode: precision -->\n# Two';
    const out = createDeckEngine({ id: 'b2', size: '4:3' }).render(md);
    expect(backdropOf(out.slides[0]!.html)).toBe(slideBackdrop(cyanotype, 'prussian', { kind: 'plate', seed: seed('b2', 1), mode: 'ink', width: 960, height: 720 }).dataUri);
    expect(backdropOf(out.slides[1]!.html)).toBe(slideBackdrop(silverpoint, 'cream', { kind: 'plate', seed: seed('b2', 2), mode: 'precision', width: 960, height: 720 }).dataUri);
  });

  test('REQ-588 · the author’s own directive styles stay', () => {
    const out = createDeckEngine({ id: 'b3' }).render('<!-- _class: plate -->\n<!-- _backgroundColor: "#ffeedd" -->\n# One');
    const style = decode(/<section [^>]*style="([^"]*)"/.exec(out.slides[0]!.html)![1]!);
    expect(style).toMatch(/background-color:#ffeedd;/);
    expect(style).toContain('--sp-deck-backdrop:url("data:image/svg+xml,');
  });
});

describe('advanced background layers (T-260, REQ-588)', () => {
  test('REQ-584 · REQ-587 · REQ-588 · every layer of a split slide carries the slide’s ground and backdrop; only the content is the slide', () => {
    const out = createDeckEngine({ id: 'b4' }).render('<!-- _class: plate -->\n<!-- _ground: cyanotype -->\n![bg left:40%](a.svg)\n\n# Split');
    const sections = out.slides[0]!.html.match(/<section [^>]*>/g)!;
    expect(sections.map((s) => /data-marpit-advanced-background="(\w+)"/.exec(s)?.[1])).toEqual(['background', 'content', 'pseudo']);
    for (const s of sections) {
      expect(s).toContain('data-sp-ground="cyanotype" data-sp-substrate="prussian" data-sp-mode="ink"');
      expect(s).toContain('--sp-deck-backdrop:url(');
    }
    expect(sections.filter((s) => s.includes('aria-roledescription="slide"'))).toHaveLength(1);
    expect(sections[1]).toContain('aria-label="Slide 1 of 1"');
  });
});

describe('the precision twin (T-271, REQ-615)', () => {
  const precisionOf = (html: string) => /--sp-deck-backdrop-precision:url\("([^"]*)"\)/.exec(decode(/<section [^>]*style="([^"]*)"/.exec(html)![1]!))?.[1];

  test('REQ-615 · an inked backdrop carries its exact version, for deck.css under forced precision', () => {
    const out = createDeckEngine({ id: 'b5' }).render('<!-- _class: plate -->\n# One\n\n---\n\n<!-- _class: plate -->\n<!-- _mode: precision -->\n# Two');
    expect(precisionOf(out.slides[0]!.html)).toBe(slideBackdrop(silverpoint, 'cream', { kind: 'plate', seed: seed('b5', 1), mode: 'precision', width: 1280, height: 720 }).dataUri);
    // A precision slide's backdrop is already exact: no twin.
    expect(precisionOf(out.slides[1]!.html)).toBeUndefined();
  });
});
