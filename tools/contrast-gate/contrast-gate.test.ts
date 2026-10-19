import { describe, expect, test } from 'vitest';
import { cyanotype, silverpoint } from '../../packages/grounds/src';
import { checkPalette, PALETTE_PAIRS, PALETTES, type Palette } from '../../packages/core/src/palettes';
import { auditBuiltins, auditGround, auditPalette, auditPalettes, auditUi, contrastRatio, lighten, UI_CONTRAST_PAIRS } from './contrast-gate';

function minimum(rows: ReturnType<typeof auditGround>, token: string): number | undefined {
  return rows.find((row) => row.token === token)?.min;
}

describe('contrast gate', () => {
  test('REQ-126 · WCAG ratio of black on white is 21 and is symmetric', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
  });

  test('REQ-126 · reproduces the worst-case column of Data Model §3.2', () => {
    const rows = auditGround(silverpoint);
    expect(minimum(rows, 'text')).toBe(6.94);
    expect(minimum(rows, 'primary')).toBe(4.54);
    expect(minimum(rows, 'secondary')).toBe(4.53);
    expect(minimum(rows, 'rule')).toBe(3.03);
    expect(minimum(rows, 'grid')).toBe(3.03);
  });

  test('REQ-126 · the worst case always falls on the blue substrate', () => {
    const rows = auditGround(silverpoint).filter((row) => row.token !== 'heighten');
    expect(new Set(rows.map((row) => row.worst))).toEqual(new Set(['blue']));
  });

  test('REQ-031 · heightening is exempt by its ink outline, which reaches 6.51:1 against it', () => {
    const heighten = auditGround(silverpoint).find((row) => row.token === 'heighten');
    expect(heighten).toMatchObject({ min: 6.51, threshold: 3, pass: true, against: 'ink outline' });
  });

  test('REQ-126 · every ink of the silverpoint ground passes', () => {
    expect(auditGround(silverpoint).filter((row) => !row.pass)).toEqual([]);
  });

  test('REQ-126 · every ink of the cyanotype ground passes, with the ratios of Data Model §3.7', () => {
    const rows = auditGround(cyanotype);
    expect(rows.filter((row) => !row.pass)).toEqual([]);
    expect(Object.fromEntries(rows.map((row) => [row.token, row.min]))).toEqual({
      text: 9.84, textMuted: 6.41, primary: 8.77, secondary: 6.68, rule: 4.32, grid: 4.32, heighten: 13.11,
    });
  });

  test('REQ-127 · the gate audits every built-in ground', () => {
    const grounds = auditBuiltins().filter((row) => !row.ground.startsWith('palette.'));
    expect([...new Set(grounds.map((row) => row.ground))]).toEqual(['silverpoint', 'cyanotype']);
  });

  test('REQ-127 · darkening cyanotype\'s rule toward its substrate fails the gate', () => {
    const altered = { ...cyanotype, ink: { ...cyanotype.ink, rule: '#4A6B90' } };
    expect(auditGround(altered).filter((row) => !row.pass).map((row) => row.token)).toEqual(['rule']);
  });

  test('REQ-127 · lightening ink by 5% fails the gate', () => {
    const altered = { ...silverpoint, ink: { ...silverpoint.ink, primary: lighten(silverpoint.ink.primary, 0.05) } };
    const failing = auditGround(altered).filter((row) => !row.pass).map((row) => row.token);
    expect(failing).toContain('primary');
  });

  test('REQ-127 · lighten mixes toward white in sRGB', () => {
    expect(lighten('#000000', 0.5)).toBe('#808080');
    expect(lighten('#5A5E65', 0)).toBe('#5A5E65');
  });

  test('REQ-313 · the UI pairs are the normative list of Data Model §3.8, each with its WCAG threshold', () => {
    expect(UI_CONTRAST_PAIRS.map((p) => [p.name, p.threshold])).toEqual([
      ['ui.text', 4.5],
      ['ui.frame', 3],
      ['ui.mark', 3],
      ['ui.focus', 3],
      ['ui.precision-frame', 3],
      ['ui.tone', 3],
      ['ui.tone-text', 4.5],
      ['ui.alert-error-text', 4.5],
      ['ui.heighten-outline', 3],
      ['ui.heighten-text', 4.5],
      ['ui.disabled-text', 3],
      // feature-004 (Data Model delta §3.8, REQ-522).
      ['ui.row-tone-text', 4.5],
      ['ui.overlay-text', 4.5],
      ['ui.option-active', 4.5],
      ['ui.option-outline', 3],
      ['ui.crumb-separator', 3],
    ]);
  });

  test('REQ-313 · every UI pair of both built-in grounds passes, on every substrate', () => {
    for (const ground of [silverpoint, cyanotype]) {
      const rows = auditUi(ground);
      expect(rows).toHaveLength(UI_CONTRAST_PAIRS.length);
      expect(rows.filter((row) => !row.pass)).toEqual([]);
    }
  });

  test('REQ-313 · a hatch ground\'s tone is its secondary ink, a weight ground\'s its primary line', () => {
    expect(auditUi(silverpoint).find((r) => r.token === 'ui.tone')?.min).toBe(auditGround(silverpoint).find((r) => r.token === 'secondary')?.min);
    expect(auditUi(cyanotype).find((r) => r.token === 'ui.tone')?.min).toBe(auditGround(cyanotype).find((r) => r.token === 'primary')?.min);
  });

  test('REQ-313 · lightening the secondary ink until the tone falls under 3:1 fails the UI gate', () => {
    const altered = { ...silverpoint, ink: { ...silverpoint.ink, secondary: lighten(silverpoint.ink.secondary, 0.35) } };
    expect(auditUi(altered).filter((row) => !row.pass).map((row) => row.token)).toEqual(['ui.tone']);
  });

  test('REQ-313 · a heightening too close to the text fails: text on the heightened plate must read', () => {
    const altered = { ...cyanotype, ink: { ...cyanotype.ink, heighten: '#8AA8C7' } };
    expect(auditUi(altered).filter((row) => !row.pass).map((row) => row.token)).toContain('ui.heighten-text');
  });

  test('REQ-127 · the built-in audit includes the UI rows', () => {
    expect(auditBuiltins().some((row) => row.token === 'ui.focus' && row.ground === 'cyanotype')).toBe(true);
  });

  test('REQ-522 · the feature-004 pairs measure what Data Model §3.8 names: text and rules on the substrate, the active option on the heightening', () => {
    const rows = Object.fromEntries(auditUi(silverpoint).map((r) => [r.token, r]));
    const ground = Object.fromEntries(auditGround(silverpoint).map((r) => [r.token, r]));
    expect(rows['ui.row-tone-text']).toMatchObject({ min: ground.text!.min, against: 'substrate' });
    expect(rows['ui.overlay-text']).toMatchObject({ min: ground.text!.min, against: 'substrate' });
    expect(rows['ui.crumb-separator']).toMatchObject({ min: ground.rule!.min, against: 'substrate' });
    expect(rows['ui.option-active']).toMatchObject({ min: rows['ui.heighten-text']!.min, against: 'heightening' });
    expect(rows['ui.option-outline']).toMatchObject({ min: rows['ui.heighten-outline']!.min, against: 'heightening' });
  });

  test('REQ-522 · a rule too light for the crumb separator fails the UI gate', () => {
    const altered = { ...silverpoint, ink: { ...silverpoint.ink, rule: lighten(silverpoint.ink.rule, 0.2) } };
    expect(auditUi(altered).filter((row) => !row.pass).map((row) => row.token)).toEqual(['ui.precision-frame', 'ui.crumb-separator']);
  });
});

