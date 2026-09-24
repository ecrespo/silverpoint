import type { BubbleChartProps, ChartRecipe, RecipeContext } from '../../types';
import { buildPoints } from '../shared/points';
import { BUBBLE_CHART_DEMO } from './demo';

const FAMILY = { chart: 'BubbleChart', fallbackName: 'Bubble chart', defaultSizeRange: [100, 500] as const, sizeByDefault: true, toned: true };

/** `BubbleChart` recipe (REQ-083): circles whose area encodes the size. */
export const bubbleChart: ChartRecipe<BubbleChartProps> = /* @__PURE__ */ Object.freeze({
  name: 'BubbleChart',
  build: (props: BubbleChartProps, context: RecipeContext) => buildPoints(FAMILY, props, context, BUBBLE_CHART_DEMO),
});
