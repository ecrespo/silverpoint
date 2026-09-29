import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { cyanotype, silverpoint } from '../src';
import { buildUiCss } from '../src/ui/ui-css';

const css = buildUiCss([silverpoint, cyanotype]);
const src = (path: string) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8');

interface Rule {
  readonly selector: string;
  readonly body: string;
  /** Enclosing at-rules, outermost first. */
  readonly media: readonly string[];
}

/** A small CSS reader: enough for the stylesheet this package writes (no comments inside rules). */
function rules(text: string): Rule[] {
  const out: Rule[] = [];
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const walk = (chunk: string, media: string[]) => {
    let i = 0;
    while (i < chunk.length) {
      const open = chunk.indexOf('{', i);
      if (open < 0) break;
      const prelude = chunk.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (depth > 0 && j < chunk.length) {
        if (chunk[j] === '{') depth++;
        else if (chunk[j] === '}') depth--;
        j++;
      }
      const inner = chunk.slice(open + 1, j - 1);
      if (prelude.startsWith('@')) walk(inner, [...media, prelude]);
      else out.push({ selector: prelude, body: inner, media });
      i = j;
    }
  };
  walk(stripped, []);
  return out;
}

/** Declarations of a rule, with every `url(…)` blanked so a data URI's bytes are not read as CSS. */
const declarations = (rule: Rule) =>
  rule.body
    .replace(/url\("[^"]*"\)/g, 'url()')
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const at = d.indexOf(':');
      return { property: d.slice(0, at).trim(), value: d.slice(at + 1).trim() };
    });

const all = rules(css);
const inForcedColors = (rule: Rule) => rule.media.some((m) => m.includes('forced-colors: active'));

