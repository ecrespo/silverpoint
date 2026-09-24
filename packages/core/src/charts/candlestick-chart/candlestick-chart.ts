import { diagnose } from '../../diagnostics/diagnose';
import type { CandlestickChartProps, ChartModel, ChartRecipe, Datum, HitArea, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { cartesianPlot, categoryAxis, categoryLabels, checkCount, valueAxis } from '../shared/cartesian';
import { finite, rectPath, warnValue } from '../shared/cells';
import { accessorName, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { CANDLESTICK_CHART_DEMO } from './demo';

const CHART = 'CandlestickChart';
const BODY_FILL = 0.6;

interface Candle {
  readonly index: number;
  readonly datum: Datum;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

function buildCandlestickChart(props: CandlestickChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? CANDLESTICK_CHART_DEMO;
  const timeKey = usesDemo ? 'time' : (props.timeKey ?? 'time');
  const keys = {
    open: usesDemo ? 'open' : (props.openKey ?? 'open'),
    high: usesDemo ? 'high' : (props.highKey ?? 'high'),
    low: usesDemo ? 'low' : (props.lowKey ?? 'low'),
    close: usesDemo ? 'close' : (props.closeKey ?? 'close'),
  };
  const names = { open: accessorName(keys.open, 'open'), high: accessorName(keys.high, 'high'), low: accessorName(keys.low, 'low'), close: accessorName(keys.close, 'close') };
  const { locale } = context;
  const numberFormat = props.numberFormat;
  checkCount(CHART, names.close, data.length);

  // Data Model §2.6: low ≤ min(open, close) and max(open, close) ≤ high, or the row is dropped.
  const candles: Candle[] = [];
  data.forEach((datum, index) => {
    const [open, high, low, close] = (['open', 'high', 'low', 'close'] as const).map((k) => finite(read(keys[k], datum, index)));
    if (open === undefined || high === undefined || low === undefined || close === undefined) {
      warnValue(CHART, names.close, `Row ${index} lacks a finite open, high, low or close; it is omitted.`);
      return;
    }
    if (!(low <= Math.min(open, close) && Math.max(open, close) <= high)) {
      warnValue(CHART, names.high, `Row ${index} breaks low ≤ min(open, close) ≤ max(open, close) ≤ high; it is omitted.`);
      return;
    }
    candles.push({ index, datum, open, high, low, close });
  });
  const timeName = accessorName(timeKey, 'time');
  const timeLabels = data.map((datum, index) => formatValue(read(timeKey, datum, index), locale, undefined));

  const base = modelBase(CHART, props, context, 'Candlestick chart', {
    columns: [timeName, names.open, names.high, names.low, names.close],
    rows: data.map((datum, index) => [timeLabels[index] ?? '', ...(['open', 'high', 'low', 'close'] as const).map((k) => formatValue(finite(read(keys[k], datum, index)), locale, numberFormat))]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = cartesianPlot(card.area);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  const pinned = props.bounds && Number.isFinite(props.bounds[0]) && Number.isFinite(props.bounds[1]) && props.bounds[0] < props.bounds[1] ? props.bounds : undefined;
  if (data.length === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, true);
  if (candles.length === 0) {
    // REQ-097: with no valid row there is nothing to derive the price bounds from.
    if (!pinned) diagnose('SP009', CHART, { property: 'bounds', message: `None of the ${data.length} rows is a valid candle.` });
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, false);
  }

  // REQ-097: the price bounds are `bounds` when given, else the lowest low and the highest high.
  const bounds = pinned ?? [Math.min(...candles.map((c) => c.low)), Math.max(...candles.map((c) => c.high))];
  const axis = valueAxis(plot, bounds, { chart: CHART, property: 'bounds', padding: context.domainPadding, locale, numberFormat, zero: false, nice: !pinned });
  const y = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  const slots = categoryAxis(timeLabels, plot, { chart: CHART, property: timeName, padding: context.domainPadding, numeric: false, paddingInner: 0.25, paddingOuter: 0.1 });
  const width = slots.bandwidth * BODY_FILL;

  for (const c of candles) {
    const x = slots.at(c.index);
    strokes.push({ d: `M${x},${y(c.high)}V${y(c.low)}`, role: 'encoding', part: 'ink' });
    const top = y(Math.max(c.open, c.close));
    const body = { x: x - width / 2, y: top, width, height: y(Math.min(c.open, c.close)) - top };
    // A rising candle is hollow and a falling one solid: the fill, not a hatch, tells them apart (REQ-124).
    if (body.height > 0) {
      strokes.push(c.close >= c.open ? { d: rectPath(body), role: 'encoding', part: 'ink' } : { d: rectPath(body), role: 'encoding', part: 'ink', paint: 'fill' });
    } else {
      strokes.push({ d: `M${body.x},${top}H${body.x + width}`, role: 'encoding', part: 'ink' });
    }
    hitAreas.push({
      seriesKey: names.close,
      index: c.index,
      datum: c.datum,
      value: c.close,
      x,
      y: y(c.close),
      box: { x: x - slots.bandwidth / 2, y: y(c.high), width: slots.bandwidth, height: y(c.low) - y(c.high) },
    });
  }
  labels.push(...categoryLabels(timeLabels, slots.at, card.area, plot));

  const rising = candles.filter((c) => c.close >= c.open).length;
  const description =
    props.description ??
    `${base.name}. Candlestick chart of ${candles.length} sessions, prices from ${formatNumber(bounds[0], locale, numberFormat)} to ${formatNumber(bounds[1], locale, numberFormat)}${
      pinned ? ' (pinned bounds)' : ', from the lowest low to the highest high'
    }; ${rising} rise and ${candles.length - rising} fall.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `CandlestickChart` recipe (REQ-071): OHLC bodies and wicks, bounds derived or pinned (REQ-097). */
export const candlestickChart: ChartRecipe<CandlestickChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildCandlestickChart });
