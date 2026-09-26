import { __setDiagnosticSink, type ChartRecipe, type CommonChartProps, type SpCode } from '@silverpoint/core';
import { afterEach, describe, expect, test } from 'vitest';
import { CATALOG } from '../../../tools/visual-gate/catalog';
import { cyanotype, renderChart, resolveGround, silverpoint, toSVGString } from '../src';

let restore: () => void = () => {};
afterEach(() => restore());

describe('the cyanotype ground (Data Model §3.7)', () => {
  test('REQ-040 · is a declarative token object that survives JSON', () => {
    expect(JSON.parse(JSON.stringify(cyanotype))).toEqual(cyanotype);
    expect(Object.isFrozen(cyanotype.ink)).toBe(true);
  });

  test('REQ-028 · declares the weight tonal mechanism and the weight inker', () => {
    expect(cyanotype.name).toBe('cyanotype');
    expect(cyanotype.tonalMechanism).toBe('weight');
    expect(cyanotype.inker).toBe('weight');
  });

  test('REQ-040 · one substrate, Prussian blue, and the verified inks of §3.7', () => {
    expect(cyanotype.substrates).toEqual({ prussian: '#1B3F6B' });
    expect(cyanotype.ink).toEqual({
      primary: '#E2EAF2',
      secondary: '#DCCBA8',
      heighten: '#0C2240',
      rule: '#8AA8C7',
      grid: '#8AA8C7',
      text: '#F4F6F8',
      textMuted: '#B8CBDE',
    });
  });

  test('REQ-028 · builds tone with the weight ramp of §3.7, and hatches nothing', () => {
    expect(cyanotype.tonalRamp).toEqual({
      1: { style: 'weight', weight: 1.5 },
      2: { style: 'weight', weight: 2.25 },
      3: { style: 'weight', weight: 3 },
      4: { style: 'weight', weight: 4 },
    });
    expect(cyanotype.inkOptions).toEqual({ roughness: 0, bowing: 0, hatchAngle: 0, hatchGap: 0, fillWeight: 0 });
    expect(cyanotype.maxHatchDensity).toBe(0);
  });

  test('REQ-040 · typography, empty state and domain padding are those of silverpoint', () => {
    expect(cyanotype.typography).toEqual(silverpoint.typography);
    expect(cyanotype.emptyState).toEqual(silverpoint.emptyState);
    expect(cyanotype.domainPadding).toBe(silverpoint.domainPadding);
  });

  test('REQ-045 · is registered by default: resolving its name warns nothing', () => {
    const seen: SpCode[] = [];
    restore = __setDiagnosticSink((code) => seen.push(code));
    expect(resolveGround('cyanotype', 'LineChart')).toBe(cyanotype);
    expect(seen).toEqual([]);
  });
});

describe('every catalog chart under cyanotype (I-16)', () => {
  const env = { id: 'sp-cy', width: 320 };

  test.each(CATALOG.map((entry) => [entry.chart, entry] as const))('REQ-028 · %s encodes tone by weight and emits no hatching', (_chart, { recipe }) => {
    const rendered = renderChart(recipe as ChartRecipe<CommonChartProps>, { ground: 'cyanotype', mode: 'ink' }, env);
    expect(rendered.ground).toBe('cyanotype');
    expect(rendered.view.svg.class).toBe('sp-chart sp-ground-cyanotype');
    const svg = toSVGString(rendered);
    expect(svg).not.toMatch(/data-role="hatch"|<pattern|data-paint="tile"/);
    for (const [, level] of svg.matchAll(/data-weight="([^"]*)"/g)) expect(['1', '2', '3', '4']).toContain(level);
  });

  test('REQ-028 · the toned charts do carry weights, so the check is not vacuous', () => {
    const weighted = CATALOG.filter(({ recipe }) => /data-weight=/.test(toSVGString(renderChart(recipe as ChartRecipe<CommonChartProps>, { ground: 'cyanotype' }, env))));
    expect(weighted.map((entry) => entry.chart)).toEqual(expect.arrayContaining(['ActivityGrid', 'BulletChart', 'StackedBarChart', 'TreemapChart', 'SankeyChart']));
  });

  test.each(CATALOG.map((entry) => [entry.chart, entry] as const))('REQ-006 · %s draws the same encoding vertices in ink and precision', (_chart, { recipe }) => {
    const encoding = (mode: 'ink' | 'precision') =>
      renderChart(recipe as ChartRecipe<CommonChartProps>, { ground: 'cyanotype', mode }, env)
        .geometry.strokes.filter((s) => s.role === 'encoding')
        .map((s) => `${s.part}|${s.d}`);
    expect(encoding('ink')).toEqual(encoding('precision'));
  });
});
