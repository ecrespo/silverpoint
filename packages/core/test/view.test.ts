import { describe, expect, test } from 'vitest';
import { lineChart, svgString, toSvgView, type ChartModel, type Geometry } from '../src';

const context = {
  id: 'sp-line-chart-view',
  width: 320,
  locale: 'en',
  emptyState: { text: 'No data', rule: true },
  domainPadding: 0.1,
};
const style = { ground: 'silverpoint', substrate: 'cream', mode: 'ink' } as const;

function withGeometry(model: ChartModel, patch: Partial<Geometry>): ChartModel {
  return { ...model, geometry: { ...model.geometry, ...patch } };
}

const model = lineChart.build({ title: 'Throughput & "hatching" <1>', unit: 'requests' }, context);

describe('SVG view model', () => {
  test('REQ-120 · the root is an image named by its title and description', () => {
    const view = toSvgView(model, style);
    expect(view.svg).toMatchObject({
      role: 'img',
      labelledby: 'sp-line-chart-view-title sp-line-chart-view-desc',
      viewBox: `0 0 ${model.geometry.viewBox.width} ${model.geometry.viewBox.height}`,
    });
    expect(view.title).toEqual({ id: 'sp-line-chart-view-title', text: model.name });
    expect(view.desc).toEqual({ id: 'sp-line-chart-view-desc', text: model.description });
  });

  test('REQ-041 · the root carries the ground class and the substrate the stylesheet keys on', () => {
    expect(toSvgView(model, style).svg).toMatchObject({
      class: 'sp-chart sp-ground-silverpoint',
      substrate: 'cream',
      mode: 'ink',
    });
  });

  test('REQ-042 · every stroke becomes a path painted by part, never by a literal colour', () => {
    const view = toSvgView(model, style);
    expect(view.paths).toHaveLength(model.geometry.strokes.length);
    view.paths.forEach((path, index) => {
      const stroke = model.geometry.strokes[index];
      expect(path).toMatchObject({ d: stroke?.d, part: `sp-${stroke?.part}`, role: stroke?.role });
      expect(path.paint).toBe(stroke?.paint ?? 'stroke');
    });
    expect(JSON.stringify(view).replace(/url\(#[^)]*\)/g, '')).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(/i);
  });

  test('REQ-029 · a tile-painted stroke fills with its pattern, and each tile becomes a pattern', () => {
    const tiled = withGeometry(model, {
      strokes: [{ d: 'M0,0H10V10Z', role: 'hatch', part: 'ink', paint: 'tile', tile: 'sp-x-tone-2' }],
      defs: [{ id: 'sp-x-tone-2', width: 45, height: 45, angle: -41, strokes: [{ d: 'M0 3.75L45 3.75', role: 'hatch', part: 'ink' }] }],
    });
    const view = toSvgView(tiled, style);
    expect(view.paths[0]?.fill).toBe('url(#sp-x-tone-2)');
    expect(view.patterns).toEqual([
      {
        id: 'sp-x-tone-2',
        width: '45',
        height: '45',
        transform: 'rotate(-41)',
        paths: [{ d: 'M0 3.75L45 3.75', part: 'sp-ink', role: 'hatch', paint: 'stroke', dash: null, weight: null, fill: null }],
      },
    ]);
  });

  test('REQ-060 · the dotted baseline series keeps its dash as data for the stylesheet', () => {
    const view = toSvgView(model, style);
    expect(view.paths.some((path) => path.part === 'sp-ink-secondary' && path.dash === 'dotted')).toBe(true);
  });

  test('REQ-028 · a weighted stroke keeps its tonal weight as data for the stylesheet', () => {
    const weighted = withGeometry(model, {
      strokes: [
        { d: 'M0,0H10V10Z', role: 'encoding', part: 'ink', paint: 'stroke', weight: 3 },
        { d: 'M0,20H10', role: 'encoding', part: 'ink' },
      ],
    });
    const view = toSvgView(weighted, style);
    expect(view.paths.map((path) => path.weight)).toEqual(['3', null]);
  });

  test('REQ-094 · labels keep their kind, anchor and paint slot', () => {
    const view = toSvgView(model, style);
    expect(view.texts).toContainEqual(
      expect.objectContaining({ text: model.name, kind: 'title', part: 'sp-text', anchor: 'start' }),
    );
    expect(view.texts.every((t) => typeof t.x === 'string' && typeof t.y === 'string')).toBe(true);
  });
});

describe('canonical SVG string', () => {
  test('REQ-005 · the same model serialises to the same string', () => {
    expect(svgString(toSvgView(model, style))).toBe(svgString(toSvgView(model, style)));
  });

  test('Security · user text enters as escaped text, never as markup', () => {
    const svg = svgString(toSvgView(model, style));
    expect(svg).toContain('Throughput &amp; &quot;hatching&quot; &lt;1&gt;');
    expect(svg).not.toContain('<1>');
  });

  test('REQ-042 · the string carries parts and data attributes, and no colour attribute', () => {
    const svg = svgString(toSvgView(model, style));
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toMatch(/<path d="[^"]+" part="sp-ink" data-role="encoding" data-paint="stroke"/);
    expect(svg).not.toMatch(/\s(stroke|color)="/);
    expect(svg).not.toMatch(/\sfill="(?!url\()/);
  });

  test('REQ-028 · a weighted path writes data-weight after data-dash; an unweighted one omits it', () => {
    const weighted = withGeometry(model, {
      strokes: [
        { d: 'M0,0H10V10Z', role: 'encoding', part: 'ink', paint: 'stroke', dash: 'dotted', weight: 2 },
        { d: 'M0,20H10', role: 'encoding', part: 'ink' },
      ],
    });
    const svg = svgString(toSvgView(weighted, style));
    expect(svg).toContain('<path d="M0,0H10V10Z" part="sp-ink" data-role="encoding" data-paint="stroke" data-dash="dotted" data-weight="2"></path>');
    expect(svg).toContain('<path d="M0,20H10" part="sp-ink" data-role="encoding" data-paint="stroke"></path>');
    expect(svgString(toSvgView(model, style))).not.toContain('data-weight');
  });

  test('REQ-120 · title and desc are the first children, as assistive technology expects', () => {
    const svg = svgString(toSvgView(model, style));
    expect(svg).toMatch(/^<svg[^>]*><title id="sp-line-chart-view-title">[^<]*<\/title><desc id="sp-line-chart-view-desc">/);
  });

  test('REQ-009 · a deferred model serialises with no NaN anywhere', () => {
    const deferred = lineChart.build({}, { ...context, width: 0 });
    expect(svgString(toSvgView(deferred, style))).not.toMatch(/NaN|undefined/);
  });
});
