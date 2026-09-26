import { describe, expect, test } from 'vitest';
import { cyanotype, silverpoint } from '../../packages/grounds/src';
import { auditBuiltins, auditGround, contrastRatio, lighten } from './contrast-gate';

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
});
