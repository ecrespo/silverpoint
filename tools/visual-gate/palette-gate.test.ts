import { describe, expect, test } from 'vitest';
import { comparePaletteChart } from './palette-gate';

/*
 * The chart side of the palette gate (T-218, I-33): an adapter writes the palette on its `.sp-root`
 * frame and the core's `toSVGString` on the `<svg>`. The trees must agree once the `style` is moved,
 * and the declarations must be the same.
 */

const svg = (style?: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"${style ? ` style="${style}"` : ''}><path d="M0,0L10,10"></path></svg>`;
const frame = (style: string, inner = svg()) => `<div class="sp-root" style="${style}">${inner}</div>`;

describe('comparePaletteChart (T-218)', () => {
  test('REQ-468 · the frame\'s style is the canonical <svg>\'s, and the trees agree without it', () => {
    expect(comparePaletteChart(frame('--sp-ink:#123456'), svg('--sp-ink:#123456'))).toEqual({ equal: true });
  });

  test('REQ-468 · declarations are compared as declarations: spacing and order are serialisation', () => {
    expect(comparePaletteChart(frame('--sp-text: #000; --sp-ink: #123456'), svg('--sp-ink:#123456;--sp-text:#000'))).toEqual({ equal: true });
  });

  test('REQ-468 · another palette on the frame is a difference', () => {
    const result = comparePaletteChart(frame('--sp-ink:#654321'), svg('--sp-ink:#123456'));
    expect(result.equal).toBe(false);
    expect(result.difference).toMatch(/style/);
  });

  test('REQ-468 · no palette on the frame is a difference', () => {
    expect(comparePaletteChart(`<div class="sp-root">${svg()}</div>`, svg('--sp-ink:#123456')).equal).toBe(false);
  });

  test('REQ-516 · a drawing that moved is a difference, whatever the style', () => {
    const moved = svg().replace('M0,0L10,10', 'M0,0L10,9');
    expect(comparePaletteChart(frame('--sp-ink:#123456', moved), svg('--sp-ink:#123456')).equal).toBe(false);
  });
});
