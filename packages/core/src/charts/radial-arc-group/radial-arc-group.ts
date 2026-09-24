import type { ChartRecipe, RadialArcGroupProps, RecipeContext } from '../../types';
import { formatNumber } from '../shared/format';
import { buildTracks, halfCircleFrame, type TrackFamily } from '../shared/tracks';
import { RADIAL_ARC_GROUP_DEMO } from './demo';

const FAMILY: TrackFamily = {
  chart: 'RadialArcGroup',
  fallbackName: 'Radial arc group',
  // From 9 o'clock over the top to 3: a half turn.
  start: -Math.PI / 2,
  span: Math.PI,
  frameIn: (area) => halfCircleFrame(area, 8),
  // The largest value sweeps the whole half turn.
  shareOf: (s, all) => s.value / Math.max(...all.map((x) => x.value), Number.MIN_VALUE),
  printed: (s, locale, numberFormat) => formatNumber(s.value, locale, numberFormat),
  demo: RADIAL_ARC_GROUP_DEMO,
};

/** `RadialArcGroup` recipe (REQ-078): concentric 180° tracks, sweep ∝ value / the largest. */
export const radialArcGroup: ChartRecipe<RadialArcGroupProps> = /* @__PURE__ */ Object.freeze({
  name: 'RadialArcGroup',
  build: (props: RadialArcGroupProps, context: RecipeContext) => buildTracks(FAMILY, props, context),
});
