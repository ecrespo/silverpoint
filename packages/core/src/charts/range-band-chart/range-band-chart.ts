import { area, line } from 'd3-shape';
import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, Datum, HitArea, RangeBandChartProps, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { cartesianPlot, categoryAxis, categoryLabels, checkVolume, valueAxis, type Series } from '../shared/cartesian';
import { finite, warnValue } from '../shared/cells';
import { CURVES } from '../shared/curves';
import { accessorName, formatCategory, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { RANGE_BAND_CHART_DEMO } from './demo';

const CHART = 'RangeBandChart';

interface Span {
  readonly index: number;
  readonly datum: Datum;
  readonly low: number | undefined;
  readonly high: number | undefined;
}

function buildRangeBandChart(props: RangeBandChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? RANGE_BAND_CHART_DEMO;
  const xKey = usesDemo ? 'x' : (props.xKey ?? 'x');
  const lowKey = usesDemo ? 'low' : (props.lowKey ?? 'low');
  const highKey = usesDemo ? 'high' : (props.highKey ?? 'high');
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const lowName = accessorName(lowKey, 'low');
  const highName = accessorName(highKey, 'high');

  let swapped = 0;
  let missing = 0;
  const spans: Span[] = data.map((datum, index) => {
    let low = finite(read(lowKey, datum, index));
    let high = finite(read(highKey, datum, index));
    if (low === undefined || high === undefined) {
      missing += 1;
      return { index, datum, low: undefined, high: undefined };
    }
    // Data Model §2.1: low ≤ high per row; a reversed row is swapped, and warned.
    if (low > high) {
      [low, high] = [high, low];
      swapped += 1;
    }
    return { index, datum, low, high };
  });
  const asSeries = (key: string, pick: (s: Span) => number | undefined): Series => ({
    key,
    points: spans.map((s) => ({ index: s.index, datum: s.datum, value: pick(s) })),
    missing,
  });
  checkVolume(CHART, [asSeries(lowName, (s) => s.low)]);
  const xName = accessorName(xKey, 'x');
  const xValues = data.map((datum, index) => read(xKey, datum, index));
  const xLabels = xValues.map((value) => formatCategory(value, locale));

  const base = modelBase(CHART, props, context, 'Range band', {
    columns: [xName, lowName, highName],
    rows: spans.map((s, i) => [xLabels[i] ?? '', formatValue(s.low, locale, numberFormat), formatValue(s.high, locale, numberFormat)]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = cartesianPlot(card.area);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (swapped > 0) warnValue(CHART, lowName, `${swapped} rows had ${lowName} above ${highName}; they are swapped.`);
  if (missing > 0 && data.length > 0) warnValue(CHART, lowName, `${missing} of ${data.length} rows lack a finite ${lowName} or ${highName}; the band breaks there.`);
  const range = extent(spans.flatMap((s) => (s.low === undefined || s.high === undefined ? [] : [s.low, s.high])));
  if (data.length === 0 || range === undefined) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  const axis = valueAxis(plot, range, { chart: CHART, property: highName, padding: context.domainPadding, locale, numberFormat, zero: false });
  const y = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  const xAt = categoryAxis(xValues, plot, { chart: CHART, property: xName, padding: context.domainPadding }).at;
  const curve = CURVES.monotone;
  const defined = (s: Span) => s.low !== undefined;

  const band = area<Span>().defined(defined).x((s) => xAt(s.index)).y0((s) => y(s.low ?? 0)).y1((s) => y(s.high ?? 0)).curve(curve)(spans);
  // The band is hatched only: its edges are the two lines below, and an outline would hide the dots.
  if (band) strokes.push({ d: band, role: 'encoding', part: 'ink-secondary', paint: 'none', tone: 1 });
  // Both edges are drawn exactly: the high one solid, the low one dotted (REQ-124).
  const edge = (pick: (s: Span) => number) => line<Span>().defined(defined).x((s) => xAt(s.index)).y((s) => y(pick(s))).curve(curve)(spans);
  const high = edge((s) => s.high ?? 0);
  const low = edge((s) => s.low ?? 0);
  if (high) strokes.push({ d: high, role: 'encoding', part: 'ink' });
  if (low) strokes.push({ d: low, role: 'encoding', part: 'ink', dash: 'dotted' });

  for (const [row, key, pick] of [[0, lowName, (s: Span) => s.low], [1, highName, (s: Span) => s.high]] as const) {
    for (const s of spans) {
      const value = pick(s);
      if (value === undefined) continue;
      hitAreas.push({ seriesKey: key, index: s.index, datum: s.datum, value, x: xAt(s.index), y: y(value), cell: { column: s.index, row } });
    }
  }
  labels.push(...categoryLabels(xLabels, xAt, card.area, plot));

  const description =
    props.description ??
    `${base.name}. Range band over ${data.length} ${xName} values, from a lowest ${lowName} of ${formatNumber(range[0], locale, numberFormat)} to a highest ${highName} of ${formatNumber(range[1], locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `RangeBandChart` recipe (REQ-073): the band between a low and a high series. */
export const rangeBandChart: ChartRecipe<RangeBandChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildRangeBandChart });
