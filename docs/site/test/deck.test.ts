/**
 * The `/deck` page (T-286, T-287, REQ-626, REQ-627): `DECK_DEMO` drawn by the React `SpDeck`, and the
 * deck's documentation — usage in the three frameworks, the authoring guide (Markdown, directives,
 * the fence), the theme in Marp CLI and VS Code and what degrades there, SSR per framework — with
 * `SpDeck`'s props read from its type.
 */
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { DECK_DIRECTIVES, THEME_CLASSES } from '@silverpoint/marp';
import { propsReference } from '../../../tools/agent-catalog/props';
import { DeckPage } from '../src/pages/deck';

const reference = propsReference();
const html = renderToStaticMarkup(createElement(DeckPage));

describe('the deck page (REQ-626, REQ-627)', () => {
  test('REQ-627 · the deck reference is read from `SpDeckProps`: `markdown` required, every prop documented, no handler', () => {
    expect(reference.deck.map((p) => p.name)).toContain('markdown');
    expect(reference.deck.find((p) => p.name === 'markdown')).toMatchObject({ type: 'string', optional: false });
    expect(reference.deck.filter((p) => /^on[A-Z]/.test(p.name))).toEqual([]);
    expect(reference.deck.filter((p) => !p.doc).map((p) => p.name)).toEqual([]);
    for (const prop of reference.deck) expect(html, prop.name).toContain(`<code>${prop.name}`);
  });

  test('REQ-626 · it draws DECK_DEMO, its first slide and its controls in the server markup', () => {
    expect(html).toMatch(/class="sp-deck sp-ground-silverpoint"[^>]*role="region"/);
    expect(html).toContain('Slide 1 of 6');
    expect(html).toMatch(/data-sp-slot="s1-c1"[\s\S]*?<svg[^>]*class="sp-chart/);
    expect(readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8')).toMatch(/\['\/deck', 'Decks?'\]/);
  });

  test('REQ-627 · usage in React, Vue and Angular, with the peer and the stylesheets', () => {
    for (const text of ['@silverpoint/react/deck', '@silverpoint/vue/deck', '@silverpoint/angular/deck', 'npm install @silverpoint/marp', '@silverpoint/marp/deck.css', 'v-model:page', '[(page)]']) expect(html, text).toContain(text);
  });

  test('REQ-627 · the authoring guide: slides, notes, fragments, the directives, the classes, the fence and its errors', () => {
    for (const d of DECK_DIRECTIVES) expect(html, d.name).toContain(`<code>${d.name}</code>`);
    for (const c of THEME_CLASSES) expect(html, c).toContain(`<code>${c}</code>`);
    for (const text of ['```silverpoint', 'SP026', 'SP027', 'raw HTML', 'fragment', 'note']) expect(html, text).toContain(text);
  });

  test('REQ-627 · REQ-582 · the theme in Marp CLI and VS Code, and what degrades there', () => {
    for (const text of ['--theme', '@silverpoint/marp/theme.css', 'markdown.marp.themes', '--engine @silverpoint/marp/cli', 'no generated backdrops', 'shown as code', 'no controller']) expect(html, text).toContain(text);
  });

  test('REQ-627 · SSR in each framework', () => {
    for (const text of ['Next.js', 'use client', '@vue/server-renderer', '@angular/ssr', 'interactive']) expect(html, text).toContain(text);
  });
});