describe('contrast gate over the palette presets (T-209, REQ-464)', () => {
  test('REQ-464 · every preset is measured on every pair of Data Model §3.9, against its own substrate, and passes', () => {
    const rows = auditPalettes();
    expect(rows).toHaveLength(Object.keys(PALETTES).length * PALETTE_PAIRS.length);
    expect([...new Set(rows.map((r) => r.ground))]).toEqual(['palette.silverpoint', 'palette.sanguine', 'palette.sepia', 'palette.ironGall', 'palette.verdigris', 'palette.indigo']);
    expect(rows.filter((r) => r.ground === 'palette.indigo').map((r) => [r.token, r.threshold])).toEqual(PALETTE_PAIRS.map((p) => [`palette.${p.pair}`, p.threshold]));
    expect(rows.filter((row) => !row.pass)).toEqual([]);
  });

  test('REQ-464 · the gate measures by itself, and agrees with checkPalette (REQ-465)', () => {
    const sanguine = Object.fromEntries(auditPalette('sanguine', PALETTES.sanguine!).map((r) => [r.token, r]));
    expect(sanguine['palette.ink']!.min).toBe(Math.round(contrastRatio('#8A3A24', '#F2E8DC') * 100) / 100);
    expect(sanguine['palette.heighten-outline']).toMatchObject({ worst: 'heighten', against: 'heightening', min: Math.round(contrastRatio('#8A3A24', '#FFFFFF') * 100) / 100 });
    expect(sanguine['palette.focus']!.min).toBe(sanguine['palette.ink']!.min);
    for (const [name, preset] of Object.entries(PALETTES)) {
      const altered: Palette = { ...preset, textMuted: lighten(preset.textMuted!, 0.4), rule: lighten(preset.rule!, 0.4) };
      const failing = auditPalette(name, altered).filter((r) => !r.pass).map((r) => r.token.replace('palette.', ''));
      expect(failing, name).toEqual(checkPalette(altered).map((f) => f.pair));
      expect(failing, name).toEqual(expect.arrayContaining(['text-muted', 'rule']));
    }
  });

  test('REQ-464 · a failing preset fails the built-in audit, which CI runs', () => {
    expect(auditBuiltins().filter((r) => r.ground.startsWith('palette.'))).toHaveLength(Object.keys(PALETTES).length * PALETTE_PAIRS.length);
    const ink = lighten(PALETTES.verdigris!.ink!, 0.45);
    expect(auditPalette('verdigris', { ...PALETTES.verdigris, ink }).filter((r) => !r.pass).map((r) => r.token)).toEqual(
      expect.arrayContaining(['palette.ink', 'palette.focus']),
    );
  });
});
