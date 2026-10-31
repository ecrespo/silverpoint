/**
 * `@silverpoint/marp` — Marp/Marpit Markdown decks in the silverpoint style (PRD §6.15).
 * This entry is pure: no DOM, no globals (REQ-570, REQ-574).
 */
export { createDeckEngine, sanitiseDeckId } from './engine';
export { DECK_DIRECTIVES } from './engine/directives';
export { DECK_LIMITS } from './engine/limits';
export { THEME_CLASSES, THEME_NAME, type ThemeClass } from './theme/silverpoint.css';
export type * from './types';
export { deckView, OVERVIEW_COLUMNS } from './view';
export type { DeckSlideView, DeckView, DeckViewOptions, DeckViewState, ViewAttrs } from './view';
