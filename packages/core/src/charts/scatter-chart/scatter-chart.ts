import type { ChartRecipe, RecipeContext, ScatterChartProps } from '../../types';
import { buildPoints } from '../shared/points';
import { SCATTER_CHART_DEMO } from './demo';

const FAMILY = { chart: 'ScatterChart', fallbackName: 'Scatter chart', defaultSizeRange: [60, 240] as const, sizeByDefault: false, toned: false };

/** `ScatterChart` recipe (REQ-082): points on two linear scales, optionally sized by area. */
export const scatterChart: ChartRecipe<ScatterChartProps> = /* @__PURE__ */ Object.freeze({
  name: FAMILY.chart,
  build: (props: ScatterChartProps, context: RecipeContext) => buildPoints(FAMILY, props, context, SCATTER_CHART_DEMO),
});
