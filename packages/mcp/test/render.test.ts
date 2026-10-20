/**
 * `validate_props`, `render_chart` and `check_palette` (API delta §3, DD-047, DD-048): the core and
 * the grounds called as the canonical pipeline calls them, with the limits of REQ-560.
 */
import { __setDiagnosticSink, lineChart, sankeyChart } from '@silverpoint/core';
import { checkPalette, sanguine } from '@silverpoint/core/palettes';
import { renderChart as coreRender, toSVGString } from '@silverpoint/grounds';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AGENT_CATALOG, Catalog } from '../src/catalog';
import { ToolError } from '../src/errors';
import { checkPaletteTool } from '../src/tools/palette';
import { renderChart, STANDALONE_STYLE } from '../src/tools/render';
import { validateProps } from '../src/tools/validate';

const catalog = new Catalog(AGENT_CATALOG);

function errorOf(call: () => unknown): ToolError {
  try {
    call();
  } catch (error) {
    if (error instanceof ToolError) return error;
    throw error;
  }
  throw new Error('expected a tool error');
}

/** The rendered SVG without the stylesheet `render_chart` adds to its root. */
const withoutStyle = (svg: string) => svg.replace(/<style>[\s\S]*?<\/style>/, '');

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('validate_props (REQ-542)', () => {
  const codes = (chart: string, props: Record<string, unknown>) => validateProps(catalog, { chart, props }).diagnostics.map((d) => d.code);

  test.each([
    ['SP001', 'line-chart', { data: [] }],
    ['SP002', 'bullet-chart', { data: [{ title: 'Over', actual: 150, target: 50 }] }],
    ['SP004', 'histogram-chart', { data: [{ value: 3 }, { value: 3 }] }],
    ['SP007', 'line-chart', { ground: 'nope' }],
    ['SP008', 'line-chart', { data: Array.from({ length: 501 }, (_, i) => ({ x: i, y: i % 7 })), yKey: 'y' }],
    ['SP009', 'candlestick-chart', { data: [{ time: 'Mon', open: '2', high: '4', low: '1', close: '3' }] }],
    ['SP010', 'chord-ring', { data: Array.from({ length: 13 }, (_, i) => ({ source: `c${i}`, target: `c${(i + 1) % 13}`, value: 13 - i })) }],
    ['SP011', 'treemap-chart', { hatchFill: 'per-shape', width: 1600, height: 1200 }],
    ['SP020', 'sunburst-chart', { data: [{ id: 'a', parent: '', value: 1 }, { id: 'a', parent: '', value: 2 }] }],
    ['SP021', 'histogram-chart', { bins: 0 }],
    ['SP022', 'box-plot-chart', { data: [{ value: 1, group: 'a' }, ...[2, 3, 4, 5, 6].map((value) => ({ value, group: 'b' }))], groupKey: 'group' }],
    ['SP023', 'line-chart', { palette: { substrate: '#FFFFFF', rule: '#DDDDDD' } }],
    ['SP024', 'line-chart', { palette: { accent: '#FF0000' } }],
  ] as const)('REQ-542 · %s is reported from the props of %s', (code, chart, props) => {
    expect(codes(chart, props)).toContain(code);
  });

  test('REQ-542 · each diagnostic carries its code, severity, requirement, message and remedy', () => {
    const result = validateProps(catalog, { chart: 'candlestick-chart', props: { data: [{ time: 'Mon', open: '2', high: '4', low: '1', close: '3' }] } });
    expect(result.valid).toBe(false);
    const error = result.diagnostics.find((d) => d.code === 'SP009')!;
    expect(error).toMatchObject({ severity: 'error', req: 'REQ-097', todo: expect.any(String) });
    expect(error.message).toMatch(/^\[SP009\] CandlestickChart: /);
    const warn = result.diagnostics.find((d) => d.code === 'SP002')!;
    expect(warn).toMatchObject({ severity: 'warn', req: 'REQ-008' });
  });

  test('REQ-542 · the props a chart does not declare are listed; a clean chart is valid', () => {
    const result = validateProps(catalog, { chart: 'line-chart', props: { xKey: 'day', colour: 'red', onSelect: 1 } });
    expect(result.unknownProps).toEqual(['colour', 'onSelect']);
    expect(result.valid).toBe(false);
    expect(validateProps(catalog, { chart: 'line-chart', props: {} })).toEqual({ valid: true, diagnostics: [], unknownProps: [] });
  });

  test('REQ-542 · DD-048 · warnings are captured where the process runs in production, and the sink is restored', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(codes('line-chart', { data: [] })).toEqual(['SP001']);
    expect(process.env.NODE_ENV).toBe('production');
    vi.unstubAllEnvs();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const restore = __setDiagnosticSink(null);
    restore();
    coreRender(lineChart, { id: 'after', width: 320, data: [] }, { id: 'after' });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  test('REQ-542 · Art. 4 · identical input, identical diagnostics: no warning is swallowed as already reported', () => {
    const input = { chart: 'line-chart', props: { data: [] } };
    expect(validateProps(catalog, input)).toEqual(validateProps(catalog, input));
    expect(validateProps(catalog, input).diagnostics).toHaveLength(1);
  });
});

describe('render_chart (REQ-543, DD-047)', () => {
  test('REQ-543 · the canonical pipeline’s own SVG, with a stylesheet on its root and nothing else changed', () => {
    const result = renderChart(catalog, { chart: 'sankey-chart', id: 'flow', width: 320, height: 150 });
    const canonical = toSVGString(coreRender(sankeyChart, { id: 'flow', width: 320, height: 150 }, { id: 'flow' }));
    expect(withoutStyle(result.svg)).toBe(canonical);
    expect(result.svg.startsWith('<svg')).toBe(true);
    expect(result.svg).toContain(`<style>${STANDALONE_STYLE}</style>`);
    expect(result).toMatchObject({ width: 320, diagnostics: [] });
  });

  test('REQ-543 · the stylesheet is the ground’s rules, minified, with a serif fallback for the face', () => {
    expect(STANDALONE_STYLE).toContain('.sp-ground-silverpoint');
    expect(STANDALONE_STYLE).toContain('.sp-ground-cyanotype');
    expect(STANDALONE_STYLE).toContain('Georgia, serif');
    expect(STANDALONE_STYLE).not.toMatch(/\/\*|\n/);
  });

  test('REQ-543 · OQ-E3 · fonts are referenced unless embedFonts asks for the EB Garamond subset', () => {
    expect(renderChart(catalog, { chart: 'line-chart' }).svg).not.toContain('@font-face');
    const embedded = renderChart(catalog, { chart: 'line-chart', embedFonts: true }).svg;
    expect(embedded).toMatch(/@font-face\{font-family:'EB Garamond';[^}]*src:url\(data:font\/woff2;base64,[A-Za-z0-9+/=]{1000,}\)/);
  });

  test('REQ-543 · props, data, ground, substrate, mode and a palette preset reach the core as the canonical render takes them', () => {
    const data = [
      { from: 'A', to: 'B', n: 3 },
      { from: 'B', to: 'C', n: 2 },
    ];
    const result = renderChart(catalog, {
      chart: 'SankeyChart',
      props: { sourceKey: 'from', targetKey: 'to', valueKey: 'n', title: 'Flow' },
      data,
      id: 'p',
      width: 480,
      ground: 'cyanotype',
      substrate: 'prussian',
      mode: 'precision',
      palette: 'sanguine',
    });
    const props = { sourceKey: 'from', targetKey: 'to', valueKey: 'n', title: 'Flow', data, id: 'p', width: 480, ground: 'cyanotype', substrate: 'prussian', mode: 'precision', palette: sanguine } as const;
    expect(withoutStyle(result.svg)).toBe(toSVGString(coreRender(sankeyChart, props as never, { id: 'p' })));
  });

  test('REQ-543 · Art. 4 · the same input renders the same SVG; the default size is 480 wide', () => {
    expect(renderChart(catalog, { chart: 'bar-chart' })).toEqual(renderChart(catalog, { chart: 'bar-chart' }));
    expect(renderChart(catalog, { chart: 'bar-chart' }).width).toBe(480);
  });

  test('REQ-543 · warnings come back as diagnostics; an error diagnostic is a render_failed tool error', () => {
    expect(renderChart(catalog, { chart: 'line-chart', data: [] }).diagnostics.map((d) => d.code)).toEqual(['SP001']);
    const failed = errorOf(() => renderChart(catalog, { chart: 'candlestick-chart', data: [{ time: 'Mon', open: '2', high: '4', low: '1', close: '3' }] }));
    expect(failed.code).toBe('render_failed');
    expect(failed.message).toContain('SP009');
  });

  test('REQ-549 · unknown charts and props name the closest; data and appearance are inputs of their own', () => {
    expect(errorOf(() => renderChart(catalog, { chart: 'sankie' })).suggestions[0]).toBe('sankey-chart');
    expect(errorOf(() => renderChart(catalog, { chart: 'line-chart', props: { xKye: 'a' } })).suggestions[0]).toBe('xKey');
    expect(errorOf(() => renderChart(catalog, { chart: 'line-chart', props: { data: [] } })).code).toBe('invalid_input');
    expect(errorOf(() => renderChart(catalog, { chart: 'line-chart', props: { width: 500 } })).code).toBe('invalid_input');
    expect(errorOf(() => renderChart(catalog, { chart: 'line-chart', palette: 'sanguin' })).suggestions[0]).toBe('sanguine');
  });
});

describe('limits (REQ-560)', () => {
  test.each([
    [{ width: 319 }, 'invalid_input'],
    [{ width: 1601 }, 'invalid_input'],
    [{ height: 119 }, 'invalid_input'],
    [{ height: 1201 }, 'invalid_input'],
    [{ data: Array.from({ length: 5001 }, (_, i) => ({ x: i, value: i })) }, 'limit_exceeded'],
    [{ props: { title: 'x'.repeat(1001) } }, 'limit_exceeded'],
    [{ data: [{ x: 'y'.repeat(1001), value: 1 }] }, 'limit_exceeded'],
    [{ id: 'not a safe id' }, 'invalid_input'],
  ] as const)('REQ-560 · %j is refused with %s before any rendering', (input, code) => {
    expect(errorOf(() => renderChart(catalog, { chart: 'line-chart', ...input })).code).toBe(code);
  });

  test('REQ-560 · validate_props holds the same limits', () => {
    expect(errorOf(() => validateProps(catalog, { chart: 'line-chart', props: { data: Array.from({ length: 5001 }, (_, i) => ({ x: i })) } })).code).toBe('limit_exceeded');
    expect(errorOf(() => validateProps(catalog, { chart: 'line-chart', props: { title: 'x'.repeat(1001) } })).code).toBe('limit_exceeded');
    expect(errorOf(() => validateProps(catalog, { chart: 'line-chart', props: {}, width: 2000 })).code).toBe('invalid_input');
  });

  test('REQ-560 · a render past the path budget is refused, its size named', () => {
    const error = errorOf(() => renderChart(catalog, { chart: 'treemap-chart', props: { hatchFill: 'per-shape' }, width: 1600, height: 1200 }));
    expect(error.code).toBe('limit_exceeded');
    expect(error.message).toMatch(/\d+ bytes of path data.*40000/);
  });
});

describe('check_palette (REQ-545)', () => {
  test('REQ-545 · the core’s checkPalette findings, for a preset or a palette of fields', () => {
    expect(checkPaletteTool(catalog, { palette: 'sanguine' }).findings).toEqual(checkPalette(sanguine));
    const weak = { substrate: '#FFFFFF', rule: '#DDDDDD' };
    const findings = checkPaletteTool(catalog, { palette: weak }).findings;
    expect(findings).toEqual(checkPalette(weak));
    expect(findings.map((f) => f.pair)).toContain('rule');
  });

  test('REQ-545 · the substrate is a hex or a ground’s substrate name', () => {
    const palette = { ink: '#777777' };
    expect(checkPaletteTool(catalog, { palette, substrate: '#FFFFFF' }).findings).toEqual(checkPalette(palette, '#FFFFFF'));
    expect(checkPaletteTool(catalog, { palette, substrate: 'prussian' }).findings).toEqual(checkPalette(palette, checkPaletteTool(catalog, { palette: {}, substrate: 'prussian' }).substrate));
    expect(checkPaletteTool(catalog, { palette, substrate: 'green' }).substrate).toMatch(/^#[0-9A-F]{6}$/i);
  });

  test('REQ-549 · an unknown preset, field or substrate names the closest', () => {
    expect(errorOf(() => checkPaletteTool(catalog, { palette: 'sepiaa' })).suggestions[0]).toBe('sepia');
    expect(errorOf(() => checkPaletteTool(catalog, { palette: { inkk: '#000000' } })).suggestions[0]).toBe('ink');
    expect(errorOf(() => checkPaletteTool(catalog, { palette: {}, substrate: 'gren' })).suggestions[0]).toBe('green');
  });
});
