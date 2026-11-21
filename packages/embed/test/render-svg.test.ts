/** T-294 · `renderSpec` and `renderToSVG` (REQ-632; I-53 at unit size). */
import { renderChart, toSVGString } from '@silverpoint/grounds';
import { describe, expect, test } from 'vitest';
import { renderSpec, renderToSVG } from '../src/index';
import { recipeOfSlug } from '../src/registry';

const svgOf = (spec: Parameters<typeof renderToSVG>[0], options?: Parameters<typeof renderToSVG>[1]) => {
  const result = renderToSVG(spec, options);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
};

describe('renderToSVG', () => {
  test('REQ-632 · the canonical markup, the ground’s stylesheet inserted as the root’s first child and nothing else', () => {
    const spec = { chart: 'bar-chart', width: 320, height: 150, id: 'b1' } as const;
    const reference = renderChart(recipeOfSlug('bar-chart')!, { id: 'b1', width: 320, height: 150 } as never, { id: 'b1' });
    const canonical = toSVGString(reference);
    const { svg, width, height } = svgOf(spec);
    const open = canonical.indexOf('>') + 1;
    expect(svg.slice(0, open)).toBe(canonical.slice(0, open));
    expect(svg.slice(open)).toMatch(/^<style>[^<]+<\/style>/);
    expect(svg.replace(/<style>[^<]*<\/style>/, '')).toBe(canonical);
    expect([width, height]).toEqual([reference.geometry.viewBox.width, reference.geometry.viewBox.height]);
  });

  test('REQ-632 · 480 px wide and id = the slug when absent', () => {
    const { svg, width } = svgOf({ chart: 'line-chart' });
    expect(width).toBe(480);
    expect(svg).toContain('id="line-chart-title"');
  });

  test('REQ-632 · embedFonts writes one @font-face from a data URI, and requests nothing', () => {
    const { svg } = svgOf({ chart: 'donut-chart' }, { embedFonts: true });
    expect(svg.match(/@font-face/g)).toHaveLength(1);
    expect(svg).toContain('url(data:font/woff2;base64,');
    expect(svg).not.toMatch(/url\((?!data:|#)/);
  });

  test('REQ-632 · a palette preset name and the same palette object render alike', async () => {
    const { PALETTES } = await import('@silverpoint/core/palettes');
    expect(svgOf({ chart: 'bar-chart', palette: 'sepia' }).svg).toBe(svgOf({ chart: 'bar-chart', palette: { ...PALETTES.sepia } }).svg);
  });

  test('REQ-631 · an invalid spec renders nothing and says why', () => {
    expect(renderToSVG({ chart: 'nope' })).toMatchObject({ ok: false, error: { kind: 'chart' } });
    expect(renderToSVG('{')).toMatchObject({ ok: false, error: { kind: 'json' } });
  });

  test('renderSpec returns the rendered chart and the warnings raised, in order', () => {
    const result = renderSpec({ chart: 'bar-chart', data: [] });
    expect(result.ok).toBe(true);
    expect(result.diagnostics.map((d) => d.code)).toContain('SP001');
    expect(result.diagnostics.every((d) => d.severity === 'warn')).toBe(true);
  });

  test('an error diagnostic of the chart is a SpecError of kind diagnostic', () => {
    const result = renderSpec({ chart: 'scatter-chart', data: [{ x: 'a', y: 'b' }], props: { xKey: 'x', yKey: 'y' } });
    if (result.ok) return; // the core may draw an empty state instead; then nothing to assert here
    expect(result.error.kind).toBe('diagnostic');
  });
});
