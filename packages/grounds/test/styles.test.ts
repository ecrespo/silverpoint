import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { cyanotype, silverpoint } from '../src';

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

  test('REQ-041 · REQ-028 · cyanotype declares its colours and weights on the ground-wide rule, whatever the substrate', () => {
    const vars = block(':where(.sp-ground-cyanotype:not(.sp-root .sp-chart))');
    expect(vars).toEqual({
      '--sp-font-display': cyanotype.typography.display,
      '--sp-stroke-width': '0.9',
      '--sp-radius': '2px',
      '--sp-substrate': cyanotype.substrates.prussian,
      '--sp-ink': cyanotype.ink.primary,
      '--sp-ink-secondary': cyanotype.ink.secondary,
      '--sp-heighten': cyanotype.ink.heighten,
      '--sp-rule': cyanotype.ink.rule,
      '--sp-grid': cyanotype.ink.grid,
      '--sp-text': cyanotype.ink.text,
      '--sp-text-muted': cyanotype.ink.textMuted,
      ...Object.fromEntries(Object.entries(cyanotype.tonalRamp).map(([level, step]) => [`--sp-weight-${level}`, String('weight' in step ? step.weight : NaN)])),
    });
  });

  test.each([1, 2, 3, 4])('REQ-028 · data-weight="%i" sets the stroke width from its ground variable', (level) => {
    expect(block(`.sp-chart [data-weight='${level}']`)).toEqual({ 'stroke-width': `calc(var(--sp-stroke-width) * var(--sp-weight-${level}))` });
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
    // On the table's box: a table ignores `width` and `overflow` (T-096, WCAG 1.4.10).
    const hidden = block(".sp-table-box[data-visibility='hidden']");
    expect(hidden.position).toBe('absolute');
    expect(hidden.clip).toBe('rect(0 0 0 0)');
    expect(hidden.display).toBeUndefined();
  });

  test('REQ-043 · no Tailwind: neither directives in the sheet, nor a workspace package that installs it but the preset\'s tests', () => {
    expect(css).not.toMatch(/@tailwind|@apply/);
    // Each importer of the lockfile, and the dependency section each Tailwind package sits in. The
    // one exception is DD-020's: `@silverpoint/tailwind` compiles its preset with real Tailwind in
    // its tests, as devDependencies, and publishes no dependency at all.
    const found: string[] = [];
    for (const section of lockfile.split(/^importers:\n/m).slice(1)) {
      for (const block of (section.split(/^\S/m)[0] ?? '').split(/^(?=  \S)/m)) {
        const importer = /^  (\S+):/.exec(block)?.[1];
        let kind = '';
        for (const line of block.split('\n')) {
          kind = /^    (\w+):$/.exec(line)?.[1] ?? kind;
          if (/^      '?(@tailwindcss\/|tailwindcss\b)/.test(line)) found.push(`${importer} ${kind}`);
        }
      }
    }
    expect(found.length).toBeGreaterThan(0);
    expect([...new Set(found)]).toEqual(['packages/tailwind devDependencies']);
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
