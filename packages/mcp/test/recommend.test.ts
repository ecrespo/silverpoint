/**
 * `recommend_chart` (REQ-540, DD-046): the table of Data Model §2.31, read deterministically.
 * The golden table below is the reviewable contract; a change to the rules shows here.
 */
import { describe, expect, test } from 'vitest';
import { AGENT_CATALOG, Catalog } from '../src/catalog';
import { ToolError } from '../src/errors';
import { recommendChart } from '../src/tools/recommend';

const catalog = new Catalog(AGENT_CATALOG);
const top = (input: Parameters<typeof recommendChart>[1]) => recommendChart(catalog, input).recommendations.map((r) => r.slug);

describe('recommend_chart (REQ-540)', () => {
  test.each([
    [{ shape: 'series', intent: 'trend' }, ['line-chart', 'area-chart', 'step-chart', 'stream-chart', 'polar-line-chart']],
    [{ shape: 'categories', intent: 'compare' }, ['bar-chart', 'lollipop-chart', 'radar-chart', 'polar-bar-chart', 'coxcomb-chart']],
    [{ shape: 'categories', intent: 'compare', rows: 30 }, ['lollipop-chart', 'bar-chart', 'radial-arc-group', 'bullet-chart', 'pyramid-chart']],
    [{ shape: 'parts', intent: 'part-to-whole' }, ['donut-chart', 'waffle-chart', 'treemap-chart', 'diverging-bar-chart', 'stacked-bar-chart']],
    [{ shape: 'parts', intent: 'part-to-whole', rows: 9 }, ['waffle-chart', 'treemap-chart', 'donut-chart', 'diverging-bar-chart', 'stacked-bar-chart']],
    [{ shape: 'links', intent: 'flow' }, ['sankey-chart', 'chord-ring', 'network-chart', 'vector-field-chart']],
    [{ shape: 'points', intent: 'correlation', rows: 2000 }, ['density-bin-chart', 'bubble-chart', 'scatter-chart', 'connected-scatter-chart', 'polar-scatter-chart']],
    [{ shape: 'distribution', intent: 'distribution', rows: 12 }, ['beeswarm-chart', 'box-plot-chart', 'violin-chart', 'histogram-chart', 'ecdf-chart']],
    [{ shape: 'single', intent: 'kpi' }, ['kpi-card', 'gauge-arc', 'meter-chart', 'bullet-chart', 'sparkline-rows']],
    [{ shape: 'categories', intent: 'schedule' }, ['volvelle-chart', 'activity-grid', 'orbit-chart', 'interval-chart', 'bullet-chart']],
  ] as const)('REQ-540 · %j ranks %j', (input, expected) => {
    expect(top(input)).toEqual(expected);
  });

  test('REQ-540 · a pair with no rule falls back to the charts whose shape or intents fit, below every curated score', () => {
    const result = recommendChart(catalog, { shape: 'categories', intent: 'schedule' });
    expect(catalog.data.recommend.some((r) => r.shape === 'categories' && r.intent === 'schedule')).toBe(false);
    expect(result.recommendations.map((r) => r.score)).toEqual([0.25, 0.15, 0.15, 0.15, 0.1]);
  });

  test('REQ-540 · at most five, each with its score and the rule’s own reasons, adjustments included', () => {
    const result = recommendChart(catalog, { shape: 'categories', intent: 'compare', rows: 30 });
    expect(result.recommendations.length).toBeLessThanOrEqual(5);
    const lollipop = result.recommendations[0]!;
    expect(lollipop.score).toBe(0.95);
    expect(lollipop.reasons).toEqual(['A lighter mark per category, readable with many of them.', 'Many categories read better as lollipops.']);
  });

  test('REQ-540 · value fields count the numeric fields described', () => {
    const fields = [
      { name: 'day', type: 'string' as const },
      { name: 'hits', type: 'number' as const },
      { name: 'misses', type: 'number' as const },
    ];
    expect(top({ shape: 'series', intent: 'trend', fields })[1]).toBe('stream-chart');
  });

  test('REQ-540 · Art. 4 · identical input, identical output', () => {
    const input = { shape: 'points', intent: 'distribution', rows: 800 } as const;
    expect(recommendChart(catalog, input)).toEqual(recommendChart(catalog, input));
  });

  test('REQ-549 · an unknown shape or intent is a tool error with suggestions', () => {
    expect(() => recommendChart(catalog, { shape: 'serie', intent: 'trend' })).toThrow(ToolError);
    try {
      recommendChart(catalog, { shape: 'series', intent: 'trends' });
    } catch (error) {
      expect((error as ToolError).suggestions[0]).toBe('trend');
    }
  });
});
