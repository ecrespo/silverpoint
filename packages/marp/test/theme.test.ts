import { cyanotype, listGrounds, silverpoint } from '@silverpoint/grounds';
import { describe, expect, test } from 'vitest';
import { createDeckEngine } from '../src';
import { invertTokens, slideTokens, THEME_CLASSES, THEME_SCALE, themeRules, themeSource, tokenBlocks } from '../src/theme/silverpoint.css';

/* The `silverpoint` Marpit theme (T-262, T-263, DD-056, API delta §3). */

const W169 = { width: 1280, height: 720 };
const rules = themeRules(W169);

describe('the theme (T-262)', () => {
  test('REQ-577 · a Marpit theme named silverpoint, at the deck’s size', () => {
    expect(themeSource(W169).startsWith('/* @theme silverpoint */\n')).toBe(true);
    expect(themeRules(W169)).toMatch(/section \{[^}]*width: 1280px;[^}]*height: 720px;/);
    expect(themeRules({ width: 960, height: 720 })).toMatch(/section \{[^}]*width: 960px;[^}]*height: 720px;/);
  });

  test('REQ-577 · the type scale of API §3: h1 64, h2 48, h3 36, body 30, small 22, line-height 1.3, padding 64/80', () => {
    expect(THEME_SCALE).toMatchObject({ h1: 64, h2: 48, h3: 36, body: 30, small: 22, lead: 88, lineHeight: 1.3, padding: { block: 64, inline: 80 } });
    expect(rules).toMatch(/section \{[^}]*font-size: 30px;[^}]*line-height: 1\.3;[^}]*padding: 64px 80px;/);
    expect(rules).toMatch(/section h1 \{[^}]*font-size: 64px;/);
    expect(rules).toMatch(/section h2 \{[^}]*font-size: 48px;/);
    expect(rules).toMatch(/section h3 \{[^}]*font-size: 36px;/);
  });

  test('REQ-577 · it styles every element of the contract', () => {
    for (const selector of ['section p', 'section ul', 'section ol', 'section li::marker', 'section table', 'section th', 'section td', 'section blockquote', 'section code', 'section pre', 'section img', 'section header', 'section footer', 'section a', 'section .sp-deck-chart--error'])
      expect(rules, selector).toContain(`${selector} {`);
  });

  test('REQ-577 · pagination from Marpit’s attributes, bottom right', () => {
    expect(rules).toMatch(/section\[data-marpit-pagination\]::after \{[^}]*content: attr\(data-marpit-pagination\) ' \/ ' attr\(data-marpit-pagination-total\);[^}]*right: 80px;[^}]*bottom: 24px;/);
  });

  test('REQ-577 · Marpit’s scaffold pads the pagination with the section’s padding; the theme resets it', () => {
    expect(rules).toMatch(/section\[data-marpit-pagination\]::after \{[^}]*padding: 0;/);
  });

  test('REQ-577 · a header leaves the content clear of its rule', () => {
    expect(rules).toMatch(/section:has\(> header\) \{[^}]*padding-top: 104px;/);
    expect(rules).toMatch(/section\.plate:has\(> header\) \{[^}]*padding-top: 120px;/);
  });

  test('REQ-578 · inline code is framed by a hairline, as the block’s plate', () => {
    expect(rules).toMatch(/section :not\(pre\) > code \{[^}]*border: 1px solid var\(--sp-rule\);/);
  });

  test('REQ-578 · DD-010 · code in EB Garamond with tabular figures, on a framed plate; no monospace', () => {
    expect(rules).toMatch(/section pre \{[^}]*font-family: var\(--sp-font-display\);[^}]*font-variant-numeric: tabular-nums;[^}]*border: 1px solid var\(--sp-rule\);/);
    expect(rules).toMatch(/section code \{[^}]*font-family: var\(--sp-font-display\);[^}]*font-variant-numeric: tabular-nums;/);
    expect(themeSource(W169)).not.toMatch(/monospace|courier|consolas|menlo|mono\b/i);
    for (const family of themeSource(W169).match(/font-family:[^;]*;/g) ?? []) expect(family).toBe('font-family: var(--sp-font-display);');
  });

  test('REQ-580 · canvas px only: no rem, viewport or container units', () => {
    expect(themeSource(W169)).not.toMatch(/\d(?:\.\d+)?(?:rem|vw|vh|vmin|vmax|svh|lvh|dvh|cqw|cqh|cqi|cqb|cqmin|cqmax)\b/);
  });

  test('Art. 7 · the rules carry no colour: every colour is a --sp-* property', () => {
    expect(rules).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
    expect(rules).toMatch(/section \{[^}]*color: var\(--sp-text\);[^}]*background-color: var\(--sp-substrate\);[^}]*background-image: var\(--sp-deck-backdrop, none\);/);
  });
});

