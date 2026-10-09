import { curveMonotoneX, line } from 'd3-shape';
import { linearScale } from '../../scales/scales';
import type { ChartModel, ChartRecipe, HitArea, Rect, RecipeContext, RidgelineChartProps, Stroke, TextLabel } from '../../types';
import { AXIS_BAND, PLOT_INSET } from '../shared/cartesian';
import { checkBandwidth, checkOverlap } from '../shared/contracts';
import { kde, silverman, type DensityPoint } from '../shared/density';
import { buildDistribution, ROW_LABELS, valueExtent, type DistributionFamily, type DistributionGroup } from '../shared/distribution';
import { circlePath, fitText, formatNumber } from '../shared/format';
import { quantile } from '../shared/stats';
import { RIDGELINE_CHART_DEMO, RIDGELINE_CHART_DEMO_KEYS } from './demo';

const CHART = 'RidgelineChart';
const HEIGHTEN_RADIUS = 3.5;
const POINT_RADIUS = 2.5;
/** A density needs two observations (REQ-434). */
const MINIMUM = 2;
const DEFAULT_OVERLAP = 0.5;

/** The shared bandwidth: the prop, or the mean of the groups' Silverman rules (as the violin). */
function bandwidthOf(groups: readonly DistributionGroup[], props: RidgelineChartProps): { value: number; given: boolean } {
  const given = checkBandwidth(CHART, props.bandwidth);
  if (given !== undefined) return { value: given, given: true };
  const rules = groups.filter((g) => !g.small).map((g) => silverman(g.sorted));
  return { value: rules.length > 0 ? rules.reduce((s, h) => s + h, 0) / rules.length : 1, given: false };
}

/** Where a density peaks: the first sample of its largest value. */
const peakOf = (density: readonly DensityPoint[]) => density.reduce((best, p) => (p.value > best.value ? p : best));

const family: DistributionFamily<RidgelineChartProps> = {
  chart: CHART,
  fallbackName: 'Ridgeline chart',
  demo: RIDGELINE_CHART_DEMO,
  demoKeys: RIDGELINE_CHART_DEMO_KEYS,
  minimum: MINIMUM,
  columns: ['n', 'median', 'peak'],
  row(group, props, format, groups) {
    const s = group.sorted;
    if (group.small) return [String(s.length), format(quantile(s, 0.5)), '—'];
    // The same bandwidth and domain the drawing uses, so the table and the readout say the same.
    const h = bandwidthOf(groups, props).value;
    return [String(s.length), format(quantile(s, 0.5)), format(peakOf(kde(s, h, valueExtent(groups, h))).at)];
  },
  draw({ props, context, groups, area, valueName, format }) {
    const h = bandwidthOf(groups, props);
    const overlap = checkOverlap(CHART, props.overlap) ?? DEFAULT_OVERLAP;
    const domain = valueExtent(groups, h.value);
    const plot: Rect = { x: area.x + ROW_LABELS, y: area.y + PLOT_INSET, width: Math.max(area.width - ROW_LABELS - PLOT_INSET, 1), height: Math.max(area.height - AXIS_BAND - PLOT_INSET, 1) };
    const right = plot.x + plot.width;
    const x = linearScale(domain, [plot.x, right], { chart: CHART, property: valueName, padding: context.domainPadding });
    const strokes: Stroke[] = [];
    const labels: TextLabel[] = [];
    const hitAreas: HitArea[] = [];

    // n baselines a step apart; each ridge rises (1 + overlap) steps, into the one behind it.
    const n = groups.length;
    const step = plot.height / (n + overlap);
    const rise = step * (1 + overlap);
    const baseline = (g: number) => plot.y + rise + g * step;
    const densities = groups.map((g) => (g.small ? undefined : kde(g.sorted, h.value, domain)));
    const tallest = Math.max(...densities.flatMap((d) => (d ?? []).map((p) => p.value)), 0);
    const heightOf = (density: number) => (tallest > 0 ? (density / tallest) * rise : 0);

    for (const tick of x.ticks(4)) {
      labels.push({ x: x(tick), y: area.y + area.height - 5, text: formatNumber(tick, context.locale, props.numberFormat), kind: 'tick', part: 'axis', anchor: 'middle' });
    }
    // Back to front: the ridge nearest the reader is drawn last.
    groups.forEach((group, g) => {
      const base = baseline(g);
      strokes.push({ d: `M${plot.x},${base}H${right}`, role: 'ornament', part: 'rule' });
      labels.push({ x: area.x + PLOT_INSET, y: base - 2, text: fitText(group.name, ROW_LABELS - PLOT_INSET - 6), kind: 'tick', part: 'axis', anchor: 'start' });
      const density = densities[g];
      if (!density) {
        for (const value of group.sorted) strokes.push({ d: circlePath(x(value), base, POINT_RADIUS), role: 'encoding', part: 'ink' });
        const value = quantile(group.sorted, 0.5);
        hitAreas.push({ seriesKey: 'peak', index: g, datum: Object.freeze({ group: group.name, n: group.sorted.length, median: value }), value, x: x(value), y: base });
        return;
      }
      // An open profile, outline only: overlapping hatch would read as value (DD-035).
      const d = line<DensityPoint>().x((p) => x(p.at)).y((p) => base - heightOf(p.value)).curve(curveMonotoneX)(density);
      if (d) strokes.push({ d, role: 'encoding', part: 'ink' });
      const top = peakOf(density);
      hitAreas.push({
        seriesKey: 'peak',
        index: g,
        datum: Object.freeze({ group: group.name, n: group.sorted.length, median: quantile(group.sorted, 0.5), peak: top.at }),
        value: top.at,
        x: x(top.at),
        y: base - heightOf(top.value),
      });
    });

    // One heightened element (REQ-442): the front ridge's peak.
    const front = hitAreas.at(-1);
    if (front) {
      const mark = circlePath(front.x, front.y, HEIGHTEN_RADIUS);
      strokes.push({ d: mark, role: 'encoding', part: 'heighten', paint: 'fill' });
      strokes.push({ d: mark, role: 'encoding', part: 'ink', paint: 'stroke' });
    }
    return {
      plot,
      strokes,
      labels,
      hitAreas,
      summary: `densities by an Epanechnikov kernel of bandwidth ${format(h.value)}, ${h.given ? 'as given' : "the mean of the groups' Silverman rules"}, overlapping by ${format(overlap)}; ${hitAreas.map((hit, g) => `${groups[g]?.name ?? ''} peaks at ${format(hit.value)}`).join(', ')}`,
    };
  },
};

function buildRidgelineChart(props: RidgelineChartProps, context: RecipeContext): ChartModel {
  return buildDistribution(family, props, context);
}

/** `RidgelineChart` recipe (REQ-404): a kernel density per group on overlapping baselines. */
export const ridgelineChart: ChartRecipe<RidgelineChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildRidgelineChart });
