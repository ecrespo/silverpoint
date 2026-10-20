import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, dashboardView, inCell, lineChart, svgString, type DashboardCellContext, type LineChartProps, type SpCode, type SvgView } from '../src';
import { nestProvider, paletteStyle, sanguine, type Palette } from '../src/palettes';
import { resolveUi, uiButtonView, uiSliderView } from '../src/ui';

/*
 * Palettes through the layers every adapter shares (T-212, REQ-461, REQ-462, REQ-468, DD-037): the
 * core resolves element → dashboard → provider field by field, and writes the result first in the
 * root's `style`. Adapters only pass the layers in and write the attribute.
 */

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

const PROVIDER: Palette = { ink: '#111111', rule: '#555555', text: '#222222' };
const CELL: Palette = { ink: '#202020', grid: '#606060' };
const OWN: Palette = { ink: '#303030' };

describe('palettes — UI components (T-212)', () => {
  test('REQ-462 · a component resolves provider → cell → prop, field by field, in the fixed order', () => {
    const r = resolveUi({ palette: OWN }, { provider: { palette: PROVIDER }, cell: { palette: CELL } });
    expect(r.palette).toBe('--sp-ink:#303030;--sp-rule:#555555;--sp-grid:#606060;--sp-text:#222222');
  });

  test('REQ-461 · the palette is the first declaration of the root style; the component\'s own follows', () => {
    const r = resolveUi({ palette: sanguine }, {});
    const slider = uiSliderView({ label: 'Level' }, r, { value: 40 });
    expect(slider.attrs.style).toBe(`${paletteStyle(sanguine)};--sp-ui-fraction: 0.4`);
    expect(uiButtonView({}, r, { text: 'Go' }).attrs.style).toBe(paletteStyle(sanguine));
  });

  test('REQ-468 · I-33 · without a palette the root has no style; with one, nothing else changes', () => {
    const plain = uiButtonView({}, resolveUi({}, {}), { text: 'Go' });
    const toned = uiButtonView({}, resolveUi({ palette: sanguine }, {}), { text: 'Go' });
    expect('style' in plain.attrs).toBe(false);
    const { style, ...rest } = toned.attrs;
    expect(style).toBeTruthy();
    expect({ ...toned, attrs: rest }).toEqual(plain);
  });

  test('REQ-468 · a forced precision changes the mode, never the colours', () => {
    const r = resolveUi({ palette: sanguine }, { forcedPrecision: true });
    expect(r.mode).toBe('precision');
    expect(r.palette).toBe(paletteStyle(sanguine));
  });
});

describe('palettes — dashboard (T-212)', () => {
  test('REQ-461 · the section writes its palette first, then its layout variables; cells hand the palette on', () => {
    const view = dashboardView({ id: 'ops', title: 'Ops', palette: CELL }, [{}], paletteStyle(CELL));
    expect(Object.entries(view.section.style).slice(0, 2)).toEqual([
      ['--sp-ink', '#202020'],
      ['--sp-grid', '#606060'],
    ]);
    expect(view.cells[0]!.context.config.palette).toEqual(CELL);
    expect(Object.keys(dashboardView({ id: 'ops', title: 'Ops' }, [{}]).section.style).some((k) => k.startsWith('--sp-ink'))).toBe(false);
  });

  test('REQ-462 · in a cell, the chart\'s palette is merged over the dashboard\'s field by field', () => {
    const cell: DashboardCellContext = { chartId: 'c', box: { width: 300, height: 200 }, config: { palette: CELL } };
    expect(inCell<LineChartProps>({ palette: OWN }, cell, lineChart).props.palette).toEqual({ ink: '#303030', grid: '#606060' });
    expect(inCell<LineChartProps>({}, cell, lineChart).props.palette).toEqual(CELL);
  });
});

describe('palettes — nested providers (T-212)', () => {
  test('REQ-462 · a nested provider scopes a section: its fields win, the rest is inherited, palettes merge', () => {
    const outer = { ground: 'cyanotype', substrate: 'prussian', palette: PROVIDER };
    expect(nestProvider(outer, { palette: OWN, mode: 'precision', substrate: undefined })).toEqual({
      ground: 'cyanotype',
      substrate: 'prussian',
      mode: 'precision',
      palette: { ink: '#303030', rule: '#555555', text: '#222222' },
    });
    expect(nestProvider(undefined, { locale: 'es' })).toEqual({ locale: 'es' });
    expect(nestProvider({ palette: PROVIDER }, {})).toEqual({ palette: PROVIDER });
  });

  test('REQ-460 · a field left undefined keeps the layer below, and warns nothing', () => {
    const seen = capture();
    const r = resolveUi({ palette: { ink: undefined, text: '#333333' } }, { provider: { palette: PROVIDER } });
    expect(r.palette).toBe('--sp-ink:#111111;--sp-rule:#555555;--sp-text:#333333');
    expect(seen).toEqual([]);
  });
});

describe('palettes — the SVG string (T-212)', () => {
  const view: SvgView = {
    svg: { viewBox: '0 0 10 10', width: '10', height: '10', class: 'sp-chart', substrate: 'cream', mode: 'ink', role: 'img', labelledby: 't d' },
    title: { id: 't', text: 'T' },
    desc: { id: 'd', text: 'D' },
    patterns: [],
    paths: [],
    texts: [],
  } as unknown as SvgView;

  test('REQ-461 · svgString writes a palette on the <svg> root, and nothing without one', () => {
    expect(svgString(view, '--sp-ink:#303030')).toMatch(/^<svg [^>]*style="--sp-ink:#303030"[^>]*>/);
    expect(svgString(view)).not.toMatch(/style=/);
    expect(svgString(view, '')).toBe(svgString(view));
  });
});
