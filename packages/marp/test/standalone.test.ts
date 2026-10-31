import { cyanotype, listGrounds, silverpoint } from '@silverpoint/grounds';
import { describe, expect, test } from 'vitest';
import { invertTokens, slideTokens, themeRules, tokenBlocks } from '../src/theme/silverpoint.css';
import { standaloneTheme } from '../src/theme/standalone';

/* `@silverpoint/marp/theme.css` for Marp CLI and VS Code (T-264, REQ-582, DD-056). */

const css = standaloneTheme(listGrounds());
const decls = (tokens: Readonly<Record<string, string>>) => Object.entries(tokens).map(([p, v]) => `  ${p}: ${v};`).join('\n');

describe('the standalone theme (T-264)', () => {
  test('REQ-582 · a Marp theme with both sizes Marp Core reads', () => {
    expect(css.startsWith('/* @theme silverpoint */\n/* @size 16:9 1280px 720px */\n/* @size 4:3 960px 720px */\n')).toBe(true);
    expect(css).toContain(themeRules({ width: 1280, height: 720 }));
  });

  test('REQ-582 · no data-sp-* attribute there: the bare section is silverpoint on its first substrate', () => {
    expect(css).toContain(`section {\n${decls(slideTokens(silverpoint, silverpoint.substrates.cream!))}\n}`);
    expect(css).toContain(`section.invert {\n${decls(invertTokens(silverpoint, silverpoint.substrates.cream!))}\n}`);
  });

  test('REQ-582 · class: cyanotype selects the other built-in ground, invert included', () => {
    expect(css).toContain(`section.cyanotype {\n${decls(slideTokens(cyanotype, cyanotype.substrates.prussian!))}\n}`);
    expect(css).toContain(`section.cyanotype.invert {\n${decls(invertTokens(cyanotype, cyanotype.substrates.prussian!))}\n}`);
  });

  test('REQ-583 · the data-sp-* blocks too, for decks the silverpoint engine renders', () => {
    expect(css).toContain(tokenBlocks(listGrounds()));
  });

  test('REQ-582 · it says what degrades there', () => {
    expect(css).toMatch(/Marp CLI[\s\S]*no generated backdrops[\s\S]*fences[\s\S]*code/);
  });
});
