import type { ChartRecipe, GaugeArcProps, RecipeContext } from '../../types';
import { PLOT_INSET } from '../shared/cartesian';
import { arcPath, pointAt, sectorPath } from '../shared/polar';
import { buildScalar, type ScalarFamily } from '../shared/scalar';

/** The gauge sweeps 240°, from 8 o'clock over the top to 4 o'clock. */
const START = (-2 * Math.PI) / 3;
const SPAN = (4 * Math.PI) / 3;
/** Inner radius of the band, as a share of the outer. */
const BAND = 0.8;

const FAMILY: ScalarFamily = {
  chart: 'GaugeArc',
  fallbackName: 'Gauge',
  // A 240° arc reaches half a radius below the centre: it needs 1.5 radii of height.
  frameIn: (area) => {
    const radius = Math.max(Math.min(area.width / 2, area.height / 1.5) - PLOT_INSET, 1);
    return { cx: area.x + area.width / 2, cy: area.y + (area.height - 1.5 * radius) / 2 + radius, radius };
  },
  // Inside the ring, which the value never crosses.
  readoutAt: (frame) => ({ value: frame.cy + 2, caption: frame.cy + 16 }),
  draw: (frame, value) => {
    const inner = frame.radius * BAND;
    const middle = (inner + frame.radius) / 2;
    const strokes = [{ d: arcPath(frame, middle, START, START + SPAN), role: 'ornament' as const, part: 'grid' as const }];
    if (value === undefined) return { strokes, labels: [] };
    const end = START + (value / 100) * SPAN;
    const d = sectorPath(frame, { inner, outer: frame.radius, start: START, end });
    return { strokes: d ? [...strokes, { d, role: 'encoding' as const, part: 'ink' as const, tone: 2 as const }] : strokes, labels: [], tip: pointAt(frame, end, middle) };
  },
};

/** `GaugeArc` recipe (REQ-080): a 240° arc swept to a percent, the readout at its centre. */
export const gaugeArc: ChartRecipe<GaugeArcProps> = /* @__PURE__ */ Object.freeze({
  name: 'GaugeArc',
  build: (props: GaugeArcProps, context: RecipeContext) => buildScalar(FAMILY, props, context),
});
