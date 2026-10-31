/**
 * The deck fixtures (T-278, Data Model §5, REQ-623): six Markdown decks under `fixtures/deck/`, each
 * rendered on `silverpoint` and `cyanotype` in `ink` and `precision`, 24 renders, all on every PR. A
 * fixture's front matter may fix its ground or mode; the deck's options are then only its default.
 * The canonical render is `@silverpoint/marp`'s: the engine, `deckView` at the first page, and
 * `deckMarkup`, normalised as a deck tree.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate deck-canonical   (writes fixtures/deck/*.canonical.txt)
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createDeckEngine, deckMarkup, deckView } from '@silverpoint/marp';
import { normalizeDeck } from '../svg-normalizer/normalize';
import { FIXTURES_DIR } from './fixtures';

export const DECK_SOURCES = ['backgrounds', 'basic', 'classes', 'directives', 'fences', 'fragments'] as const;
const GROUNDS = ['silverpoint', 'cyanotype'] as const;
const MODES = ['ink', 'precision'] as const;

export interface DeckFixture {
  /** `deck--<source>--<ground>--<mode>`: its canonical file's name. */
  readonly id: string;
  readonly source: (typeof DECK_SOURCES)[number];
  readonly req: 'REQ-623';
  /** The deck's `id`: fixed, so every render scopes its CSS and names its charts alike. */
  readonly deckId: string;
  readonly ground: (typeof GROUNDS)[number];
  readonly mode: (typeof MODES)[number];
  readonly canonical: string;
}

export function deckMatrix(): DeckFixture[] {
  return DECK_SOURCES.flatMap((source) =>
    GROUNDS.flatMap((ground) =>
      MODES.map((mode) => {
        const id = ['deck', source, ground, mode].join('--');
        return { id, source, req: 'REQ-623' as const, deckId: `fx-${source}`, ground, mode, canonical: `deck/${id}.canonical.txt` };
      }),
    ),
  );
}

/** The fixture's Markdown, as committed. */
export function deckMarkdown(fixture: Pick<DeckFixture, 'source'>, dir = FIXTURES_DIR): string {
  return readFileSync(join(dir, 'deck', `${fixture.source}.deck.md`), 'utf8');
}

/** What every adapter is given: plain props, as a consumer writes them (REQ-609). */
export function deckFixtureProps(fixture: DeckFixture, markdown: string): { markdown: string; id: string; ground: string; mode: 'ink' | 'precision' } {
  return { markdown, id: fixture.deckId, ground: fixture.ground, mode: fixture.mode };
}

/** The canonical markup: the engine's render, the view at page 1 on the server (no fullscreen), written out. */
export function deckCanonicalMarkup(fixture: DeckFixture, markdown: string): string {
  const render = createDeckEngine({ id: fixture.deckId, ground: fixture.ground, mode: fixture.mode }).render(markdown);
  const view = deckView(render, { page: 1, step: 0, overview: false, notes: false, fullscreen: false }, { showControls: true, fullscreenAvailable: false, ground: fixture.ground, mode: fixture.mode });
  return deckMarkup(view);
}

/** The committed form: the normalised tree. */
export const deckCanonicalFor = (fixture: DeckFixture, markdown: string): string => normalizeDeck(deckCanonicalMarkup(fixture, markdown));

/** The six sources on disk, so a new or removed `.deck.md` breaks the matrix test, not silently the gate. */
export const deckSourcesOnDisk = (dir = FIXTURES_DIR): string[] =>
  readdirSync(join(dir, 'deck'))
    .filter((name) => name.endsWith('.deck.md'))
    .map((name) => name.slice(0, -'.deck.md'.length))
    .sort();

if (process.argv[1]?.endsWith('deck-fixtures.ts')) {
  const matrix = deckMatrix();
  for (const fixture of matrix) writeFileSync(join(FIXTURES_DIR, fixture.canonical), `${deckCanonicalFor(fixture, deckMarkdown(fixture))}\n`);
  console.log(`deck-fixtures · wrote ${matrix.length} canonical renders`);
}
