import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

/* deck.css — the deck chrome (T-271, DD-051, DD-057, API delta §8). */

const css = readFileSync(join(__dirname, '../src/deck.css'), 'utf8');
const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
/** The declarations of the first rule whose selector list contains `selector`, inside `scope` when given. */
function rule(selector: string, scope = body): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|[},]|\\n)\\s*${escaped}\\s*(?:,[^{]*)?\\{([^}]*)\\}`, 'm').exec(scope);
  expect(m, `no rule for ${selector}`).not.toBeNull();
  return m![1]!;
}
function media(query: string): string {
  const start = body.indexOf(`@media ${query}`);
  expect(start, `no @media ${query}`).toBeGreaterThanOrEqual(0);
  let depth = 0;
  for (let i = body.indexOf('{', start); i < body.length; i++) {
    if (body[i] === '{') depth++;
    else if (body[i] === '}' && --depth === 0) return body.slice(start, i + 1);
  }
  throw new Error('unbalanced');
}

describe('deck.css (T-271)', () => {
  test('API §8 · the custom properties of the contract, with defaults', () => {
    const root = rule('.sp-deck');
    for (const p of ['--sp-deck-gap', '--sp-deck-notes-width', '--sp-deck-controls-height']) expect(root).toMatch(new RegExp(`${p}:\\s*\\d+px;`));
  });

  test('REQ-617 · before hydration the svg scales by its viewBox; under data-sp-scaled it is fixed at the slide size and scaled from the corner', () => {
    expect(rule('.sp-deck-slide > svg')).toMatch(/width: 100%;[^]*height: auto;/);
    const scaled = rule('.sp-deck-viewport[data-sp-scaled] .sp-deck-slide > svg');
    expect(scaled).toMatch(/width: 1280px;[^]*height: 720px;/);
    expect(scaled).toMatch(/transform: scale\(var\(--sp-deck-scale, 1\)\);/);
    expect(scaled).toMatch(/transform-origin: 0 0;/);
    expect(rule('.sp-deck-viewport[data-sp-scaled] .sp-deck-slide > svg[viewBox="0 0 960 720"]')).toMatch(/width: 960px;/);
    expect(rule('.sp-deck-slide')).toMatch(/aspect-ratio: 16 \/ 9;[^]*overflow: hidden;/);
    expect(rule('.sp-deck-slide:has(> svg[viewBox="0 0 960 720"])')).toMatch(/aspect-ratio: 4 \/ 3;/);
  });

  test('REQ-614 · a hidden slide box is not displayed', () => {
    expect(rule('.sp-deck-slide[hidden]')).toMatch(/display: none;/);
  });

  test('REQ-597 · a pending fragment keeps its box, is invisible and out of the accessibility tree', () => {
    expect(rule('.sp-deck [data-sp-pending]')).toMatch(/visibility: hidden;/);
    expect(rule('.sp-deck [data-sp-pending]')).not.toMatch(/display:/);
  });

  test('REQ-597 · REQ-604 · the overview and print show every fragment', () => {
    expect(rule('.sp-deck-overview [data-sp-pending]')).toMatch(/visibility: visible;/);
    expect(rule('.sp-deck [data-sp-pending]', media('print'))).toMatch(/visibility: visible !important;/);
  });

  test('REQ-604 · the overview is a grid of focusable thumbnails, the current one heightened with its ink outline (Art. 6, REQ-031)', () => {
    expect(rule('.sp-deck-overview')).toMatch(/display: grid;[^]*grid-template-columns: repeat\(var\(--sp-deck-overview-columns, 4\), minmax\(0, 1fr\)\);/);
    expect(rule('.sp-deck-viewport[data-sp-scaled] .sp-deck-overview .sp-deck-slide > svg')).toMatch(/width: 100%;[^]*transform: none;/);
    const current = rule('.sp-deck-thumb[aria-current="true"]');
    expect(current).toMatch(/var\(--sp-heighten\)/);
    expect(current).toMatch(/0 0 0 1px var\(--sp-ink\)[^;]*var\(--sp-heighten\)[^;]*var\(--sp-ink\)/);
    expect(rule('.sp-deck-thumb:focus-visible')).toMatch(/outline:/);
  });

  test('REQ-607 · notes beside the slides, below them on a narrow deck', () => {
    expect(rule('.sp-deck:has(> .sp-deck-notes)')).toMatch(/grid-template-columns: minmax\(0, 1fr\) var\(--sp-deck-notes-width\);/);
    expect(rule('.sp-deck:has(> .sp-deck-notes)', media('(max-width: 720px)'))).toMatch(/grid-template-columns: minmax\(0, 1fr\);/);
  });

  test('REQ-613 · REQ-614 · the controls bar, a tabular counter, a visually hidden live status, a focus indicator on the deck', () => {
    expect(rule('.sp-deck-controls')).toMatch(/display: flex;[^]*min-height: var\(--sp-deck-controls-height\);/);
    expect(rule('.sp-deck-counter')).toMatch(/font-variant-numeric: tabular-nums;/);
    const status = rule('.sp-deck-status');
    expect(status).toMatch(/position: absolute;[^]*width: 1px;[^]*height: 1px;[^]*overflow: hidden;[^]*clip-path: inset\(50%\);/);
    expect(rule('.sp-deck:focus-visible')).toMatch(/outline: var\(--sp-ui-focus-width, 2px\) solid var\(--sp-ui-focus-color, var\(--sp-ink, currentColor\)\);/);
  });

  test('REQ-605 · print: one slide per page at its size, unscaled; controls, notes, overview and status hidden', () => {
    const print = media('print');
    expect(rule('.sp-deck-slide', print)).toMatch(/display: block !important;[^]*width: 1280px;[^]*height: 720px;[^]*break-after: page;[^]*page: sp-deck-16x9;/);
    expect(rule('.sp-deck-slide:has(> svg[viewBox="0 0 960 720"])', print)).toMatch(/width: 960px;[^]*page: sp-deck-4x3;/);
    expect(rule('.sp-deck-slide > svg', print)).toMatch(/width: 1280px !important;[^]*transform: none !important;/);
    for (const part of ['.sp-deck-controls', '.sp-deck-notes', '.sp-deck-status']) expect(rule(part, print)).toMatch(/display: none !important;/);
    expect(rule('.sp-deck-overview', print)).toMatch(/display: block !important;/);
    expect(body).toMatch(/@page sp-deck-16x9 \{\s*size: 1280px 720px;\s*margin: 0;\s*\}/);
    expect(body).toMatch(/@page sp-deck-4x3 \{\s*size: 960px 720px;\s*margin: 0;\s*\}/);
  });

  test('REQ-615 · reduced motion: no transition; forced precision: the exact backdrop on the slide’s own layers', () => {
    expect(rule('.sp-deck *', media('(prefers-reduced-motion: reduce)'))).toMatch(/transition: none !important;/);
    const forced = media('(prefers-contrast: more), (forced-colors: active)');
    expect(forced).toMatch(/background-image: var\(--sp-deck-backdrop-precision, var\(--sp-deck-backdrop, none\)\) !important;/);
    // Marpit's own transparent content and pseudo layers stay transparent.
    expect(forced).toMatch(/:not\(\[data-marpit-advanced-background="content"\], \[data-marpit-advanced-background="pseudo"\]\)/);
  });

  test('Art. 7 · no colour literal: every colour is a token', () => {
    expect(body).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b(?:white|black)\b(?!-)/i);
  });

  test('DD-010 · no monospace; type from the ground', () => {
    expect(body).not.toMatch(/monospace|courier|consolas|menlo/i);
    for (const family of body.match(/font-family:[^;]*;/g) ?? []) expect(family).toMatch(/var\(--sp-font-display/);
  });

  test('the package exports it, and the build ships it', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
    expect(pkg.exports['./deck.css']).toBe('./dist/deck.css');
    expect(pkg.scripts.build).toContain('src/deck.css');
  });
});
