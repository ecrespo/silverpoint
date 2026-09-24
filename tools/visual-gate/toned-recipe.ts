/**
 * A recipe with toned closed shapes, so inking emits <defs>, <pattern> and tile fills — the
 * branch of every adapter template the line chart never reaches. Test-only.
 */
import type { ChartModel, ChartRecipe, CommonChartProps, Stroke } from '@silverpoint/core';

export const tonedRecipe: ChartRecipe<CommonChartProps> = {
  name: 'TonedShapes',
  build(_props, context): ChartModel {
    const box = { x: 0, y: 0, width: 200, height: 100 };
    const strokes: Stroke[] = [
      { d: 'M10,90V30H40V90Z', role: 'encoding', part: 'ink', tone: 2 },
      { d: 'M60,90V50H90V90Z', role: 'encoding', part: 'ink-secondary', tone: 4 },
      { d: 'M0.5,0.5H199.5V99.5H0.5Z', role: 'ornament', part: 'rule' },
    ];
    return {
      chart: 'TonedShapes',
      id: context.id,
      status: 'ready',
      geometry: { viewBox: box, plot: box, strokes, labels: [{ x: 10, y: 12, text: 'Tones & "hatching"', kind: 'title', part: 'text', anchor: 'start' }], hitAreas: [], defs: [] },
      chrome: 'card',
      name: 'Toned shapes',
      description: 'Two toned bars',
      ids: { title: `${context.id}-title`, desc: `${context.id}-desc`, table: `${context.id}-table` },
      table: { caption: 'Toned shapes', columns: ['bar', 'tone'], rows: [['a', '2'], ['b', '4']] },
      dataTable: 'hidden',
    };
  },
};
