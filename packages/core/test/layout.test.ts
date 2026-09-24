import { describe, expect, test } from 'vitest';
import { barChart, bubbleChart, composedChart, scatterChart, stackedBarChart, streamChart, type ChartModel, type ChartRecipe, type RecipeContext, type TextLabel } from '../src';

const context: RecipeContext = { id: 'sp-layout', width: 320, locale: 'en', emptyState: { text: 'No data', rule: true }, domainPadding: 0.1 };
const build = (recipe: ChartRecipe<never>): ChartModel => (recipe as ChartRecipe<{ height: number }>).build({ height: 150 }, context);

/** Cap height and advance of a 9.5 px tick label, as the legend measures them. */
const CAP = 7;
const ADVANCE = 5.2;
const numeric = (l: TextLabel) => /^-?[\d.,]+%?$/.test(l.text);

/**
 * Seen in the Phase 2 goldens: the legend row sat 8 px above the top value tick, so the two lines
 * of 9.5 px text touched. Legible text never overprints (REQ-120: the chart is read, not guessed).
 */
describe('legend and value axis keep apart', () => {
  test.each([
    ['BarChart', barChart],
    ['StackedBarChart', stackedBarChart],
    ['ComposedChart', composedChart],
    ['StreamChart', streamChart],
  ] as const)('REQ-120 · %s: every value tick sits a full line below the legend', (_name, recipe) => {
    const model = build(recipe);
    const labels = model.geometry.labels.filter((l) => l.kind === 'tick');
    const legendY = Math.min(...labels.map((l) => l.y));
    const legendRow = labels.filter((l) => l.y === legendY);
    expect(legendRow.every((l) => !numeric(l))).toBe(true);
    for (const tick of labels.filter((l) => numeric(l) && l.anchor === 'start')) {
      expect(tick.y - CAP - legendY, tick.text).toBeGreaterThanOrEqual(4);
    }
  });
});

/**
 * Seen in the Phase 2 goldens: the leftmost bubble covered the value tick at the plot's left edge.
 * The value labels get a gutter of their own; no mark is drawn over them.
 */
describe('marks keep off the value labels', () => {
  test.each([
    ['ScatterChart', scatterChart],
    ['BubbleChart', bubbleChart],
  ] as const)('REQ-120 · %s: no point covers a value tick label', (_name, recipe) => {
    const model = build(recipe);
    const ticks = model.geometry.labels.filter((l) => l.kind === 'tick' && l.anchor === 'start' && numeric(l));
    expect(ticks.length).toBeGreaterThan(0);
    for (const hit of model.geometry.hitAreas) {
      const b = hit.box!;
      for (const t of ticks) {
        const overlaps = b.x < t.x + t.text.length * ADVANCE && b.x + b.width > t.x && b.y < t.y && b.y + b.height > t.y - CAP;
        expect(overlaps, `point #${hit.index} over tick ${t.text}`).toBe(false);
      }
    }
  });
});
