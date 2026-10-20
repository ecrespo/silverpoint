import { afterEach, describe, expect, test } from 'vitest';
import * as main from '../src';
import { __setDiagnosticSink, type Palette as MainPalette, type SpCode } from '../src';
import * as palettesEntry from '../src/palettes';
import {
  checkPalette,
  contrastRatio,
  indigo,
  ironGall,
  PALETTE_NAMES,
  PALETTE_PAIRS,
  PALETTE_PROPERTIES,
  paletteStyle,
  PALETTES,
  resolvePalette,
  sanguine,
  sepia,
  silverpoint,
  verdigris,
  type Palette,
} from '../src/palettes';

let restore: () => void = () => {};
afterEach(() => restore());

function capture(): Array<{ code: SpCode; message: string }> {
  const seen: Array<{ code: SpCode; message: string }> = [];
  restore = __setDiagnosticSink((code, message) => seen.push({ code, message }));
  return seen;
}

describe('palettes — entry points (T-200, REQ-164)', () => {
  test('REQ-164 · the palette API lives on @silverpoint/core/palettes, off the main entry and its 45 kB budget', () => {
    const api = ['PALETTE_PROPERTIES', 'paletteStyle', 'resolvePalette', 'checkPalette', 'contrastRatio', 'PALETTE_PAIRS'];
    for (const name of api) {
      expect(Object.keys(palettesEntry), name).toContain(name);
      expect(Object.keys(main), name).not.toContain(name);
    }
    // The type is still importable from the main entry, where CommonChartProps uses it.
    const typed: MainPalette = silverpoint;
    expect(typed).toBe(silverpoint);
  });
});

describe('palettes — model and declarations (T-200)', () => {
  test('REQ-460 · nine fields, each one --sp- property, in the fixed order of Data Model §2.26', () => {
    expect(Object.entries(PALETTE_PROPERTIES)).toEqual([
      ['substrate', '--sp-substrate'],
      ['ink', '--sp-ink'],
      ['inkSecondary', '--sp-ink-secondary'],
      ['heighten', '--sp-heighten'],
      ['rule', '--sp-rule'],
      ['grid', '--sp-grid'],
      ['text', '--sp-text'],
      ['textMuted', '--sp-text-muted'],
      ['focus', '--sp-ui-focus-color'],
    ]);
    expect(Object.isFrozen(PALETTE_PROPERTIES)).toBe(true);
  });

  test('REQ-461 · paletteStyle writes the set fields in that order, whatever the object order', () => {
    const palette: Palette = { text: '#4A2216', focus: '#123456', ink: '#8A3A24', substrate: '#F2E8DC' };
    expect(paletteStyle(palette)).toBe('--sp-substrate:#F2E8DC;--sp-ink:#8A3A24;--sp-text:#4A2216;--sp-ui-focus-color:#123456');
  });

  test('REQ-460 · paletteStyle is empty for no palette and for an empty one; values are trimmed', () => {
    expect(paletteStyle(undefined)).toBe('');
    expect(paletteStyle({})).toBe('');
    expect(paletteStyle({ ink: '  var(--brand)  ' })).toBe('--sp-ink:var(--brand)');
  });

  test('REQ-462 · resolvePalette merges field by field, a later layer winning', () => {
    const provider: Palette = { ink: '#111111', text: '#222222', rule: '#333333' };
    const cell: Palette = { text: '#444444' };
    const element: Palette = { rule: '#555555' };
    expect(resolvePalette(provider, cell, element)).toEqual({ ink: '#111111', text: '#444444', rule: '#555555' });
  });

  test('REQ-462 · no layer, or only empty ones, resolves to undefined', () => {
    expect(resolvePalette()).toBeUndefined();
    expect(resolvePalette(undefined, undefined)).toBeUndefined();
    expect(resolvePalette({}, undefined)).toBeUndefined();
  });

  test('REQ-467 · an unknown field is dropped and warned SP024', () => {
    const seen = capture();
    const palette = { ink: '#8A3A24', accent: '#FF0000' } as Palette;
    expect(resolvePalette(palette)).toEqual({ ink: '#8A3A24' });
    expect(seen.map((s) => s.code)).toEqual(['SP024']);
    expect(seen[0]?.message).toMatch(/^\[SP024\] Palette: .*\(`accent`\)\..*\(REQ-467\)$/);
  });

  test.each([';color:red', 'red}body{', '<script>', 'url(evil.svg)', 'URL(x)', '#fff;--sp-ink:red'])(
    'REQ-467 · a value that would break out of its declaration (%s) is dropped, SP024',
    (value) => {
      const seen = capture();
      expect(resolvePalette({ ink: value, text: '#3F4348' })).toEqual({ text: '#3F4348' });
      expect(seen.map((s) => s.code)).toEqual(['SP024']);
    },
  );

  test.each(['\\75 rl(evil.svg)', 'image-set("evil.png" 1x)', '"red"', 'expression(alert(1))', 'color-mix(in srgb, image-set(x) 50%, red)', 'red\\;', 'var(--a, url(x))'])(
    'REQ-467 · a value that is not a CSS colour (%s) is dropped: escapes, quotes and unknown functions, SP024',
    (value) => {
      const seen = capture();
      expect(resolvePalette({ ink: value, text: '#3F4348' })).toEqual({ text: '#3F4348' });
      expect(seen.map((s) => s.code)).toEqual(['SP024']);
    },
  );

  test.each(['#8A3A24', '#8a3a24cc', 'rebeccapurple', 'transparent', 'rgb(10 20 30 / 50%)', 'oklch(0.5 0.1 30)', 'hsl(30deg 50% 40%)', 'var(--brand)', 'color-mix(in srgb, var(--brand) 40%, #fff)'])(
    'REQ-467 · a CSS colour (%s) is kept',
    (value) => {
      expect(resolvePalette({ ink: value })).toEqual({ ink: value });
    },
  );

  test('REQ-467 · paletteStyle itself writes only colours, so calling it directly is safe', () => {
    expect(paletteStyle({ ink: 'image-set("x.png" 1x)', text: '#3F4348', rule: '#fff;color:red' } as Palette)).toBe('--sp-text:#3F4348');
  });

  test('REQ-467 · a non-string or empty value is dropped, SP024', () => {
    const seen = capture();
    expect(resolvePalette({ ink: 42 as unknown as string, rule: '  ', text: '#3F4348' })).toEqual({ text: '#3F4348' });
    expect(seen.map((s) => s.code)).toEqual(['SP024', 'SP024']);
  });

  test('REQ-466 · a hex field below its threshold is kept and warned SP023, once per palette', () => {
    const seen = capture();
    const weak: Palette = { substrate: '#FFFFFF', rule: '#DDDDDD' };
    expect(resolvePalette(weak)).toEqual(weak);
    resolvePalette(weak);
    expect(seen.map((s) => s.code)).toEqual(['SP023']);
    expect(seen[0]?.message).toMatch(/^\[SP023\] Palette: .*\(`rule`\)\..*1\.\d\d:1.*3:1.*\(REQ-466\)$/);
  });

  test('REQ-466 · a passing palette warns nothing', () => {
    const seen = capture();
    resolvePalette(sanguine);
    expect(seen).toEqual([]);
  });
});

describe('palettes — contrast (T-201)', () => {
  test('REQ-465 · contrastRatio follows WCAG 2 on reference pairs, in either order', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777', '#fff')).toBeCloseTo(4.48, 2);
    expect(contrastRatio('#5A5E65', '#EDE7DA')).toBeCloseTo(5.29, 2);
    expect(contrastRatio('#abcdef', '#abcdef')).toBe(1);
  });

  test('REQ-465 · the pairs are the nine of Data Model §3.9', () => {
    expect(PALETTE_PAIRS.map((p) => [p.pair, p.threshold])).toEqual([
      ['ink', 4.5],
      ['ink-secondary', 4.5],
      ['text', 4.5],
      ['text-muted', 4.5],
      ['rule', 3],
      ['grid', 3],
      ['focus', 3],
      ['heighten-outline', 3],
      ['heighten-text', 4.5],
    ]);
  });

  test('REQ-465 · checkPalette returns one finding per failing pair, ratio to 2 decimals', () => {
    const findings = checkPalette({ substrate: '#FFFFFF', ink: '#999999', rule: '#BBBBBB', text: '#000000' });
    // focus is unset, so it is measured as ink; heighten is unset, so its pairs are skipped.
    expect(findings.map((f) => f.pair)).toEqual(['ink', 'rule', 'focus']);
    const ink = findings.find((f) => f.pair === 'ink')!;
    expect(ink).toEqual({ pair: 'ink', foreground: '#999999', background: '#FFFFFF', ratio: 2.85, threshold: 4.5 });
  });

  test('REQ-465 · focus falls back to ink; heighten pairs measure against heighten', () => {
    const findings = checkPalette({ substrate: '#EDE7DA', ink: '#5A5E65', text: '#3F4348', heighten: '#5A5E65' });
    expect(findings.map((f) => f.pair)).toEqual(['heighten-outline', 'heighten-text']);
    expect(findings[0]).toMatchObject({ foreground: '#5A5E65', background: '#5A5E65', ratio: 1 });
  });

  test('REQ-465 · the background is the palette substrate, else the argument, else cream', () => {
    expect(checkPalette({ ink: '#EDE7DA' })[0]).toMatchObject({ background: '#EDE7DA', ratio: 1 });
    expect(checkPalette({ ink: '#123456' }, '#123456')[0]).toMatchObject({ background: '#123456' });
    expect(checkPalette({ substrate: '#FFFFFF', ink: '#FFFFFF' }, '#000000')[0]).toMatchObject({ background: '#FFFFFF' });
  });

  test('REQ-465 · a pair with a non-hex colour is skipped', () => {
    expect(checkPalette({ substrate: '#FFFFFF', ink: 'var(--brand)', rule: 'rgb(0 0 0)' })).toEqual([]);
    expect(checkPalette({ substrate: 'var(--paper)', ink: '#FFFFFF' })).toEqual([]);
  });
});

describe('palettes — presets (T-201)', () => {
  const presets = { silverpoint, sanguine, sepia, ironGall, verdigris, indigo };

  test('REQ-463 · six presets, by name, the same objects as the named exports', () => {
    expect(PALETTE_NAMES).toEqual(['silverpoint', 'sanguine', 'sepia', 'ironGall', 'verdigris', 'indigo']);
    for (const [name, palette] of Object.entries(presets)) expect(PALETTES[name]).toBe(palette);
  });

  test('REQ-463 · presets carry the values of Data Model §2.26', () => {
    expect(sanguine).toEqual({
      substrate: '#F2E8DC',
      ink: '#8A3A24',
      inkSecondary: '#6A4A3A',
      heighten: '#FFFFFF',
      rule: '#9A6450',
      grid: '#9A6450',
      text: '#4A2216',
      textMuted: '#7A3E2C',
    });
    expect(silverpoint.substrate).toBe('#EDE7DA');
    expect(ironGall.ink).toBe('#3C4858');
    expect(verdigris.textMuted).toBe('#3E6A5E');
    expect(indigo.rule).toBe('#68709A');
    expect(sepia.text).toBe('#3B2A18');
  });

  test('I-31 · presets and the record are deep-frozen', () => {
    expect(Object.isFrozen(PALETTES)).toBe(true);
    expect(Object.isFrozen(PALETTE_NAMES)).toBe(true);
    for (const palette of Object.values(presets)) expect(Object.isFrozen(palette)).toBe(true);
  });

  test.each(Object.keys(presets))('REQ-464 · I-31 · %s passes every pair of Data Model §3.9', (name) => {
    expect(checkPalette(PALETTES[name]!)).toEqual([]);
  });
});
