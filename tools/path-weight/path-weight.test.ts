import { PATH_BYTE_BUDGET } from '@silverpoint/core';
import { describe, expect, test } from 'vitest';
import { catalogEntry, PHASE_1 } from '../visual-gate/catalog';
import { measureChart, measureDenseCard, measureLineChart } from './measure';

describe('path weight (PRD NFR §7)', () => {
  test.each(['sm', 'md', 'lg'] as const)('NFR §7 · the line chart with its demo dataset stays under 40 KB at %s, inked', (size) => {
    expect(measureLineChart(size).ink).toBeLessThanOrEqual(PATH_BYTE_BUDGET);
  });

  test('REQ-029 · a deliberately dense cross-hatched card stays under 40 KB with the tile fill', () => {
    const card = measureDenseCard();
    expect(card.tile).toBeLessThanOrEqual(PATH_BYTE_BUDGET);
  });

  test('DD-007 · per-shape hatching costs at least ten times the tile fill on the dense card', () => {
    const card = measureDenseCard();
    expect(card.perShape / card.tile).toBeGreaterThanOrEqual(10);
  });

  test('DD-007 · a tile costs about 1 KB per tonal level, whatever the number of shapes', () => {
    const few = measureDenseCard(2);
    const many = measureDenseCard(12);
    expect(many.tileDefs).toBe(few.tileDefs);
    // The card uses two tonal levels: 4 for the bars, 3 for the area.
    expect(many.tileDefs / 2).toBeLessThanOrEqual(1_024);
  });
});

describe('path weight of the Phase 1 charts (T-044, the open question of TD §10)', () => {
  test.each(
    PHASE_1.flatMap((entry) => (['sm', 'md', 'lg'] as const).map((size) => [entry.chart, size, entry] as const)),
  )('NFR §7 · REQ-029 · %s with its demo dataset stays under 40 KB at %s, inked with the tile fill', (_chart, size, entry) => {
    expect(measureChart(entry.recipe, size).tile).toBeLessThanOrEqual(PATH_BYTE_BUDGET);
  });

  test('DD-007 · on the matrix families the tile fill costs less than per-shape hatching', () => {
    for (const chart of ['HeatmapChart', 'ActivityGrid']) {
      const weight = measureChart(catalogEntry(chart).recipe, 'md');
      expect(weight.tile, chart).toBeLessThan(weight.perShape);
    }
  });
});
