import type { ChartRecipe, RadialRingsProps, RecipeContext } from '../../types';
import { formatNumber } from '../shared/format';
import { polarFrame } from '../shared/polar';
import { buildTracks, type TrackFamily } from '../shared/tracks';
import { RADIAL_RINGS_DEMO } from './demo';

const FAMILY: TrackFamily = {
  chart: 'RadialRings',
  fallbackName: 'Radial rings',
  // A full turn from 12 o'clock: a ring is progress towards 100.
  start: 0,
  span: 2 * Math.PI,
  frameIn: (area) => polarFrame(area),
  shareOf: (s) => s.value / 100,
  printed: (s, locale) => `${formatNumber(s.value, locale, { maximumFractionDigits: 1 })}%`,
  demo: RADIAL_RINGS_DEMO,
};

/** `RadialRings` recipe (REQ-079): concentric progress rings, sweep ∝ value in 0-100. */
export const radialRings: ChartRecipe<RadialRingsProps> = /* @__PURE__ */ Object.freeze({
  name: 'RadialRings',
  build: (props: RadialRingsProps, context: RecipeContext) => buildTracks(FAMILY, props, context),
});
