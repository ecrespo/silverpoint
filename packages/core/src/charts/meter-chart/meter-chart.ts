import type { ChartRecipe, MeterChartProps, RecipeContext, Stroke, TextLabel } from '../../types';
import { arcPath, pointAt } from '../shared/polar';
import { buildScalar, type ScalarFamily } from '../shared/scalar';
import { halfCircleFrame } from '../shared/tracks';

/** The meter sweeps 180°, from 9 o'clock over the top to 3 o'clock. */
const START = -Math.PI / 2;
const SPAN = Math.PI;
const TICKS = [0, 25, 50, 75, 100];
/** Needle length, as a share of the radius. */
const NEEDLE = 0.86;

const FAMILY: ScalarFamily = {
  chart: 'MeterChart',
  fallbackName: 'Meter',
  // Under the pivot, clear of the needle, which sweeps only the upper half: the 30 px readout
  // stands up to 22 px above its baseline, and the caption goes under it.
  frameIn: (area) => halfCircleFrame(area, 46),
  readoutAt: (frame) => ({ value: frame.cy + 29, caption: frame.cy + 42 }),
  draw: (frame, value) => {
    const strokes: Stroke[] = [{ d: arcPath(frame, frame.radius, START, START + SPAN), role: 'ornament', part: 'grid' }];
    const labels: TextLabel[] = [];
    for (const tick of TICKS) {
      const angle = START + (tick / 100) * SPAN;
      const a = pointAt(frame, angle, frame.radius * 0.9);
      const b = pointAt(frame, angle, frame.radius);
      strokes.push({ d: `M${a.x},${a.y}L${b.x},${b.y}`, role: 'ornament', part: 'rule' });
    }
    labels.push({ x: frame.cx - frame.radius, y: frame.cy + 11, text: '0', kind: 'tick', part: 'axis', anchor: 'middle' });
    labels.push({ x: frame.cx + frame.radius, y: frame.cy + 11, text: '100', kind: 'tick', part: 'axis', anchor: 'middle' });
    if (value === undefined) return { strokes, labels };
    // The needle is the encoding: a straight line from the pivot to the value.
    const tip = pointAt(frame, START + (value / 100) * SPAN, frame.radius * NEEDLE);
    strokes.push({ d: `M${frame.cx},${frame.cy}L${tip.x},${tip.y}`, role: 'encoding', part: 'ink' });
    return { strokes, labels, tip };
  },
};

/** `MeterChart` recipe (REQ-081): a semicircular meter whose needle points at a percent. */
export const meterChart: ChartRecipe<MeterChartProps> = /* @__PURE__ */ Object.freeze({
  name: 'MeterChart',
  build: (props: MeterChartProps, context: RecipeContext) => buildScalar(FAMILY, props, context),
});
