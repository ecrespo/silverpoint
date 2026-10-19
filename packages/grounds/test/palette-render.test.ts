import { lineChart } from '@silverpoint/core';
import { paletteStyle, sanguine } from '@silverpoint/core/palettes';
import { describe, expect, test } from 'vitest';
import { renderChart, toSVGString } from '../src';

/*
 * The chart path of a palette (T-212, REQ-461, REQ-462, REQ-468): the render pipeline resolves the
 * provider's palette under the chart's own and hands the declarations to every adapter as
 * `rendered.style`; `toSVGString` writes them on its `<svg>`.
 */

const env = { id: 'sp-line-chart-p', width: 320 };

describe('palettes — the chart pipeline (T-212)', () => {
  test('REQ-461 · REQ-462 · rendered.style is the provider\'s palette under the chart\'s own, field by field', () => {
    const rendered = renderChart(lineChart, { palette: { ink: '#303030' } }, { ...env, provider: { palette: { ink: '#111111', text: '#222222' } } });
    expect(rendered.style).toBe('--sp-ink:#303030;--sp-text:#222222');
    expect(renderChart(lineChart, {}, env).style).toBe('');
  });

  test('REQ-461 · toSVGString writes the palette on the <svg> root', () => {
    const svg = toSVGString(renderChart(lineChart, { palette: sanguine }, env));
    expect(svg).toMatch(new RegExp(`^<svg [^>]*style="${paletteStyle(sanguine)}"`));
  });

  test('REQ-468 · I-25 · a palette changes only the root\'s style: the drawing is byte for byte the same', () => {
    const plain = toSVGString(renderChart(lineChart, {}, env));
    const toned = toSVGString(renderChart(lineChart, { palette: sanguine }, env));
    expect(toned.replace(/ style="[^"]*"/, '')).toBe(plain);
    expect(renderChart(lineChart, { palette: sanguine }, env).geometry).toEqual(renderChart(lineChart, {}, env).geometry);
  });

  test('REQ-468 · forced precision changes the mode, never the colours', () => {
    const rendered = renderChart(lineChart, { palette: sanguine }, { ...env, forcedPrecision: true });
    expect(rendered.mode).toBe('precision');
    expect(rendered.style).toBe(paletteStyle(sanguine));
  });
});
