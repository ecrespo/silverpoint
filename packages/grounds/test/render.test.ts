import {
  __setDiagnosticSink,
  lineChart,
  SilverpointError,
  svgString,
  type ChartModel,
  type ChartRecipe,
  type CommonChartProps,
  type Stroke,
  type SpCode,
} from '@silverpoint/core';
import { afterEach, describe, expect, test } from 'vitest';
import { registerGround, renderChart, silverpoint, toSVGString } from '../src';

let restore: () => void = () => {};
afterEach(() => restore());

function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

const env = { id: 'sp-line-chart-r', width: 320 };

/** A recipe that returns fixed strokes, to exercise the pipeline on its own. */
function fixed(strokes: Stroke[]): ChartRecipe<CommonChartProps> {
  return {
    name: 'FixedChart',
    build(_props, context): ChartModel {
      const box = { x: 0, y: 0, width: 100, height: 100 };
      return {
        chart: 'FixedChart',
        id: context.id,
        status: 'ready',
        geometry: { viewBox: box, plot: box, strokes, labels: [], hitAreas: [], defs: [] },
        chrome: 'card',
        name: 'Fixed',
        description: 'Fixed',
        ids: { title: `${context.id}-title`, desc: `${context.id}-desc`, table: `${context.id}-table` },
        table: { caption: 'Fixed', columns: [], rows: [] },
        dataTable: 'hidden',
      };
    },
  };
}

const encodingVertices = (strokes: readonly Stroke[]) =>
  strokes.filter((stroke) => stroke.role === 'encoding').map((stroke) => stroke.d);

