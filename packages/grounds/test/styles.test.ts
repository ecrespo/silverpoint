import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { silverpoint } from '../src';

const css = readFileSync(fileURLToPath(new URL('../src/styles.css', import.meta.url)), 'utf8');
const lockfile = readFileSync(fileURLToPath(new URL('../../../pnpm-lock.yaml', import.meta.url)), 'utf8');

/** The declarations of the first rule whose selector list contains `selector` exactly. */
function block(selector: string): Record<string, string> {
  const uncommented = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of uncommented.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = (match[1] ?? '').split(',').map((s) => s.trim().replace(/\s+/g, ' '));
    if (!selectors.includes(selector)) continue;
    const declarations: Record<string, string> = {};
    for (const declaration of (match[2] ?? '').split(';')) {
      const [name, ...value] = declaration.split(':');
      if (name?.trim() && value.length > 0) declarations[name.trim()] = value.join(':').trim();
    }
    return declarations;
  }
  throw new Error(`No rule for ${selector}`);
}

/** CSS with comments and custom-property declarations removed: what actually paints. */
function paintingRules(): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--sp-[a-z-]+\s*:[^;]+;/g, '');
}

describe('styles.css', () => {
  test.each(Object.entries(silverpoint.substrates))(
    "REQ-041 · substrate %s exposes the ground's colours as --sp- variables",
    (substrate, colour) => {
      const vars = block(`:where(.sp-ground-silverpoint[data-substrate='${substrate}']:not(.sp-root .sp-chart))`);
      expect(vars['--sp-substrate']).toBe(colour);
      expect(vars['--sp-ink']).toBe(silverpoint.ink.primary);
      expect(vars['--sp-ink-secondary']).toBe(silverpoint.ink.secondary);
      expect(vars['--sp-heighten']).toBe(silverpoint.ink.heighten);
      expect(vars['--sp-rule']).toBe(silverpoint.ink.rule);
      expect(vars['--sp-grid']).toBe(silverpoint.ink.grid);
      expect(vars['--sp-text']).toBe(silverpoint.ink.text);
      expect(vars['--sp-text-muted']).toBe(silverpoint.ink.textMuted);
    },
  );

  test('REQ-041 · the ground-wide variables of API Spec §10.2 are declared', () => {
    const vars = block(':where(.sp-ground-silverpoint:not(.sp-root .sp-chart))');
    expect(vars['--sp-font-display']).toBe(silverpoint.typography.display);
    expect(vars['--sp-stroke-width']).toBe('0.9');
    expect(vars['--sp-hatch-gap']).toBe(String(silverpoint.inkOptions.hatchGap));
    expect(vars['--sp-radius']).toBe('2px');
    expect(css).not.toMatch(/--sp-font-mono/);
  });

  test('REQ-042 · every part is painted from its variable', () => {
    expect(block(".sp-chart [part='sp-ink'][data-paint='stroke']").stroke).toBe('var(--sp-ink)');
    expect(block(".sp-chart [part='sp-ink'][data-paint='fill']").fill).toBe('var(--sp-ink)');
    expect(block(".sp-chart [part='sp-ink-secondary'][data-paint='stroke']").stroke).toBe('var(--sp-ink-secondary)');
    expect(block(".sp-chart [part='sp-heighten']").fill).toBe('var(--sp-heighten)');
    expect(block(".sp-chart [part='sp-rule']").stroke).toBe('var(--sp-rule)');
    expect(block(".sp-chart [part='sp-grid']").stroke).toBe('var(--sp-grid)');
    expect(block(".sp-chart [part='sp-axis']").fill).toBe('var(--sp-text-muted)');
    expect(block(".sp-chart [part='sp-text']").fill).toBe('var(--sp-text)');
  });

  test('REQ-042 · variables weigh nothing and are declared once per chart, so a consumer rule on .sp-root wins', () => {
    const declaring = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{[^{}]*--sp-ink:/g)].map((m) => (m[1] ?? '').trim());
    expect(declaring.length).toBeGreaterThan(0);
    for (const selector of declaring) {
      expect(selector.startsWith(':where(')).toBe(true);
      expect(selector).toContain(':not(.sp-root .sp-chart)');
    }
  });

  test('REQ-042 · no painting rule carries a literal colour', () => {
    expect(paintingRules()).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
  });

  test('REQ-029 · a tile-painted shape keeps its pattern fill and draws no outline of its own', () => {
    const tile = block(".sp-chart [data-paint='tile']");
    expect(tile.stroke).toBe('none');
    expect(tile.fill).toBeUndefined();
  });

  test('REQ-060 · the dotted baseline series is dashed by the stylesheet', () => {
    expect(block(".sp-chart [data-dash='dotted']")['stroke-dasharray']).toBeDefined();
  });

  test('REQ-023 · tone is never built with opacity', () => {
    expect(paintingRules()).not.toMatch(/(^|[^-])opacity\s*:\s*0?\.\d/m);
  });

  test('Data Model §3.6 · figures are tabular and small-caps lines are uppercase with 0.18em tracking', () => {
    expect(block('.sp-chart text')['font-variant-numeric']).toBe('tabular-nums');
    expect(block('.sp-chart text')['font-family']).toBe('var(--sp-font-display)');
    const smallCaps = block(".sp-chart [data-kind='badge']");
    expect(smallCaps['text-transform']).toBe('uppercase');
    expect(smallCaps['letter-spacing']).toBe('0.18em');
  });

  test('REQ-125 · under prefers-reduced-motion the entry animation is omitted', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.sp-chart[^{]*\{[^}]*animation:\s*none/);
  });

  test('REQ-121 · a hidden data table stays available to assistive technology', () => {
    const hidden = block(".sp-table[data-visibility='hidden']");
    expect(hidden.position).toBe('absolute');
    expect(hidden.clip).toBe('rect(0 0 0 0)');
    expect(hidden.display).toBeUndefined();
  });

  test('REQ-043 · no Tailwind: neither directives in the sheet nor the package anywhere in the tree', () => {
    expect(css).not.toMatch(/@tailwind|@apply/);
    // An optional peer declaration (ng-packagr has one) is not an installed package.
    expect(lockfile).not.toMatch(/^\s+'?tailwindcss@\d/m);
  });
});

describe('text over hatching', () => {
  test('REQ-124 · text carries a substrate-coloured halo, painted under its fill, so hatching never crosses a digit', () => {
    const text = block('.sp-chart text');
    expect(text['paint-order']).toBe('stroke');
    expect(text.stroke).toBe('var(--sp-substrate)');
    expect(Number.parseFloat(text['stroke-width'] ?? '0')).toBeGreaterThan(0);
    expect(text['stroke-linejoin']).toBe('round');
  });
});