describe('ui.css (T-141)', () => {
  test('REQ-305 · I-19 · no literal colour outside the forced-colors block: every paint is a --sp- property', () => {
    const literal = /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(|\b(?:black|white|red|green|blue|gray|grey)\b/i;
    const offending = all
      .filter((r) => !inForcedColors(r))
      .flatMap((r) => declarations(r).filter((d) => literal.test(d.value)).map((d) => `${r.selector} { ${d.property}: ${d.value} }`));
    expect(offending).toEqual([]);
    // The data URIs are masks: alpha only. Their one colour keyword never reaches the page.
    expect(css).toMatch(/url\("data:image\/svg\+xml,/);
  });

  test('REQ-305 · I-19 · system colours appear only inside the forced-colors block', () => {
    const system = /\b(?:CanvasText|Canvas|Highlight|HighlightText|ButtonText|ButtonFace|GrayText|LinkText)\b/;
    const outside = all.filter((r) => !inForcedColors(r)).flatMap((r) => declarations(r).filter((d) => system.test(d.value)));
    expect(outside).toEqual([]);
    expect(all.filter(inForcedColors).some((r) => /CanvasText/.test(r.body))).toBe(true);
  });

  test('REQ-314 · no native input is removed from the accessibility tree: no display:none or visibility:hidden on one', () => {
    const offending = all
      .filter((r) => /input|sp-ui-native/.test(r.selector))
      .flatMap((r) => declarations(r).filter((d) => /^(display: ?none|visibility: ?hidden)$/.test(`${d.property}: ${d.value}`)));
    expect(offending).toEqual([]);
    const hidden = all.find((r) => r.selector === '.sp-ui-native');
    expect(hidden?.body).toMatch(/position:\s*absolute/);
    expect(hidden?.body).toMatch(/clip-path:\s*inset\(50%\)/);
  });

  test('REQ-320 · transitions and animations live only under prefers-reduced-motion: no-preference', () => {
    const moving = all.filter((r) => declarations(r).some((d) => /^(transition|animation)/.test(d.property)));
    expect(moving.length).toBeGreaterThan(0);
    for (const r of moving) expect(r.media.some((m) => m.includes('prefers-reduced-motion: no-preference'))).toBe(true);
  });

  test('REQ-306 · I-17 · what depends on the mode is paint only: no rule keyed on data-mode sets a size, a position or a margin', () => {
    const paint = /^(-webkit-)?(mask(-[a-z]+)?|background(-[a-z]+)?|border(-[a-z]+)?|--sp-[a-z0-9-]+)$/;
    const layout = all
      .filter((r) => r.selector.includes('data-mode'))
      .flatMap((r) => declarations(r).filter((d) => !paint.test(d.property)).map((d) => `${r.selector} { ${d.property} }`));
    expect(layout).toEqual([]);
    // The frame and the tone never take layout space in either mode: they are laid over the box.
    for (const part of ['sp-frame', 'sp-tone']) {
      const base = all.find((r) => r.selector === `.sp-ui [part='${part}']`);
      expect(base?.body).toMatch(/position:\s*absolute/);
      expect(base?.body).toMatch(/inset:\s*0/);
      expect(base?.body).toMatch(/box-sizing:\s*border-box/);
    }
  });

  test('REQ-316 · the focus indicator is an exact outline, at least 2 px, never a masked or inked shape', () => {
    const focus = all.filter((r) => r.selector.includes(':focus-visible'));
    expect(focus.length).toBeGreaterThan(0);
    for (const r of focus) {
      expect(r.body).toMatch(/outline:\s*var\(--sp-ui-focus-width\) solid var\(--sp-ui-focus-color\)/);
      expect(r.body).not.toMatch(/mask/);
    }
    for (const ground of [silverpoint, cyanotype]) {
      expect(css).toMatch(new RegExp(`\\.sp-ground-${ground.name}\\)? *\\{[^}]*--sp-ui-focus-width: 2px`));
    }
  });

  test('REQ-312 · REQ-317 · each ground\'s ui tokens become its --sp-ui- properties; heights are at least 24 px', () => {
    for (const ground of [silverpoint, cyanotype]) {
      const block = all.find((r) => r.selector === `:where(.sp-ground-${ground.name})`);
      expect(block?.body).toMatch(/--sp-ui-height-sm: 24px/);
      expect(block?.body).toMatch(/--sp-ui-height-md: 32px/);
      expect(block?.body).toMatch(/--sp-ui-height-lg: 40px/);
      expect(block?.body).toMatch(/--sp-ui-radius: 2px/);
    }
  });

  test('REQ-305 · REQ-307 · an inked ground has a mask for every kind in every frame slot 0..5, folded onto its variants; a css ground has none', () => {
    const variants = silverpoint.ui!.frameVariants;
    for (const kind of ['control', 'pill', 'box', 'card', 'round']) {
      const masks = all.filter((r) => r.selector.startsWith('.sp-ui.sp-ground-silverpoint:is(') && r.selector.endsWith(`[part='sp-frame'][data-kind='${kind}']`) && r.body.includes('--sp-ui-mask:'));
      expect(masks).toHaveLength(variants);
      for (let slot = 0; slot < 6; slot++) {
        const rule = masks.find((r) => r.selector.includes(`[data-frame='${slot}']`));
        expect(rule?.selector).toContain(`[data-frame='${slot % variants}']`);
      }
    }
    expect(all.some((r) => r.selector.includes('sp-ground-cyanotype') && r.body.includes('--sp-ui-mask:'))).toBe(false);
  });

  test('REQ-308 · C-7 · tone is the ramp in both modes: hatch masks under silverpoint, line weight under cyanotype', () => {
    const states = silverpoint.ui!.tone;
    for (const level of [1, 2, 3, 4] as const) {
      const hatch = all.find((r) => r.selector.startsWith(".sp-ground-silverpoint [part='sp-tone']:is(") && r.selector.includes(`[data-tone='${level}']`));
      expect(hatch?.body).toMatch(/--sp-ui-tone: url\(/);
      expect(hatch?.selector).not.toMatch(/data-mode/);
      // Each state the ground's tokens map to this level shares its rule (DD-026).
      for (const [state, at] of Object.entries(states)) if (at === level) expect(hatch?.selector).toContain(`[data-tone='${state}']`);
      const weight = all.find((r) => r.selector.startsWith(".sp-ground-cyanotype [part='sp-tone']:is(") && r.selector.includes(`[data-tone='${level}']`));
      expect(weight?.body).toMatch(new RegExp(`border-width: calc\\(var\\(--sp-stroke-width\\) \\* var\\(--sp-weight-${level}\\) \\* 1px\\)`));
    }
    expect(css).not.toMatch(/opacity/);
  });

  test('REQ-317 · every B1 control is at least 24 px tall: its height is a --sp-ui-height, or its label is', () => {
    for (const selector of ['.sp-button', '.sp-input .sp-ui-box']) {
      expect(all.find((r) => r.selector === selector)?.body).toMatch(/min-block-size: var\(--sp-ui-height\)/);
    }
    expect(all.find((r) => r.selector === '.sp-checkbox,\n.sp-switch')?.body).toMatch(/min-block-size: 24px/);
  });

  test('REQ-310 · a checkbox\'s tick, dash and tone follow the native state and data-indeterminate, never a script', () => {
    expect(css).toContain(".sp-ui-native:checked + .sp-ui-box [data-glyph='tick']");
    expect(css).toContain(".sp-checkbox[data-indeterminate] [data-glyph='dash']");
    expect(css).toContain(".sp-ui-native:checked + .sp-ui-track [part='sp-knob']");
  });

  test('REQ-301 · the charts\' styles.css is untouched by the components: byte for byte what 0.2.0 shipped', () => {
    const hash = createHash('sha256').update(src('src/styles.css') + src('src/dashboard.css')).digest('hex');
    expect(hash).toBe('363c596a7ec5cc6904d325d720cb2128ef6b70a40d10c27b6eda0083e1b5cda0');
  });

  test('REQ-301 · ui.css is a separate, opt-in file of the package, written by the build', () => {
    const pkg = JSON.parse(src('package.json')) as { exports: Record<string, unknown>; scripts: { build: string } };
    expect(pkg.exports['./ui.css']).toBe('./dist/ui.css');
    expect(pkg.scripts.build).toMatch(/build-ui-css/);
  });

  test('Art. 4 · the stylesheet is the same bytes on every build', () => {
    expect(buildUiCss([silverpoint, cyanotype])).toBe(css);
  });
});
