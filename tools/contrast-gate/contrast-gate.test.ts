import { describe, expect, test } from 'vitest';
import { cyanotype, silverpoint } from '../../packages/grounds/src';
import { auditBuiltins, auditGround, auditUi, contrastRatio, lighten, UI_CONTRAST_PAIRS } from './contrast-gate';

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
    expect([...new Set(auditBuiltins().map((row) => row.ground))]).toEqual(['silverpoint', 'cyanotype']);
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
});
