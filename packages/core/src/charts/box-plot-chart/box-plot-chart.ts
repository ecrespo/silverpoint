import type { BoxPlotChartProps, ChartModel, ChartRecipe, HitArea, RecipeContext, Stroke } from '../../types';
import { rectPath } from '../shared/cells';
import { checkWhisker } from '../shared/contracts';
import { bandFrame, buildDistribution, valueExtent, type DistributionFamily, type DistributionGroup } from '../shared/distribution';
import { circlePath } from '../shared/format';
import { fiveNumber, type FiveNumber } from '../shared/stats';
import { BOX_PLOT_CHART_DEMO, BOX_PLOT_CHART_DEMO_KEYS } from './demo';

const CHART = 'BoxPlotChart';
const HEIGHTEN_RADIUS = 3.5;
const POINT_RADIUS = 2.5;
/** Tukey's reach (REQ-432). */
const DEFAULT_WHISKER = 1.5;
/** A box needs five observations (REQ-434). */
const MINIMUM = 5;
/** Share of a group's band the box fills, and the most it may be in px. */
const BOX_FILL = 0.6;
const BOX_MAX = 40;

/** The whisker reach; an invalid one is the default, warned once per render (SP021, REQ-433). */
const whiskerOf = (props: BoxPlotChartProps) => checkWhisker(CHART, props.whisker) ?? DEFAULT_WHISKER;
const summaryOf = (group: DistributionGroup, props: BoxPlotChartProps): FiveNumber => fiveNumber(group.sorted, whiskerOf(props));

const family: DistributionFamily<BoxPlotChartProps> = {
  chart: CHART,
  fallbackName: 'Box plot',
  demo: BOX_PLOT_CHART_DEMO,
  demoKeys: BOX_PLOT_CHART_DEMO_KEYS,
  minimum: MINIMUM,
  columns: ['n', 'min', 'q1', 'median', 'q3', 'max', 'outliers'],
  row(group, props, format) {
    if (group.sorted.length === 0) return [String(0), '—', '—', '—', '—', '—', '—'];
    const s = summaryOf(group, props);
    return [String(group.sorted.length), format(s.min), format(s.q1), format(s.median), format(s.q3), format(s.max), s.outliers.length > 0 ? s.outliers.map(format).join(', ') : '—'];
  },
  draw({ props, context, groups, area, valueName, format }) {
    const frame = bandFrame(area, groups, valueExtent(groups), { chart: CHART, property: valueName, padding: context.domainPadding, locale: context.locale, numberFormat: props.numberFormat, orientation: props.orientation });
    const { rows, value: v } = frame;
    const strokes: Stroke[] = [...frame.strokes];
    const hitAreas: HitArea[] = [];
    const showOutliers = props.outliers !== false;
    const half = Math.min(frame.bandwidth * BOX_FILL, BOX_MAX) / 2;
    // (along, across) → (x, y): the value runs up a column, or across a row.
    const at = (along: number, across: number) => (rows ? { x: along, y: across } : { x: across, y: along });
    const segment = (a0: number, c0: number, a1: number, c1: number) => {
      const p = at(a0, c0);
      const q = at(a1, c1);
      return `M${p.x},${p.y}L${q.x},${q.y}`;
    };
    const summaries = groups.map((g) => (g.small ? undefined : summaryOf(g, props)));
    let best: { index: number; median: number } | undefined;

    groups.forEach((group, g) => {
      const c = frame.centre(g);
      const s = summaries[g];
      const cell = (k: number) => (rows ? { column: k, row: g } : { column: g, row: k });
      if (!s) {
        // Too few for a box: every observation is a point; one stop names the group.
        for (const value of group.sorted) {
          const p = at(v(value), c);
          strokes.push({ d: circlePath(p.x, p.y, POINT_RADIUS), role: 'encoding', part: 'ink' });
        }
        const middle = group.sorted[Math.floor((group.sorted.length - 1) / 2)] ?? 0;
        const p = at(v(middle), c);
        hitAreas.push({ seriesKey: 'median', index: g, datum: Object.freeze({ group: group.name, values: Object.freeze([...group.sorted]) }), value: middle, x: p.x, y: p.y, cell: cell(0) });
        return;
      }
      const low = v(s.q1);
      const high = v(s.q3);
      const lo = Math.min(low, high);
      const box = rows ? { x: lo, y: c - half, width: Math.abs(high - low), height: 2 * half } : { x: c - half, y: lo, width: 2 * half, height: Math.abs(high - low) };
      strokes.push({ d: rectPath(box), role: 'encoding', part: 'ink', tone: 1 });
      strokes.push({ d: segment(v(s.median), c - half, v(s.median), c + half), role: 'encoding', part: 'ink', weight: 2 });
      // Whiskers out to the extreme observations inside the fences, each with its cap.
      for (const [from, to] of [[s.q3, s.max], [s.q1, s.min]] as const) {
        strokes.push({ d: segment(v(from), c, v(to), c) + segment(v(to), c - half / 2, v(to), c + half / 2), role: 'encoding', part: 'ink' });
      }
      const m = at(v(s.median), c);
      const whiskerLow = at(v(s.min), c - half);
      const whiskerHigh = at(v(s.max), c + half);
      hitAreas.push({
        seriesKey: 'median',
        index: g,
        datum: Object.freeze({ group: group.name, min: s.min, q1: s.q1, median: s.median, q3: s.q3, max: s.max, outliers: Object.freeze([...s.outliers]) }),
        value: s.median,
        x: m.x,
        y: m.y,
        box: { x: Math.min(whiskerLow.x, whiskerHigh.x), y: Math.min(whiskerLow.y, whiskerHigh.y), width: Math.abs(whiskerHigh.x - whiskerLow.x), height: Math.abs(whiskerHigh.y - whiskerLow.y) },
        cell: cell(0),
      });
      if (showOutliers) {
        s.outliers.forEach((value, k) => {
          const p = at(v(value), c);
          strokes.push({ d: circlePath(p.x, p.y, POINT_RADIUS), role: 'encoding', part: 'ink' });
          hitAreas.push({ seriesKey: 'outliers', index: g, datum: Object.freeze({ group: group.name, value }), value, x: p.x, y: p.y, cell: cell(k + 1) });
        });
      }
      if (!best || s.median > best.median) best = { index: g, median: s.median };
    });

    // One heightened element (REQ-442): the highest median, on its line.
    const raised = best ? hitAreas.find((h) => h.seriesKey === 'median' && h.index === best?.index) : hitAreas[0];
    if (raised) {
      const mark = circlePath(raised.x, raised.y, HEIGHTEN_RADIUS);
      strokes.push({ d: mark, role: 'encoding', part: 'heighten', paint: 'fill' });
      strokes.push({ d: mark, role: 'encoding', part: 'ink', paint: 'stroke' });
    }
    const whisker = whiskerOf(props);
    const medians = groups.map((g, i) => `${g.name} median ${summaries[i] ? format(summaries[i].median) : 'not drawn, too few observations'}`).join(', ');
    return { plot: frame.plot, strokes, labels: frame.labels, hitAreas, summary: `quartiles by linear interpolation, Tukey whiskers at ${format(whisker)} IQR; ${medians}` };
  },
};

function buildBoxPlotChart(props: BoxPlotChartProps, context: RecipeContext): ChartModel {
  return buildDistribution(family, props, context);
}

/** `BoxPlotChart` recipe (REQ-402): quartiles, median, Tukey whiskers and outliers per group. */
export const boxPlotChart: ChartRecipe<BoxPlotChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildBoxPlotChart });
