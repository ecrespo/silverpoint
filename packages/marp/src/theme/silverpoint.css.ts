/**
 * The `silverpoint` Marpit theme (DD-056, API delta §3, REQ-577..REQ-580). Its rules use `--sp-*`
 * custom properties only; the values are read from the ground objects into one block per ground ×
 * substrate and one `invert` block each (Art. 7). Sizes are px of the slide canvas: no rem,
 * viewport or container units (REQ-580). Type is the ground's display face; no monospace (DD-010).
 */
import type { Ground } from '@silverpoint/core';

export const THEME_NAME = 'silverpoint';

export const THEME_CLASSES = ['lead', 'invert', 'plate', 'hatched'] as const;
export type ThemeClass = (typeof THEME_CLASSES)[number];

/** API delta §3. */
export const THEME_SCALE = Object.freeze({
  h1: 64,
  h2: 48,
  h3: 36,
  body: 30,
  small: 22,
  lead: 88,
  lineHeight: 1.3,
  padding: Object.freeze({ block: 64, inline: 80 }),
  /** Inside the plate's outer rule (30 px) and the hatched band (32 px), with the body's margin. */
  inset: Object.freeze({ block: 80, inline: 104 }),
});

type Tokens = Readonly<Record<`--sp-${string}`, string>>;

/** The slide's properties on one substrate: the grounds' own names, so a palette overrides both. */
export function slideTokens(ground: Ground, substrate: string): Tokens {
  return {
    '--sp-font-display': ground.typography.display,
    '--sp-substrate': substrate,
    '--sp-ink': ground.ink.primary,
    '--sp-ink-secondary': ground.ink.secondary,
    '--sp-heighten': ground.ink.heighten,
    '--sp-rule': ground.ink.rule,
    '--sp-grid': ground.ink.grid,
    '--sp-text': ground.ink.text,
    '--sp-text-muted': ground.ink.textMuted,
  };
}

/** `invert`: the heightening on the ground's primary ink, the substrate as its second colour (REQ-579). */
export function invertTokens(ground: Ground, substrate: string): Tokens {
  return {
    ...slideTokens(ground, substrate),
    '--sp-substrate': ground.ink.primary,
    '--sp-ink': ground.ink.heighten,
    '--sp-ink-secondary': substrate,
    '--sp-heighten': substrate,
    '--sp-rule': substrate,
    '--sp-grid': substrate,
    '--sp-text': ground.ink.heighten,
    '--sp-text-muted': substrate,
  };
}

const block = (selector: string, declarations: Readonly<Record<string, string | number>>): string =>
  `${selector} {\n${Object.entries(declarations).map(([p, v]) => `  ${p}: ${v};`).join('\n')}\n}\n`;

/** One block per ground × substrate, and its `invert` twin, for the slides' `data-sp-*` attributes. */
export function tokenBlocks(grounds: readonly Ground[], prefix = 'section'): string {
  return grounds
    .flatMap((ground) =>
      Object.entries(ground.substrates).flatMap(([name, colour]) => {
        const at = `[data-sp-ground="${ground.name}"][data-sp-substrate="${name}"]`;
        return [block(`${prefix}${at}`, slideTokens(ground, colour)), block(`${prefix}.invert${at}`, invertTokens(ground, colour))];
      }),
    )
    .join('\n');
}

const px = (n: number): string => `${n}px`;
/** Header, footer and page number inside the plate (30 px) and the band (32 px), 12 px clear. */
const INNER_EDGE = 44;