describe('token blocks (T-262, Art. 7)', () => {
  test('REQ-577 · one block per ground × substrate, its values read from the ground', () => {
    const css = tokenBlocks(listGrounds());
    for (const ground of [silverpoint, cyanotype]) {
      for (const [substrate, colour] of Object.entries(ground.substrates)) {
        const block = new RegExp(`section\\[data-sp-ground="${ground.name}"\\]\\[data-sp-substrate="${substrate}"\\] \\{([^}]*)\\}`).exec(css)?.[1];
        expect(block, `${ground.name}/${substrate}`).toBeDefined();
        expect(block).toContain(`--sp-substrate: ${colour};`);
        expect(block).toContain(`--sp-text: ${ground.ink.text};`);
        expect(block).toContain(`--sp-rule: ${ground.ink.rule};`);
        expect(block).toContain(`--sp-font-display: ${ground.typography.display};`);
      }
    }
  });

  test('REQ-579 · invert: text in the heightening on the ground’s primary ink', () => {
    expect(invertTokens(silverpoint, silverpoint.substrates.cream!)).toMatchObject({ '--sp-substrate': silverpoint.ink.primary, '--sp-text': silverpoint.ink.heighten, '--sp-rule': silverpoint.substrates.cream });
    expect(tokenBlocks([cyanotype])).toContain(`section.invert[data-sp-ground="cyanotype"][data-sp-substrate="prussian"] {`);
    expect(slideTokens(cyanotype, cyanotype.substrates.prussian!)['--sp-ink']).toBe(cyanotype.ink.primary);
  });
});

describe('classes (T-263)', () => {
  test('REQ-579 · lead, invert, plate, hatched', () => {
    expect(THEME_CLASSES).toEqual(['lead', 'invert', 'plate', 'hatched']);
    for (const c of ['lead', 'plate', 'hatched']) expect(rules).toContain(`section.${c} {`);
    expect(rules).toMatch(/section\.lead \{[^}]*justify-content: center;/);
    expect(rules).toMatch(/section\.lead h1 \{[^}]*font-size: 88px;[^}]*border-bottom: 1px solid var\(--sp-rule\);/);
  });

  test('REQ-579 · plate and hatched keep the content inside the plate and the band', () => {
    expect(rules).toMatch(/section\.plate \{[^}]*padding: 80px 104px;/);
    expect(rules).toMatch(/section\.hatched \{[^}]*padding: 80px 104px;/);
    for (const c of ['plate', 'hatched']) {
      expect(rules).toMatch(new RegExp(`section\\.${c} header, section\\.${c} footer \\{[^}]*left: 104px;[^}]*right: 104px;`));
      expect(rules).toMatch(new RegExp(`section\\.${c} footer \\{[^}]*bottom: 44px;`));
      expect(rules).toMatch(new RegExp(`section\\.${c}\\[data-marpit-pagination\\]::after \\{[^}]*right: 104px;[^}]*bottom: 44px;`));
    }
  });
});

describe('the theme inside a deck (T-262)', () => {
  test('REQ-571 · REQ-577 · the deck’s scoped CSS carries the rules and the token blocks', () => {
    const { css } = createDeckEngine({ id: 't1' }).render('# A');
    const scope = 'div.sp-deck-t1 > div.sp-deck-slide > svg > foreignObject > section';
    expect(css).toContain(`${scope}[data-sp-ground="cyanotype"][data-sp-substrate="prussian"] {`);
    expect(css).toContain(`${scope} h1 {`);
    expect(css).toContain(`${scope}.invert[data-sp-ground="silverpoint"][data-sp-substrate="cream"] {`);
  });
});