describe('renderChart', () => {
  test('REQ-021 · precision mode is exactly the NullInker: ornaments untouched, no hatching', () => {
    const rendered = renderChart(lineChart, { title: 'P', mode: 'precision' }, env);
    const exact = lineChart.build({ title: 'P' }, { ...env, locale: 'en', emptyState: silverpoint.emptyState, domainPadding: 0.1 });
    expect(rendered.mode).toBe('precision');
    expect(rendered.geometry.strokes).toEqual(exact.geometry.strokes);
    expect(rendered.geometry.defs).toEqual([]);
  });

  test('REQ-020 · ink mode inks the ornaments through the ground\'s inker', () => {
    const inked = renderChart(lineChart, { title: 'I' }, env);
    const precise = renderChart(lineChart, { title: 'I', mode: 'precision' }, env);
    expect(inked.mode).toBe('ink');
    const ornaments = (r: typeof inked) => r.geometry.strokes.filter((s) => s.role === 'ornament').map((s) => s.d);
    expect(ornaments(inked)).not.toEqual(ornaments(precise));
  });

  test('REQ-006 · encoding vertices are identical in ink and precision modes', () => {
    const inked = renderChart(lineChart, {}, env);
    const precise = renderChart(lineChart, { mode: 'precision' }, env);
    expect(encodingVertices(inked.geometry.strokes)).toEqual(encodingVertices(precise.geometry.strokes));
  });

  test('REQ-123 · a forced-precision environment wins over mode="ink"', () => {
    expect(renderChart(lineChart, { mode: 'ink' }, { ...env, forcedPrecision: true }).mode).toBe('precision');
  });

  test('REQ-026 · a ground whose inker is not registered falls back to NullInker and warns', () => {
    const seen = capture();
    registerGround({ ...silverpoint, name: 'orphan', inker: 'etching' });
    const rendered = renderChart(lineChart, { ground: 'orphan' }, env);
    const precise = renderChart(lineChart, { mode: 'precision' }, env);
    expect(seen).toContain('SP006');
    expect(rendered.geometry.strokes).toEqual(precise.geometry.strokes);
  });

  test('REQ-045 · an unknown ground renders as silverpoint and warns', () => {
    const seen = capture();
    const rendered = renderChart(lineChart, { ground: 'nowhere' }, env);
    expect(rendered.ground).toBe('silverpoint');
    expect(seen).toContain('SP007');
  });

  test('REQ-003 · the seed is derived from the id; an explicit seed overrides it', () => {
    const ornament = (seed?: number, id = env.id) =>
      renderChart(lineChart, seed === undefined ? {} : { seed }, { ...env, id }).geometry.strokes.find((s) => s.role === 'ornament')?.d;
    expect(ornament()).toBe(ornament());
    expect(ornament(undefined, 'sp-line-chart-other')).not.toBe(ornament());
    expect(ornament(99)).not.toBe(ornament());
  });

  test('REQ-031 · the heightened point carries an outline in the main ink after inking', () => {
    const strokes = renderChart(lineChart, {}, env).geometry.strokes;
    const heighten = strokes.filter((s) => s.part === 'heighten');
    expect(heighten).toHaveLength(1);
    expect(strokes.some((s) => s.part === 'ink' && s.d === heighten[0]?.d && (s.paint ?? 'stroke') === 'stroke')).toBe(true);
  });

  test('REQ-025 · two heightened elements throw in development', () => {
    const dot = (x: number): Stroke => ({ d: `M${x},5A1,1,0,1,0,${x + 2},5Z`, role: 'encoding', part: 'heighten', paint: 'fill' });
    expect(() => renderChart(fixed([dot(1), dot(10)]), {}, env)).toThrow(SilverpointError);
  });

  test('NFR §7 · a chart over the 40 KB path budget emits SP011', () => {
    const seen = capture();
    const heavy: Stroke = { d: `M0,0${'L1,1'.repeat(11_000)}`, role: 'encoding', part: 'ink' };
    renderChart(fixed([heavy]), { mode: 'precision' }, env);
    expect(seen).toContain('SP011');
  });

  test('REQ-002 · no coordinate of the rendered geometry carries more than 2 decimals', () => {
    const rendered = renderChart(lineChart, {}, env);
    expect(JSON.stringify(rendered.geometry)).not.toMatch(/\d\.\d{3}/);
  });

  test('REQ-009 · a zero-width container defers the render without inking or NaN', () => {
    const rendered = renderChart(lineChart, {}, { ...env, width: 0 });
    expect(rendered.status).toBe('deferred');
    expect(toSVGString(rendered)).not.toMatch(/NaN/);
  });

  test('REQ-041 · the view carries the resolved ground, substrate and mode', () => {
    const rendered = renderChart(lineChart, { substrate: 'ochre' }, { ...env, provider: { mode: 'precision' } });
    expect(rendered.view.svg).toMatchObject({ class: 'sp-chart sp-ground-silverpoint', substrate: 'ochre', mode: 'precision' });
    expect(toSVGString(rendered)).toBe(svgString(rendered.view));
  });

  test('REQ-005 · the same render requested twice yields the same SVG string', () => {
    expect(toSVGString(renderChart(lineChart, { title: 'Twice' }, env))).toBe(
      toSVGString(renderChart(lineChart, { title: 'Twice' }, env)),
    );
  });

  test('REQ-094 · an explicit id prop wins over the adapter-supplied id', () => {
    expect(renderChart(lineChart, { id: 'mine' }, env).id).toBe('mine');
  });
});

/**
 * T-090 (Phase 0 minor): a consumer `id` becomes the stem of IDREFs (`aria-labelledby`, space-
 * separated) and of `url(#…)` fills, so whitespace or URL punctuation in it breaks both silently.
 */
describe('consumer id', () => {
  const ids = (svg: string) => [...svg.matchAll(/\bid="([^"]*)"/g)].map((m) => m[1] as string);

  test('REQ-008 · REQ-120 · an id that would break IDREFs and url(#…) is made safe, and warned', () => {
    const seen = capture();
    const rendered = renderChart(lineChart, { id: 'sales (2024) #1' }, env);
    expect(rendered.id).toMatch(/^[A-Za-z0-9_.:-]+$/);
    for (const id of ids(toSVGString(rendered))) expect(id).toMatch(/^[A-Za-z0-9_.:-]+$/);
    expect(seen).toContain('SP002');
  });

  test('REQ-120 · a safe id is kept as given, silently', () => {
    const seen = capture();
    expect(renderChart(lineChart, { id: 'sales-2024_q1' }, env).id).toBe('sales-2024_q1');
    expect(seen).not.toContain('SP002');
  });
});
