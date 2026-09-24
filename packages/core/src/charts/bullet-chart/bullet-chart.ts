import type { BulletChartProps, ChartModel, ChartRecipe, HitArea, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { finite, inset, rectPath, warnValue } from '../shared/cells';
import { accessorName, formatCategory, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { BULLET_CHART_DEMO } from './demo';

const CHART = 'BulletChart';
const PLOT_INSET = 6;
const MAX_BAR = 12;
/** How far the target marker reaches past the bar, above and below. */
const MARKER_REACH = 3;

/** Holds a value to the 0-100 track, warning when it had to (Data Model §2.9). */
function clampPercent(value: number, property: string, row: number): number {
  if (value >= 0 && value <= 100) return value;
  warnValue(CHART, property, `Row ${row} is ${value}; it is drawn at the nearest end of 0-100.`);
  return Math.min(Math.max(value, 0), 100);
}

function buildBulletChart(props: BulletChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? BULLET_CHART_DEMO;
  const titleKey = usesDemo ? 'title' : (props.titleKey ?? 'title');
  const actualKey = usesDemo ? 'actual' : (props.actualKey ?? 'actual');
  const targetKey = usesDemo ? 'target' : (props.targetKey ?? 'target');
  const { locale } = context;
  const numberFormat = props.numberFormat;

  const rows = data.map((datum, index) => ({
    index,
    datum,
    title: formatCategory(read(titleKey, datum, index), locale),
    actual: finite(read(actualKey, datum, index)),
    target: finite(read(targetKey, datum, index)),
  }));
  const actualName = accessorName(actualKey, 'actual');
  const targetName = accessorName(targetKey, 'target');

  const base = modelBase(CHART, props, context, 'Bullet chart', {
    columns: [accessorName(titleKey, 'title'), actualName, targetName],
    rows: rows.map((r) => [r.title, formatValue(r.actual, locale, numberFormat), formatValue(r.target, locale, numberFormat)]),
  });

  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = inset(card.area, PLOT_INSET);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (rows.length === 0) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, true);
  }

  const rowHeight = plot.height / rows.length;
  const barHeight = Math.min(MAX_BAR, rowHeight * 0.35);
  const at = (percent: number) => plot.x + (percent / 100) * plot.width;
  let met = 0;

  for (const row of rows) {
    const top = plot.y + row.index * rowHeight;
    const barY = top + rowHeight - barHeight - Math.min(MARKER_REACH + 1, rowHeight * 0.1);
    const baseline = barY - 5;
    labels.push({ x: plot.x, y: baseline, text: row.title, kind: 'tick', part: 'text', anchor: 'start' });
    strokes.push({ d: rectPath({ x: plot.x, y: barY, width: plot.width, height: barHeight }), role: 'ornament', part: 'rule' });

    if (row.actual === undefined) {
      warnValue(CHART, actualName, `Row ${row.index} has no finite value; its bar is omitted.`);
    } else {
      const actual = clampPercent(row.actual, actualName, row.index);
      const bar = { x: plot.x, y: barY, width: at(actual) - plot.x, height: barHeight };
      if (bar.width > 0) strokes.push({ d: rectPath(bar), role: 'encoding', part: 'ink', tone: 2 });
      labels.push({ x: plot.x + plot.width, y: baseline, text: formatNumber(row.actual, locale, numberFormat), kind: 'tick', part: 'axis', anchor: 'end' });
      hitAreas.push({ seriesKey: actualName, index: row.index, datum: row.datum, value: row.actual, x: at(actual), y: barY + barHeight / 2, box: bar });
      if (row.target !== undefined && row.actual >= row.target) met += 1;
    }

    if (row.target === undefined) {
      warnValue(CHART, targetName, `Row ${row.index} has no finite target; its marker is omitted.`);
    } else {
      const x = at(clampPercent(row.target, targetName, row.index));
      strokes.push({ d: `M${x},${barY - MARKER_REACH}V${barY + barHeight + MARKER_REACH}`, role: 'encoding', part: 'ink', weight: 2 });
    }
  }

  const description =
    props.description ?? `${base.name}. Bullet chart of ${rows.length} targets on a 0 to 100 scale; ${met} of ${rows.length} reach their target.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `BulletChart` recipe (REQ-069): a bar to the actual value and a marker at the target, on 0-100. */
export const bulletChart: ChartRecipe<BulletChartProps> = /* @__PURE__ */ Object.freeze({
  name: CHART,
  build: buildBulletChart,
});
