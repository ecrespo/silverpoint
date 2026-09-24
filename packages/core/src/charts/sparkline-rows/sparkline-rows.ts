import { line } from 'd3-shape';
import type { ChartModel, ChartRecipe, Datum, HitArea, RecipeContext, SparklineRowsProps, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { checkCount } from '../shared/cartesian';
import { finite, inset, warnValue } from '../shared/cells';
import { CURVES } from '../shared/curves';
import { accessorName, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { SPARKLINE_ROWS_DEMO } from './demo';

const CHART = 'SparklineRows';
const PLOT_INSET = 6;
const NAME_COLUMN = 64;
const READOUT_COLUMN = 52;
/** Room above and below each sparkline inside its row. */
const ROW_PAD = 4;

/** A point's value: through `pointKey`, else the point itself when a number, else its `value`. */
function pointValue(point: unknown, index: number, pointKey: SparklineRowsProps['pointKey']): number | undefined {
  if (pointKey !== undefined) return typeof point === 'object' && point !== null ? finite(read(pointKey, point as Datum, index)) : undefined;
  if (typeof point === 'number') return finite(point);
  return typeof point === 'object' && point !== null ? finite((point as Datum).value) : undefined;
}

function buildSparklineRows(props: SparklineRowsProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const all = props.data ?? SPARKLINE_ROWS_DEMO;
  const data = props.rows !== undefined && Number.isInteger(props.rows) && props.rows >= 0 ? all.slice(0, props.rows) : all;
  const nameKey = usesDemo ? 'name' : (props.nameKey ?? 'name');
  const readoutKey = usesDemo ? 'readout' : (props.readoutKey ?? 'readout');
  const seriesKey = usesDemo ? 'points' : (props.seriesKey ?? 'points');
  const pointKey = usesDemo ? undefined : props.pointKey;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const readoutName = accessorName(readoutKey, 'readout');

  const rows = data.map((datum, index) => {
    const raw = read(seriesKey, datum, index);
    const points = Array.isArray(raw) ? (raw as readonly unknown[]).map((p, i) => pointValue(p, i, pointKey)) : [];
    const values = points.flatMap((v) => (v === undefined ? [] : [v]));
    const given = read(readoutKey, datum, index);
    const last = [...points].reverse().find((v) => v !== undefined);
    return {
      index,
      datum,
      name: formatValue(read(nameKey, datum, index), locale, undefined),
      points,
      values,
      last,
      readout: given !== undefined && given !== null ? formatValue(given, locale, numberFormat) : last === undefined ? '—' : formatNumber(last, locale, numberFormat),
    };
  });
  for (const row of rows) checkCount(CHART, row.name, row.points.length);

  const base = modelBase(CHART, props, context, 'Sparkline rows', {
    columns: [accessorName(nameKey, 'name'), readoutName],
    rows: rows.map((r) => [r.name, r.readout]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = inset(card.area, PLOT_INSET);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (rows.length === 0 || rows.every((r) => r.values.length === 0)) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, rows.length === 0);
  }

  const rowHeight = plot.height / rows.length;
  const longest = Math.max(...rows.map((r) => r.points.length));
  const lineX = plot.x + NAME_COLUMN;
  const lineWidth = Math.max(plot.width - NAME_COLUMN - READOUT_COLUMN, 1);
  const xAt = (i: number) => (longest > 1 ? lineX + (i / (longest - 1)) * lineWidth : lineX + lineWidth / 2);

  for (const row of rows) {
    const band = { x: plot.x, y: plot.y + row.index * rowHeight, width: plot.width, height: rowHeight };
    const baseline = band.y + rowHeight / 2 + 4;
    // The name and the readout are printed; the sparkline is the shape of the series (REQ-124).
    labels.push({ x: plot.x, y: baseline, text: row.name, kind: 'tick', part: 'text', anchor: 'start' });
    labels.push({ x: plot.x + plot.width, y: baseline, text: row.readout, kind: 'tick', part: 'text', anchor: 'end' });
    if (row.values.length === 0) {
      warnValue(CHART, accessorName(seriesKey, 'points'), `Row ${row.index} (${row.name}) has no finite points; its sparkline is omitted.`);
      continue;
    }
    // Each row scales to its own range: the sparkline shows shape, the readout the value.
    const low = Math.min(...row.values);
    const high = Math.max(...row.values);
    const top = band.y + ROW_PAD;
    const span = Math.max(rowHeight - 2 * ROW_PAD, 1);
    const yAt = (v: number) => (high === low ? top + span / 2 : top + span - ((v - low) / (high - low)) * span);
    const indexed = row.points.map((value, i) => ({ value, i }));
    const d = line<(typeof indexed)[number]>().defined((p) => p.value !== undefined).x((p) => xAt(p.i)).y((p) => yAt(p.value ?? 0)).curve(CURVES.monotone)(indexed);
    if (d) strokes.push({ d, role: 'encoding', part: 'ink' });
    const lastIndex = row.points.lastIndexOf(row.last);
    hitAreas.push({ seriesKey: readoutName, index: row.index, datum: row.datum as Datum, value: row.last ?? 0, x: xAt(lastIndex), y: yAt(row.last ?? 0), box: band });
  }

  const description = props.description ?? `${base.name}. ${rows.length} rows: ${rows.map((r) => `${r.name} ${r.readout}`).join(', ')}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `SparklineRows` recipe (REQ-062): one row per series — name, sparkline, printed readout. */
export const sparklineRows: ChartRecipe<SparklineRowsProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildSparklineRows });
