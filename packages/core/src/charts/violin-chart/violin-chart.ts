import { area as areaShape, curveMonotoneX, curveMonotoneY } from 'd3-shape';
import type { ChartModel, ChartRecipe, HitArea, RecipeContext, Stroke, ViolinChartProps } from '../../types';
import { checkBandwidth } from '../shared/contracts';
import { kde, silverman, type DensityPoint } from '../shared/density';
import { bandFrame, buildDistribution, valueExtent, type DistributionFamily, type DistributionGroup } from '../shared/distribution';
import { circlePath } from '../shared/format';
import { quantile } from '../shared/stats';
import { VIOLIN_CHART_DEMO, VIOLIN_CHART_DEMO_KEYS } from './demo';

const CHART = 'ViolinChart';
const HEIGHTEN_RADIUS = 3.5;
const POINT_RADIUS = 2.5;
/** A density needs two observations (REQ-434). */
const MINIMUM = 2;
/** Share of a group's band the widest violin fills, and the most it may be in px. */
const VIOLIN_FILL = 0.9;
const VIOLIN_MAX = 60;
/** Half-length of the quartile and median marks, as a share of the band. */
const MARK = 0.15;

/**
 * One bandwidth for every group, so the shapes compare (API delta §3): the prop, or the mean of the
 * groups' Silverman bandwidths. An invalid prop is the default, warned once (SP021).
 */
function bandwidthOf(groups: readonly DistributionGroup[], props: ViolinChartProps): { value: number; given: boolean } {
  const given = checkBandwidth(CHART, props.bandwidth);
  if (given !== undefined) return { value: given, given: true };
  const rules = groups.filter((g) => !g.small).map((g) => silverman(g.sorted));
  return { value: rules.length > 0 ? rules.reduce((s, h) => s + h, 0) / rules.length : 1, given: false };
}

/** The density's samples from just before it rises to just after it falls: the violin's outline. */
function trimmed(points: readonly DensityPoint[]): DensityPoint[] {
  const first = points.findIndex((p) => p.value > 0);
  let last = points.length - 1;
  while (last > 0 && (points[last] as DensityPoint).value <= 0) last -= 1;
  return points.slice(Math.max(first - 1, 0), Math.min(last + 2, points.length));
}

const family: DistributionFamily<ViolinChartProps> = {
  chart: CHART,
  fallbackName: 'Violin chart',
  demo: VIOLIN_CHART_DEMO,
  demoKeys: VIOLIN_CHART_DEMO_KEYS,
  minimum: MINIMUM,
  columns: ['n', 'min', 'q1', 'median', 'q3', 'max'],
  row(group, _props, format) {
    const s = group.sorted;
    return [String(s.length), format(s[0] as number), format(quantile(s, 0.25)), format(quantile(s, 0.5)), format(quantile(s, 0.75)), format(s.at(-1) as number)];
  },
  draw({ props, context, groups, area, valueName, format }) {
    const h = bandwidthOf(groups, props);
    const domain = valueExtent(groups, h.value);
    const frame = bandFrame(area, groups, domain, { chart: CHART, property: valueName, padding: context.domainPadding, locale: context.locale, numberFormat: props.numberFormat, orientation: props.orientation });
    const { rows, value: v } = frame;
    const strokes: Stroke[] = [...frame.strokes];
    const hitAreas: HitArea[] = [];
    const densities = groups.map((g) => (g.small ? undefined : trimmed(kde(g.sorted, h.value, domain))));
    const peak = Math.max(...densities.flatMap((d) => (d ?? []).map((p) => p.value)), 0);
    const half = Math.min(frame.bandwidth * VIOLIN_FILL, VIOLIN_MAX) / 2;
    const width = (density: number) => (peak > 0 ? (density / peak) * half : 0);
    const mark = frame.bandwidth * MARK;
    const at = (along: number, across: number) => (rows ? { x: along, y: across } : { x: across, y: along });
    const rule = (value: number, c: number) => {
      const p = at(v(value), c - mark);
      const q = at(v(value), c + mark);
      return `M${p.x},${p.y}L${q.x},${q.y}`;
    };
    let best: { index: number; median: number } | undefined;

    groups.forEach((group, g) => {
      const c = frame.centre(g);
      const cell = rows ? { column: 0, row: g } : { column: g, row: 0 };
      const median = quantile(group.sorted, 0.5);
      const m = at(v(median), c);
      const density = densities[g];
      if (!density) {
        for (const value of group.sorted) {
          const p = at(v(value), c);
          strokes.push({ d: circlePath(p.x, p.y, POINT_RADIUS), role: 'encoding', part: 'ink' });
        }
        hitAreas.push({ seriesKey: 'median', index: g, datum: Object.freeze({ group: group.name, n: group.sorted.length, median }), value: median, x: m.x, y: m.y, cell });
        return;
      }
      // The mirrored density, closed: out on one side of the centre, back on the other.
      const outline = rows
        ? areaShape<DensityPoint>().x((p) => v(p.at)).y0((p) => c - width(p.value)).y1((p) => c + width(p.value)).curve(curveMonotoneX)(density)
        : areaShape<DensityPoint>().y((p) => v(p.at)).x0((p) => c - width(p.value)).x1((p) => c + width(p.value)).curve(curveMonotoneY)(density);
      if (outline) strokes.push({ d: outline, role: 'encoding', part: 'ink', tone: 1 });
      const q1 = quantile(group.sorted, 0.25);
      const q3 = quantile(group.sorted, 0.75);
      if (props.quartiles !== false) {
        for (const q of [q1, q3]) strokes.push({ d: rule(q, c), role: 'encoding', part: 'ink-secondary', dash: 'dotted' });
      }
      strokes.push({ d: rule(median, c), role: 'encoding', part: 'ink' });
      const lo = at(v(domain[0]), c - half);
      const hi = at(v(domain[1]), c + half);
      hitAreas.push({
        seriesKey: 'median',
        index: g,
        datum: Object.freeze({ group: group.name, n: group.sorted.length, q1, median, q3 }),
        value: median,
        x: m.x,
        y: m.y,
        box: { x: Math.min(lo.x, hi.x), y: Math.min(lo.y, hi.y), width: Math.abs(hi.x - lo.x), height: Math.abs(hi.y - lo.y) },
        cell,
      });
      if (!best || median > best.median) best = { index: g, median };
    });

    // One heightened element (REQ-442): the median mark of the highest median.
    const raised = hitAreas.find((hit) => hit.index === (best?.index ?? 0));
    if (raised) {
      const markPath = circlePath(raised.x, raised.y, HEIGHTEN_RADIUS);
      strokes.push({ d: markPath, role: 'encoding', part: 'heighten', paint: 'fill' });
      strokes.push({ d: markPath, role: 'encoding', part: 'ink', paint: 'stroke' });
    }
    const method = h.given ? 'as given' : "the mean of the groups' Silverman rules";
    return {
      plot: frame.plot,
      strokes,
      labels: frame.labels,
      hitAreas,
      summary: `densities by an Epanechnikov kernel of bandwidth ${format(h.value)}, ${method}, at 64 points; ${groups.map((g) => `${g.name} median ${format(quantile(g.sorted, 0.5))}`).join(', ')}`,
    };
  },
};

function buildViolinChart(props: ViolinChartProps, context: RecipeContext): ChartModel {
  return buildDistribution(family, props, context);
}

/** `ViolinChart` recipe (REQ-403): a mirrored kernel density per group, quartiles marked inside. */
export const violinChart: ChartRecipe<ViolinChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildViolinChart });
