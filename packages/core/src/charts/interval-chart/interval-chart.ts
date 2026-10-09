import { linearScale } from '../../scales/scales';
import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, HitArea, IntervalChartProps, Rect, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { AXIS_BAND, PLOT_INSET, TICK_CHAR, pillPath } from '../shared/cartesian';
import { checkCeiling, readIntervals, type IntervalRow } from '../shared/contracts';
import { isoDate } from '../shared/dates';
import { accessorName, fitText, formatNumber } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { INTERVAL_CHART_DEMO, INTERVAL_CHART_DEMO_KEYS } from './demo';

const CHART = 'IntervalChart';
/** Room at the left for the lane names. */
const ROW_LABELS = 72;
/** Height of a pill as a share of its track, and the most it may be. */
const PILL_FILL = 0.7;
const PILL_MAX = 14;
/** An interval that starts where it ends is drawn this wide, centred. */
const MIN_WIDTH = 3;

/**
 * Tracks within a lane, so overlapping intervals never cover each other: in start order, each
 * takes the first track whose last interval has ended before it starts.
 */
function tracksOf(rows: readonly IntervalRow[]): { track: number[]; count: number } {
  const order = rows.map((r, i) => [r, i] as const).sort((a, b) => a[0].start - b[0].start || a[1] - b[1]);
  const ends: number[] = [];
  const track = new Array<number>(rows.length);
  for (const [r, i] of order) {
    let t = ends.findIndex((end) => end <= r.start);
    if (t < 0) t = ends.push(r.end) - 1;
    else ends[t] = r.end;
    track[i] = t;
  }
  return { track, count: Math.max(ends.length, 1) };
}

function buildIntervalChart(props: IntervalChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? INTERVAL_CHART_DEMO;
  const laneKey = usesDemo ? INTERVAL_CHART_DEMO_KEYS.laneKey : (props.laneKey ?? 'lane');
  const startKey = usesDemo ? INTERVAL_CHART_DEMO_KEYS.startKey : (props.startKey ?? 'start');
  const endKey = usesDemo ? INTERVAL_CHART_DEMO_KEYS.endKey : (props.endKey ?? 'end');
  const labelKey = usesDemo ? INTERVAL_CHART_DEMO_KEYS.labelKey : props.labelKey;
  const axisKind = usesDemo ? INTERVAL_CHART_DEMO_KEYS.axis : (props.axis ?? 'number');
  const dates = axisKind === 'date';
  const { locale } = context;
  const numberFormat = props.numberFormat;
  // A date axis prints ISO days, never through the host's time zone or locale (REQ-103).
  const at = (value: number) => (dates ? isoDate(value) : formatNumber(value, locale, numberFormat));
  const tick = (value: number) => (dates ? isoDate(value).slice(5) : formatNumber(value, locale, numberFormat));
  const laneName = accessorName(laneKey, 'lane');

  const { rows: intervals, lanes } = readIntervals(CHART, data, { lane: laneKey, start: startKey, end: endKey, ...(labelKey === undefined ? {} : { label: labelKey }) }, dates ? 'date' : 'number');
  checkCeiling(CHART, laneName, 'intervals', intervals.length);
  const base = modelBase(CHART, props, context, 'Interval chart', {
    columns: [...(labelKey === undefined ? [] : [accessorName(labelKey, 'label')]), laneName, accessorName(startKey, 'start'), accessorName(endKey, 'end'), 'length'],
    rows: intervals.map((r) => [...(labelKey === undefined ? [] : [r.label ?? '—']), r.lane, at(r.start), at(r.end), formatNumber(r.end - r.start, locale, numberFormat)]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const area = card.area;
  const plot: Rect = { x: area.x + ROW_LABELS, y: area.y + PLOT_INSET, width: Math.max(area.width - ROW_LABELS - PLOT_INSET, 1), height: Math.max(area.height - AXIS_BAND - PLOT_INSET, 1) };
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  const range = extent(intervals.flatMap((r) => [r.start, r.end]));
  if (range === undefined) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const right = plot.x + plot.width;
  const x = linearScale(range, [plot.x, right], { chart: CHART, property: accessorName(startKey, 'start'), padding: context.domainPadding, nice: !dates });
  for (const t of x.ticks(4)) {
    if (dates && !Number.isInteger(t)) continue;
    strokes.push({ d: `M${x(t)},${plot.y}V${plot.y + plot.height}`, role: 'ornament', part: 'grid' });
    labels.push({ x: x(t), y: area.y + area.height - 5, text: tick(t), kind: 'tick', part: 'axis', anchor: 'middle' });
  }
  const laneHeight = plot.height / lanes.length;
  const pills: string[] = [];
  lanes.forEach((lane, l) => {
    const top = plot.y + l * laneHeight;
    strokes.push({ d: `M${plot.x},${top + laneHeight}H${right}`, role: 'ornament', part: 'rule' });
    labels.push({ x: area.x + PLOT_INSET, y: top + laneHeight / 2 + 4, text: fitText(lane, ROW_LABELS - PLOT_INSET - 6), kind: 'tick', part: 'axis', anchor: 'start' });
    const members = intervals.map((r, i) => [r, i] as const).filter(([r]) => r.lane === lane);
    const { track, count } = tracksOf(members.map(([r]) => r));
    const trackHeight = laneHeight / count;
    const height = Math.min(trackHeight * PILL_FILL, PILL_MAX);
    members.forEach(([r, i], k) => {
      const centre = top + trackHeight * ((track[k] as number) + 0.5);
      let x0 = x(r.start);
      let x1 = x(r.end);
      if (x1 - x0 < MIN_WIDTH) {
        const mid = (x0 + x1) / 2;
        x0 = mid - MIN_WIDTH / 2;
        x1 = mid + MIN_WIDTH / 2;
      }
      const box = { x: x0, y: centre - height / 2, width: x1 - x0, height };
      const d = pillPath(box);
      pills[i] = d;
      strokes.push({ d, role: 'encoding', part: 'ink', tone: 2 });
      hitAreas.push({
        seriesKey: 'length',
        index: i,
        datum: Object.freeze({ label: r.label ?? r.lane, lane: r.lane, start: r.start, end: r.end, length: r.end - r.start }),
        value: r.end - r.start,
        x: (x0 + x1) / 2,
        y: centre,
        box,
        cell: { column: k, row: l },
      });
      // The interval's own label inside it, when it fits (DD-035).
      if (r.label !== undefined && r.label.length * TICK_CHAR + 8 <= x1 - x0 && height >= 9) {
        labels.push({ x: (x0 + x1) / 2, y: centre + 3, text: r.label, kind: 'tick', part: 'text', anchor: 'middle' });
      }
    });
  });

  // One heightened element (REQ-442): the longest interval, the pill itself.
  let longest = 0;
  intervals.forEach((r, i) => {
    const best = intervals[longest] as IntervalRow;
    if (r.end - r.start > best.end - best.start) longest = i;
  });
  strokes.push({ d: pills[longest] as string, role: 'encoding', part: 'heighten', paint: 'fill' });

  const best = intervals[longest] as IntervalRow;
  const description =
    props.description ??
    `${base.name}. ${intervals.length} intervals on ${lanes.length} ${laneName} lanes, from ${at(range[0])} to ${at(range[1])}${dates ? ' (UTC days)' : ''}; the longest is ${best.label ?? best.lane}, ${formatNumber(best.end - best.start, locale, numberFormat)}${dates ? ' days' : ''}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `IntervalChart` recipe (REQ-411): floating bars from start to end on lanes. */
export const intervalChart: ChartRecipe<IntervalChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildIntervalChart });
