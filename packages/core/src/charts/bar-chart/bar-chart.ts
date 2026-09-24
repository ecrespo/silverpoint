import { extent } from '../../scales/util';
import type { BarChartProps, ChartModel, ChartRecipe, HitArea, Rect, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import {
  AXIS_BAND,
  PLOT_INSET,
  cartesianPlot,
  categoryAxis,
  categoryLabels,
  checkVolume,
  horizontalValueAxis,
  legend,
  pillPath,
  readSeries,
  seriesValues,
  valueAxis,
} from '../shared/cartesian';
import { warnValue } from '../shared/cells';
import { accessorName, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { BAR_CHART_DEMO, BAR_CHART_DEMO_KEYS } from './demo';

const CHART = 'BarChart';
/** Room at the left for the category labels when bars run in rows. */
const ROW_LABELS = 56;
/** Share of a category's band the bars fill, together. */
const BAR_FILL = 0.7;

function buildBarChart(props: BarChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? BAR_CHART_DEMO;
  const xKey = usesDemo ? BAR_CHART_DEMO_KEYS.xKey : (props.xKey ?? 'x');
  const valueKey = usesDemo ? BAR_CHART_DEMO_KEYS.valueKey : (props.valueKey ?? 'value');
  const secondaryKey = usesDemo ? BAR_CHART_DEMO_KEYS.secondaryKey : props.secondaryKey;
  const rows = props.orientation === 'rows';
  const { locale } = context;
  const numberFormat = props.numberFormat;

  const series = [readSeries(data, valueKey, 'value'), ...(secondaryKey === undefined ? [] : [readSeries(data, secondaryKey, 'secondary')])];
  checkVolume(CHART, series);
  const xName = accessorName(xKey, 'x');
  const xValues = data.map((datum, index) => read(xKey, datum, index));
  const xLabels = xValues.map((value) => formatValue(value, locale, undefined));

  const base = modelBase(CHART, props, context, 'Bar chart', {
    columns: [xName, ...series.map((s) => s.key)],
    rows: data.map((_, i) => [xLabels[i] ?? '', ...series.map((s) => formatValue(s.points[i]?.value, locale, numberFormat))]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const paired = series.length > 1;
  const key = paired
    ? legend(card.area, series.map((s, i) => (i === 0 ? { name: s.key, part: 'ink' as const, tone: 2 as const } : { name: s.key, part: 'ink-secondary' as const, tone: 1 as const, dash: 'dotted' as const })))
    : { area: card.area, strokes: [], labels: [] };
  const area = key.area;
  const plot: Rect = rows
    ? { x: area.x + ROW_LABELS, y: area.y + PLOT_INSET, width: Math.max(area.width - ROW_LABELS - PLOT_INSET, 1), height: Math.max(area.height - AXIS_BAND - PLOT_INSET, 1) }
    : cartesianPlot(area);
  const strokes: Stroke[] = [...card.strokes, ...key.strokes];
  const labels: TextLabel[] = [...card.labels, ...key.labels];
  const hitAreas: HitArea[] = [];

  for (const s of series) if (s.missing > 0 && data.length > 0) warnValue(CHART, s.key, `${s.missing} of ${data.length} values are not finite; their bars are omitted.`);
  const range = extent(seriesValues(series));
  if (data.length === 0 || range === undefined) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  const axisOptions = { chart: CHART, property: series[0]?.key ?? 'value', padding: context.domainPadding, locale, numberFormat };
  const axis = rows ? horizontalValueAxis(plot, area, range, axisOptions) : valueAxis(plot, range, axisOptions);
  const v = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  // Categories run along x as columns, or down y as rows; either way a band per category.
  const along = rows ? { x: plot.y, y: plot.x, width: plot.height, height: plot.width } : plot;
  const categories = categoryAxis(xValues, along, { chart: CHART, property: xName, padding: context.domainPadding, numeric: false, paddingInner: 0.3, paddingOuter: 0.15 });
  const thickness = (categories.bandwidth * BAR_FILL) / series.length;

  series.forEach((s, k) => {
    for (const p of s.points) {
      if (p.value === undefined) continue;
      const centre = categories.at(p.index) - (categories.bandwidth * BAR_FILL) / 2 + thickness * (k + 0.5);
      const from = v(Math.min(0, p.value));
      const to = v(Math.max(0, p.value));
      const bar: Rect = rows
        ? { x: from, y: centre - thickness / 2, width: to - from, height: thickness }
        : { x: centre - thickness / 2, y: to, width: thickness, height: from - to };
      strokes.push({ d: pillPath(bar), role: 'encoding', part: k === 0 ? 'ink' : 'ink-secondary', tone: k === 0 ? 2 : 1, ...(k === 0 ? {} : { dash: 'dotted' as const }) });
      const end = v(p.value);
      hitAreas.push({
        seriesKey: s.key,
        index: p.index,
        datum: p.datum,
        value: p.value,
        x: rows ? end : centre,
        y: rows ? centre : end,
        box: bar,
        ...(paired ? { cell: rows ? { column: k, row: p.index } : { column: p.index, row: k } } : {}),
      });
    }
  });

  if (rows) {
    xLabels.forEach((text, i) => labels.push({ x: area.x + PLOT_INSET, y: categories.at(i) + 4, text, kind: 'tick', part: 'axis', anchor: 'start' }));
  } else {
    labels.push(...categoryLabels(xLabels, categories.at, area, plot));
  }

  const ranges = series.map((s) => {
    const r = extent(seriesValues([s]));
    return r ? `${s.key} from ${formatNumber(r[0], locale, numberFormat)} to ${formatNumber(r[1], locale, numberFormat)}` : `${s.key} has no values`;
  });
  const description =
    props.description ?? `${base.name}. Bar chart in ${rows ? 'rows' : 'columns'} of ${data.length} ${xName} values; ${ranges.join('; ')}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `BarChart` recipe (REQ-064): pill bars, columns or rows, with an optional second series. */
export const barChart: ChartRecipe<BarChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildBarChart });
