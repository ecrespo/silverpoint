import {
  activityGrid,
  bulletChart,
  heatmapChart,
  lineChart,
  pyramidChart,
  sankeyChart,
  treemapChart,
  type ChartRecipe, type CommonChartProps, type Stroke } from '@silverpoint/core';
import { describe, expect, test } from 'vitest';
import { renderChart } from '../src';

/**
 * REQ-006, Constitution Art. 1: every chart produces identical encoding vertices in `ink` and in
 * `precision`. Later phases append their charts to this list; the assertions do not change.
 */
const CHARTS: readonly { readonly recipe: ChartRecipe<CommonChartProps>; readonly variants: readonly CommonChartProps[] }[] = [
  {
    recipe: lineChart as ChartRecipe<CommonChartProps>,
    variants: [
      {},
      { title: 'Card', badge: 'Live', value: 88, unit: 'requests', footerLeft: 'a', footerRight: 'b' },
      { chrome: 'bare' },
      { hatchFill: 'per-shape' },
      { data: [{ x: 1, value: 3 }, { x: 2, value: null }, { x: 4, value: 7 }], connectNulls: true } as CommonChartProps,
    ],
  },
  // Phase 1: the charts that need no scale. Each also runs under per-shape hatching.
  ...[bulletChart, pyramidChart, heatmapChart, treemapChart, sankeyChart, activityGrid].map((recipe) => ({
    recipe: recipe as ChartRecipe<CommonChartProps>,
    variants: [{}, { chrome: 'bare' }, { hatchFill: 'per-shape' }] as CommonChartProps[],
  })),
];

const SEEDS = [0, 1, 1592, 2 ** 31, 2 ** 32 - 1];
const SUBSTRATES = ['cream', 'green', 'blue', 'ochre'] as const;

const encoding = (strokes: readonly Stroke[]) => strokes.filter((s) => s.role === 'encoding').map((s) => `${s.part}|${s.d}`);

describe.each(CHARTS.map((c) => [c.recipe.name, c] as const))('%s', (_name, { recipe, variants }) => {
  test.each(variants.map((v, i) => [i, v] as const))('REQ-006 · variant %i draws identical encoding vertices in both modes', (_i, variant) => {
    for (const seed of SEEDS) {
      for (const substrate of SUBSTRATES) {
        const env = { id: `sp-eq-${seed}`, width: 320 };
        const inked = renderChart(recipe, { ...variant, seed, substrate, mode: 'ink' }, env);
        const exact = renderChart(recipe, { ...variant, seed, substrate, mode: 'precision' }, env);
        expect(encoding(inked.geometry.strokes), `seed ${seed}, ${substrate}`).toEqual(encoding(exact.geometry.strokes));
        expect(encoding(inked.geometry.strokes).length).toBeGreaterThan(0);
      }
    }
  });

  test('Art. 1 · ink mode actually inks something, so the equivalence is not vacuous', () => {
    const env = { id: 'sp-eq', width: 320 };
    const inked = renderChart(recipe, { mode: 'ink' }, env).geometry.strokes.map((s) => s.d);
    const exact = renderChart(recipe, { mode: 'precision' }, env).geometry.strokes.map((s) => s.d);
    expect(inked).not.toEqual(exact);
  });
});