/** The theme's rules over `--sp-*` properties, at a slide size. */
export function themeRules(size: { readonly width: number; readonly height: number }): string {
  const s = THEME_SCALE;
  const pad = `${px(s.padding.block)} ${px(s.padding.inline)}`;
  const inset = `${px(s.inset.block)} ${px(s.inset.inline)}`;
  const edge = px(24);
  return [
    block('section', {
      width: px(size.width),
      height: px(size.height),
      'box-sizing': 'border-box',
      position: 'relative',
      overflow: 'hidden',
      'font-family': 'var(--sp-font-display)',
      'font-size': px(s.body),
      'line-height': s.lineHeight,
      padding: pad,
      color: 'var(--sp-text)',
      'background-color': 'var(--sp-substrate)',
      'background-image': 'var(--sp-deck-backdrop, none)',
      'background-size': '100% 100%',
      'background-repeat': 'no-repeat',
      'font-kerning': 'normal',
    }),
    block('section h1, section h2, section h3, section h4, section h5, section h6', { color: 'var(--sp-text)', 'font-weight': 500, 'line-height': 1.1, margin: `0 0 ${px(24)}` }),
    block('section h1', { 'font-size': px(s.h1) }),
    block('section h2', { 'font-size': px(s.h2) }),
    block('section h3', { 'font-size': px(s.h3) }),
    block('section h4, section h5, section h6', { 'font-size': px(s.body), 'text-transform': 'uppercase', 'letter-spacing': '0.08em' }),
    block('section p', { margin: `0 0 ${px(20)}` }),
    block('section ul, section ol', { margin: `0 0 ${px(20)}`, 'padding-left': px(40) }),
    block('section ul', { 'list-style': 'disc' }),
    block('section ol', { 'font-variant-numeric': 'tabular-nums' }),
    block('section li::marker', { color: 'var(--sp-ink)' }),
    block('section a', { color: 'var(--sp-ink)', 'text-decoration-thickness': px(1), 'text-underline-offset': px(4) }),
    block('section strong', { 'font-weight': 500 }),
    block('section em', { 'font-style': 'italic' }),
    block('section blockquote', { margin: `0 0 ${px(20)}`, padding: `0 0 0 ${px(24)}`, 'border-left': `${px(2)} solid var(--sp-rule)`, color: 'var(--sp-text-muted)', 'font-style': 'italic' }),
    block('section table', { 'border-collapse': 'collapse', margin: `0 0 ${px(20)}`, 'font-variant-numeric': 'tabular-nums', 'border-top': '1px solid var(--sp-rule)', 'border-bottom': '1px solid var(--sp-rule)' }),
    block('section th', { 'font-size': px(s.small), 'font-weight': 500, 'text-transform': 'uppercase', 'letter-spacing': '0.08em', 'text-align': 'left', padding: `${px(8)} ${px(16)}`, 'border-bottom': '1px solid var(--sp-rule)' }),
    block('section td', { padding: `${px(8)} ${px(16)}` }),
    // DD-010, REQ-578: code is the display face with tabular figures; a block is a framed plate.
    block('section code', { 'font-family': 'var(--sp-font-display)', 'font-variant-numeric': 'tabular-nums', color: 'var(--sp-ink-secondary)' }),
    block('section pre', {
      'font-family': 'var(--sp-font-display)',
      'font-size': px(24),
      'line-height': 1.35,
      'font-variant-numeric': 'tabular-nums',
      border: '1px solid var(--sp-rule)',
      outline: '1px solid var(--sp-rule)',
      'outline-offset': px(4),
      margin: `${px(4)} ${px(4)} ${px(24)}`,
      padding: `${px(20)} ${px(28)}`,
      'white-space': 'pre-wrap',
      'tab-size': 2,
    }),
    block('section :not(pre) > code', { border: '1px solid var(--sp-rule)', 'border-radius': px(2), padding: `0 ${px(6)}` }),
    block('section pre code', { color: 'var(--sp-text)', 'font-size': 'inherit' }),
    block('section img', { 'max-width': '100%' }),
    block('section header, section footer', {
      position: 'absolute',
      left: px(s.padding.inline),
      right: px(s.padding.inline),
      'font-size': px(s.small),
      'text-transform': 'uppercase',
      'letter-spacing': '0.12em',
      color: 'var(--sp-text-muted)',
    }),
    block('section:has(> header)', { 'padding-top': px(s.padding.block + 40) }),
    block('section header', { top: edge, 'padding-bottom': px(6), 'border-bottom': '1px solid var(--sp-rule)' }),
    block('section footer', { bottom: edge, 'padding-top': px(6), 'border-top': '1px solid var(--sp-rule)' }),
    block('section[data-marpit-pagination] footer', { right: px(200) }),
    block('section[data-marpit-pagination]::after', {
      content: "attr(data-marpit-pagination) ' / ' attr(data-marpit-pagination-total)",
      // Marpit's scaffold gives the pseudo element the section's padding (`padding: inherit`).
      padding: 0,
      position: 'absolute',
      right: px(s.padding.inline),
      bottom: edge,
      'font-size': px(s.small),
      'font-variant-numeric': 'tabular-nums',
      color: 'var(--sp-text-muted)',
    }),
    // Chart fences (REQ-589, REQ-591): the slot, and the error figure in the UI layer's alert look.
    block('section .sp-deck-chart', { margin: `0 0 ${px(20)}` }),
    block('section .sp-deck-chart--error', { border: '1px solid var(--sp-rule)', padding: `${px(16)} ${px(24)}`, 'font-size': px(s.small), 'font-style': 'italic', color: 'var(--sp-text)' }),
    block('section .sp-deck-chart--error figcaption', { margin: 0 }),
    // Classes (REQ-579).
    block('section.lead', { display: 'flex', 'flex-direction': 'column', 'justify-content': 'center' }),
    block('section.lead h1', { 'font-size': px(s.lead), 'padding-bottom': px(24), 'border-bottom': '1px solid var(--sp-rule)' }),
    ...(['plate', 'hatched'] as const).flatMap((c) => [
      block(`section.${c}`, { padding: inset }),
      // Header, footer and page number inside the plate's rule and the band.
      block(`section.${c} header, section.${c} footer`, { left: px(s.inset.inline), right: px(s.inset.inline) }),
      block(`section.${c} header`, { top: px(INNER_EDGE) }),
      block(`section.${c}:has(> header)`, { 'padding-top': px(s.inset.block + 40) }),
      block(`section.${c} footer`, { bottom: px(INNER_EDGE) }),
      block(`section.${c}[data-marpit-pagination] footer`, { right: px(s.inset.inline + 120) }),
      block(`section.${c}[data-marpit-pagination]::after`, { right: px(s.inset.inline), bottom: px(INNER_EDGE) }),
    ]),
  ].join('\n');
}

/** The deck's theme: rules and every registered ground's blocks (DD-056). */
export function themeSource(size: { readonly width: number; readonly height: number }, grounds: readonly Ground[] = []): string {
  return `/* @theme ${THEME_NAME} */\n${themeRules(size)}\n${tokenBlocks(grounds)}`;
}
