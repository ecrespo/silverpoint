import { area, line } from 'd3-shape';
import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, HitArea, RecipeContext, Stroke, StreamChartProps, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { cartesianPlot, categoryAxis, categoryLabels, checkVolume, legend, readSeries, valueAxis } from '../shared/cartesian';
import { warnValue } from '../shared/cells';
import { CURVES } from '../shared/curves';
import { accessorName, formatCategory, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { STREAM_CHART_DEMO, STREAM_CHART_DEMO_KEYS } from './demo';

const CHART = 'StreamChart';
/** A stream has two waves; the second is told apart by its dash (REQ-124). */
const WAVES = 2;

interface Wave {
  readonly key: string;
  /** Bottom and top of the wave at each row, or `undefined` in a gap. */
  readonly spans: readonly ({ readonly y0: number; readonly y1: number; readonly value: number } | undefined)[];
}

function buildStreamChart(props: StreamChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? STREAM_CHART_DEMO;
  const xKey = usesDemo ? 'x' : (props.xKey ?? 'x');
  const requested = usesDemo ? STREAM_CHART_DEMO_KEYS : (props.keys ?? STREAM_CHART_DEMO_KEYS);
  const keys = requested.slice(0, WAVES);
  const stacked = props.stacked ?? false;
  const { locale } = context;
  const numberFormat = props.numberFormat;

  const series = keys.map((key) => readSeries(data, key, key));
  checkVolume(CHART, series);
  const xName = accessorName(xKey, 'x');
  const xValues = data.map((datum, index) => read(xKey, datum, index));
  const xLabels = xValues.map((value) => formatCategory(value, locale));

  const base = modelBase(CHART, props, context, 'Stream chart', {
    columns: [xName, ...keys],
    rows: data.map((_, i) => [xLabels[i] ?? '', ...series.map((s) => formatValue(s.points[i]?.value, locale, numberFormat))]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const key = legend(card.area, keys.map((name, i) => (i === 0 ? { name, part: 'ink' as const, tone: 1 as const } : { name, part: 'ink-secondary' as const, tone: 2 as const, dash: 'dotted' as const })));
  const plot = cartesianPlot(key.area);
  const strokes: Stroke[] = [...card.strokes, ...key.strokes];
  const labels: TextLabel[] = [...card.labels, ...key.labels];
  const hitAreas: HitArea[] = [];

  if (requested.length > WAVES) warnValue(CHART, 'keys', `${requested.length} keys were given; a stream draws the first ${WAVES}.`);
  for (const s of series) if (s.missing > 0 && data.length > 0) warnValue(CHART, s.key, `${s.missing} of ${data.length} values are not finite; the wave breaks there.`);

  // Stacked, the second wave rides on the first; a negative value cannot stack and is held at zero.
  // Stacked, a wave has nothing to ride on where the one below is missing: it breaks there too.
  let clamped = 0;
  let unsupported = 0;
  const waves: Wave[] = series.map((s, w) => ({
    key: s.key,
    spans: s.points.map((p, i) => {
      if (p.value === undefined) return undefined;
      if (stacked && w > 0 && series[0]?.points[i]?.value === undefined) {
        unsupported += 1;
        return undefined;
      }
      let value = p.value;
      if (stacked && value < 0) {
        clamped += 1;
        value = 0;
      }
      const below = stacked && w > 0 ? Math.max(series[0]?.points[i]?.value ?? 0, 0) : 0;
      return { y0: below, y1: below + value, value: p.value };
    }),
  }));
  if (clamped > 0) warnValue(CHART, 'stacked', `${clamped} negative values cannot stack; they are drawn at zero.`);
  if (unsupported > 0) warnValue(CHART, 'stacked', `${unsupported} values have nothing below them to stack on; the upper wave breaks there.`);

  const range = extent(waves.flatMap((w) => w.spans.flatMap((s) => (s ? [s.y0, s.y1] : []))));
  if (data.length === 0 || range === undefined) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  const axis = valueAxis(plot, range, { chart: CHART, property: keys[0] ?? 'value', padding: context.domainPadding, locale, numberFormat });
  const y = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  const xAt = categoryAxis(xValues, plot, { chart: CHART, property: xName, padding: context.domainPadding }).at;
  const curve = CURVES.monotone;

  waves.forEach((wave, w) => {
    const indexed = wave.spans.map((span, index) => ({ span, index }));
    const defined = (e: (typeof indexed)[number]) => e.span !== undefined;
    const shape = area<(typeof indexed)[number]>().defined(defined).x((e) => xAt(e.index)).y0((e) => y(e.span?.y0 ?? 0)).y1((e) => y(e.span?.y1 ?? 0)).curve(curve)(indexed);
    const top = line<(typeof indexed)[number]>().defined(defined).x((e) => xAt(e.index)).y((e) => y(e.span?.y1 ?? 0)).curve(curve)(indexed);
    const part = w === 0 ? 'ink' : 'ink-secondary';
    // The wave is hatched only: its top line below is its edge, and an outline would hide the dots.
    if (shape) strokes.push({ d: shape, role: 'encoding', part, paint: 'none', tone: w === 0 ? 1 : 2 });
    if (top) strokes.push({ d: top, role: 'encoding', part, ...(w === 0 ? {} : { dash: 'dotted' as const }) });
    wave.spans.forEach((span, index) => {
      if (!span) return;
      const datum = data[index] ?? {};
      hitAreas.push({ seriesKey: wave.key, index, datum, value: span.value, x: xAt(index), y: y(span.y1), cell: { column: index, row: w } });
    });
  });
  labels.push(...categoryLabels(xLabels, xAt, key.area, plot));

  const totals = series.map((s) => `${s.key} totals ${formatNumber(s.points.reduce((sum, p) => sum + (p.value ?? 0), 0), locale, numberFormat)}`);
  const description =
    props.description ?? `${base.name}. ${stacked ? 'Stacked' : 'Overlaid'} stream of ${keys.length} waves over ${data.length} ${xName} values; ${totals.join('; ')}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `StreamChart` recipe (REQ-074): two waves, overlaid or stacked, told apart by dash and name. */
export const streamChart: ChartRecipe<StreamChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildStreamChart });
