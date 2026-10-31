import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { createDeckEngine } from '@silverpoint/marp';
import { parseDeck } from '../svg-normalizer/normalize';
import { FIXTURES_DIR } from './fixtures';
import { DECK_FIXTURES, deckFixtureFromSearch, deckFixtureProps as harnessDeckProps } from '../../examples/harness/index.js';
import { DECK_SOURCES, deckCanonicalFor, deckCanonicalMarkup, deckFixtureProps, deckHarnessFixtures, deckMarkdown, deckMatrix, deckSourcesOnDisk } from './deck-fixtures';

/* The deck fixtures (T-278, Data Model §5, REQ-623): six decks × two grounds × two modes. */

const byId = (id: string) => deckMatrix().find((f) => f.id === id)!;
const renderOf = (source: (typeof DECK_SOURCES)[number], ground = 'silverpoint', mode: 'ink' | 'precision' = 'ink') =>
  createDeckEngine({ id: `fx-${source}`, ground, mode }).render(deckMarkdown({ source }));

describe('deck fixtures (T-278)', () => {
  test('REQ-623 · Data Model §5: 6 decks × 2 grounds × 2 modes = 24, every source on disk in the matrix', () => {
    const matrix = deckMatrix();
    expect(matrix).toHaveLength(24);
    expect(new Set(matrix.map((f) => f.id)).size).toBe(24);
    expect(deckSourcesOnDisk()).toEqual([...DECK_SOURCES]);
    expect(byId('deck--fences--cyanotype--precision')).toEqual({
      id: 'deck--fences--cyanotype--precision', source: 'fences', req: 'REQ-623', deckId: 'fx-fences', ground: 'cyanotype', mode: 'precision', canonical: 'deck/deck--fences--cyanotype--precision.canonical.txt',
    });
    expect(deckFixtureProps(byId('deck--basic--silverpoint--ink'), 'md')).toEqual({ markdown: 'md', id: 'fx-basic', ground: 'silverpoint', mode: 'ink' });
  });

  test('REQ-623 · every committed canonical is the current canonical render', () => {
    for (const fixture of deckMatrix()) {
      expect(readFileSync(join(FIXTURES_DIR, fixture.canonical), 'utf8'), fixture.id).toBe(`${deckCanonicalFor(fixture, deckMarkdown(fixture))}\n`);
    }
  });

  test('Data Model §5 · each source exercises what its row lists', () => {
    const basic = renderOf('basic');
    expect(basic.total).toBe(4);
    expect(basic.slides[0]!.html).toMatch(/class="lead"/);
    for (const tag of ['<table', '<blockquote', '<code', '<header', '<footer', 'data-marpit-pagination']) expect(basic.slides.map((s) => s.html).join(''), tag).toContain(tag);

    expect(renderOf('fragments').slides.map((s) => s.fragments)).toEqual([5, 0, 1]);

    const directives = renderOf('directives', 'silverpoint', 'ink');
    expect(directives.slides.map((s) => [s.ground, s.substrate, s.mode])).toEqual([
      ['cyanotype', 'prussian', 'precision'],
      ['silverpoint', 'ochre', 'precision'],
      ['cyanotype', 'prussian', 'precision'],
    ]);
    expect(directives.diagnostics.map((d) => d.code)).toContain('SP027');

    const fences = renderOf('fences');
    expect(fences.slots.filter((s) => s.spec).map((s) => s.spec!.chart)).toEqual(['bar-chart', 'donut-chart', 'line-chart']);
    expect(fences.slots.filter((s) => s.error).map((s) => s.error!.kind)).toEqual(['json', 'shape', 'chart', 'prop', 'size', 'diagnostic']);

    const backgrounds = renderOf('backgrounds');
    expect(backgrounds.total).toBe(4);
    expect(backgrounds.slides[0]!.html).toMatch(/data-marpit-advanced-background-split="left"/);
    expect(backgrounds.slides[0]!.html).toContain('assets/plate.svg');

    const classes = renderOf('classes');
    expect(classes.slides.map((s) => s.ground)).toEqual(['silverpoint', 'silverpoint', 'silverpoint', 'cyanotype', 'cyanotype', 'cyanotype']);
    for (const name of ['invert', 'plate', 'hatched']) expect(classes.slides.filter((s) => new RegExp(`class="[^"]*\\b${name}\\b`).test(s.html)), name).toHaveLength(2);
  });

  test('REQ-623 · the canonical tree is the deck root, its style an attribute, its slides children', () => {
    const tree = parseDeck(deckCanonicalMarkup(byId('deck--fences--silverpoint--ink'), deckMarkdown({ source: 'fences' })));
    expect(tree.tag).toBe('div');
    expect(tree.attrs.find(([n]) => n === '#style')![1]).toContain('div.sp-deck-fx-fences');
    expect(tree.children.some((c) => 'tag' in c && c.tag === 'style')).toBe(false);
  });
});

describe('the deck fixtures in the example harness (T-279)', () => {
  test('REQ-624 · the generated module is the current fixtures, Markdown and slide count included', () => {
    expect(DECK_FIXTURES).toEqual(deckHarnessFixtures());
    expect(DECK_FIXTURES.find((f) => f.id === 'deck--classes--cyanotype--ink')!.slides).toBe(6);
    expect(DECK_FIXTURES.reduce((n, f) => n + f.slides, 0)).toBe(23 * 4);
  });

  test('REQ-624 · the bench serves the fixtures’ images as committed', () => {
    for (const name of ['plate.svg', 'rule.svg']) {
      expect(readFileSync(join(FIXTURES_DIR, '..', 'examples/vite-react/public/deck-assets', name), 'utf8'), name).toBe(readFileSync(join(FIXTURES_DIR, 'deck/assets', name), 'utf8'));
    }
  });

  test('REQ-624 · `?deck=<id>&slide=<n>&assets=<base>`: that slide, static, its images from the base', () => {
    const found = deckFixtureFromSearch('?deck=deck--backgrounds--silverpoint--ink&slide=2&assets=http://localhost:4101/deck-assets/')!;
    expect(found.fixture.id).toBe('deck--backgrounds--silverpoint--ink');
    expect(found.props).toMatchObject({ id: 'fx-backgrounds', ground: 'silverpoint', mode: 'ink', defaultPage: 2, showControls: false, keyboard: false, swipe: false, interactive: false });
    expect(found.props.markdown).toContain('](http://localhost:4101/deck-assets/plate.svg)');
    expect(found.props.markdown).not.toContain('](assets/');
    expect(deckFixtureFromSearch('?deck=deck--basic--silverpoint--ink&slide=x')!.props.defaultPage).toBe(1);
    expect(deckFixtureFromSearch('?deck=nope')).toBeUndefined();
    expect(harnessDeckProps(found.fixture).markdown).toBe(found.fixture.markdown);
  });
});
