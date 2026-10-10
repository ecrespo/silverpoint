import type { ChartModel, ChartRecipe, HitArea, MarimekkoChartProps, Rect, RecipeContext, Stroke, TextLabel, ToneLevel } from '../../types';
import { cardLayout } from '../shared/card';
import { AXIS_BAND, PLOT_INSET, legend } from '../shared/cartesian';
import { rectPath, ringTone, warnValue } from '../shared/cells';
import { readMosaic } from '../shared/contracts';
import { accessorName, fitText, formatNumber } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { MARIMEKKO_CHART_DEMO, MARIMEKKO_CHART_DEMO_KEYS } from './demo';

const CHART = 'MarimekkoChart';
/** Room at the left for the share ticks. */
const TICKS = 30;
/** The gap between columns, in px: the columns' widths still sum to the plot's less the gaps. */
const GAP = 2;
const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 };

function buildMarimekkoChart(props: MarimekkoChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? MARIMEKKO_CHART_DEMO;
  const k = MARIMEKKO_CHART_DEMO_KEYS;
  const columnKey = usesDemo ? k.columnKey : (props.columnKey ?? 'column');
  const segmentKey = usesDemo ? k.segmentKey : (props.segmentKey ?? 'segment');
  const valueKey = usesDemo ? k.valueKey : (props.valueKey ?? 'value');
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const format = (v: number) => formatNumber(v, locale, numberFormat);
  const percent = (v: number) => formatNumber(v, locale, PERCENT);

  const mosaic = readMosaic(CHART, data, { column: columnKey, segment: segmentKey, value: valueKey });
  const totals = mosaic.values.map((row) => row.reduce((sum, v) => sum + v, 0));
  const grand = totals.reduce((sum, t) => sum + t, 0);
  const base = modelBase(CHART, props, context, 'Marimekko chart', {
    columns: [accessorName(columnKey, 'column'), ...mosaic.segments, 'total'],
    rows: mosaic.columns.map((column, c) => [column, ...(mosaic.values[c] ?? []).map(format), `${format(totals[c] as number)}, ${grand > 0 ? percent((totals[c] as number) / grand) : '—'}`]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  // The segments' legend names every segment above the plot (REQ-440): tone only repeats it.
  const tones = mosaic.segments.map((_, s) => ringTone(s, mosaic.segments.length));
  const key = legend(card.area, mosaic.segments.map((name, s) => ({ name, part: 'ink' as const, tone: tones[s] as ToneLevel })));
  const area = key.area;
  const plot: Rect = { x: area.x + TICKS, y: area.y + PLOT_INSET, width: Math.max(area.width - TICKS - PLOT_INSET, 1), height: Math.max(area.height - AXIS_BAND - PLOT_INSET, 1) };
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (mosaic.columns.length > 0 && grand <= 0) warnValue(CHART, accessorName(valueKey, 'value'), 'Every value is zero; a Marimekko has nothing to divide.');
  if (mosaic.columns.length === 0 || grand <= 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  strokes.push(...key.strokes);
  labels.push(...key.labels);

  // Both axes at 100 %: the share ticks of every column.
  for (const share of [0, 0.5, 1]) {
    const y = plot.y + plot.height * (1 - share);
    labels.push({ x: plot.x - 4, y: y + 3, text: percent(share), kind: 'tick', part: 'axis', anchor: 'end' });
  }
  const drawn = mosaic.columns.filter((_, c) => (totals[c] as number) > 0).length;
  const room = plot.width - GAP * Math.max(drawn - 1, 0);
  const cells: { d: string; value: number }[] = [];
  let x = plot.x;
  mosaic.columns.forEach((column, c) => {
    const total = totals[c] as number;
    if (total <= 0) return;
    const width = (room * total) / grand;
    // Segments top to bottom in their order; each one's height is its share of the column.
    let y = plot.y;
    mosaic.segments.forEach((segment, s) => {
      const value = (mosaic.values[c] as number[])[s] as number;
      if (value <= 0) return;
      const height = (plot.height * value) / total;
      const box = { x, y, width, height };
      const d = rectPath(box);
      strokes.push({ d, role: 'encoding', part: 'ink', tone: tones[s] as ToneLevel });
      cells.push({ d, value });
      hitAreas.push({
        seriesKey: segment,
        index: c,
        datum: Object.freeze({ column, segment, value, share: value / total, columnShare: total / grand }),
        value,
        x: x + width / 2,
        y: y + height / 2,
        box,
        cell: { column: c, row: s },
      });
      y += height;
    });
    labels.push({ x: x + width / 2, y: area.y + area.height - 5, text: fitText(`${column} ${percent(total / grand)}`, width), kind: 'tick', part: 'axis', anchor: 'middle' });
    x += width + GAP;
  });

  // One heightened element (REQ-442): the largest cell, the cell itself.
  const largest = cells.reduce((a, b) => (b.value > a.value ? b : a), cells[0] as { d: string; value: number });
  strokes.push({ d: largest.d, role: 'encoding', part: 'heighten', paint: 'fill' });

  const widest = mosaic.columns[totals.indexOf(Math.max(...totals))] ?? '';
  const description =
    props.description ??
    `${base.name}. Marimekko of ${mosaic.columns.length} columns by ${mosaic.segments.length} segments, totalling ${format(grand)}: each column is as wide as its share of the whole, each segment as tall as its share of the column. The widest column is ${widest}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `MarimekkoChart` recipe (REQ-415): column width ∝ total, segment height ∝ share, both axes at 100 %. */
export const marimekkoChart: ChartRecipe<MarimekkoChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildMarimekkoChart });
