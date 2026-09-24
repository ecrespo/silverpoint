import type { ActivityGridProps, ChartModel, ChartRecipe, Datum, HitArea, RecipeContext, Stroke, TextLabel, ToneLevel } from '../../types';
import { cardLayout } from '../shared/card';
import { finite, inset, rectPath, toneLevel, warnValue } from '../shared/cells';
import { isoDate, parseIsoDate } from '../shared/dates';
import { accessorName, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { ACTIVITY_GRID_DEMO } from './demo';

const CHART = 'ActivityGrid';
const PLOT_INSET = 6;
/** Room above the grid for the month labels. */
const MONTH_BAND = 14;
const DEFAULT_WEEKS = 26;
const DAY_MS = 86_400_000;
/**
 * The side of a cell, as a share of its slot, for each level: the level is carried by size as
 * well as by tone, so it survives `precision` mode, which draws no hatching (REQ-124).
 */
const CELL_SCALE: Readonly<Record<ToneLevel, number>> = { 0: 0.4, 1: 0.55, 2: 0.7, 3: 0.85, 4: 1 };
const CELL_FILL = 0.86;
/** Fewest columns between two month labels. */
const MONTH_GAP = 3;

interface Day {
  readonly datum: Datum;
  readonly day: number;
  readonly count: number | undefined;
  readonly level: ToneLevel;
}

function buildActivityGrid(props: ActivityGridProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? ACTIVITY_GRID_DEMO;
  const dateKey = usesDemo ? 'date' : (props.dateKey ?? 'date');
  const countKey = usesDemo ? 'count' : (props.countKey ?? 'count');
  const levelKey = usesDemo ? 'level' : (props.levelKey ?? 'level');
  const weeks = props.weeks !== undefined && Number.isInteger(props.weeks) && props.weeks > 0 ? props.weeks : DEFAULT_WEEKS;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const countName = accessorName(countKey, 'count');
  const levelName = accessorName(levelKey, 'level');

  const parsed: Day[] = [];
  data.forEach((datum, index) => {
    const day = parseIsoDate(String(read(dateKey, datum, index)));
    if (Number.isNaN(day)) {
      warnValue(CHART, accessorName(dateKey, 'date'), `Row ${index} is not an ISO date; it is omitted.`);
      return;
    }
    const raw = finite(read(levelKey, datum, index));
    const level = raw === undefined ? 0 : toneLevel(raw);
    if (raw !== level) warnValue(CHART, levelName, `Row ${index} has level ${String(raw)}; it is drawn at level ${level}.`);
    parsed.push({ datum, day, count: finite(read(countKey, datum, index)), level });
  });
  // The grid runs forward in time whatever order the rows came in.
  let days = [...parsed].sort((a, b) => a.day - b.day);
  // Whole weeks only (Data Model §2.8): the oldest days of a partial week are trimmed.
  const partial = days.length % 7;
  if (partial > 0) {
    warnValue(CHART, 'data', `${days.length} days are not whole weeks; the oldest ${partial} are omitted.`);
    days = days.slice(partial);
  }
  days = days.slice(-weeks * 7);

  const base = modelBase(CHART, props, context, 'Activity grid', {
    columns: [accessorName(dateKey, 'date'), countName, levelName],
    rows: days.map((d) => [isoDate(d.day), formatValue(d.count, locale, numberFormat), String(d.level)]),
  });

  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = inset(card.area, PLOT_INSET);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (days.length === 0) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  const columns = days.length / 7;
  const slot = Math.min(plot.width / columns, (plot.height - MONTH_BAND) / 7);
  const top = plot.y + MONTH_BAND;
  const month = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  // A month label names the first column that starts in it; two closer than MONTH_GAP columns
  // would collide, so a leading partial month gives way to the next, and any other newcomer waits.
  const months: { column: number; name: string }[] = [];

  days.forEach((d, index) => {
    const column = Math.floor(index / 7);
    const row = index % 7;
    if (row === 0) {
      const name = month.format(new Date(d.day * DAY_MS));
      const last = months.at(-1);
      if (name !== last?.name) {
        if (last && column - last.column < MONTH_GAP) {
          if (months.length === 1) months[0] = { column, name };
        } else {
          months.push({ column, name });
        }
      }
    }
    const side = slot * CELL_FILL * CELL_SCALE[d.level];
    const cx = plot.x + column * slot + slot / 2;
    const cy = top + row * slot + slot / 2;
    const cell = { x: cx - side / 2, y: cy - side / 2, width: side, height: side };
    strokes.push({ d: rectPath(cell), role: 'encoding', part: 'ink', ...(d.level > 0 ? { tone: d.level } : {}) });
    hitAreas.push({ seriesKey: countName, index, datum: d.datum, value: d.count ?? 0, x: cx, y: cy, box: cell });
  });

  for (const { column, name } of months) {
    labels.push({ x: plot.x + column * slot, y: plot.y + 10, text: name, kind: 'tick', part: 'axis', anchor: 'start' });
  }

  const total = days.reduce((sum, d) => sum + (d.count ?? 0), 0);
  const active = days.filter((d) => d.level > 0).length;
  const description =
    props.description ??
    `${base.name}. Activity grid of ${columns} weeks, ${isoDate(days[0]!.day)} to ${isoDate(days[days.length - 1]!.day)}; ${formatNumber(total, locale, numberFormat)} in total, active on ${active} of ${days.length} days.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `ActivityGrid` recipe (REQ-087): one cell per day, a column per week, sized and toned by level. */
export const activityGrid: ChartRecipe<ActivityGridProps> = /* @__PURE__ */ Object.freeze({
  name: CHART,
  build: buildActivityGrid,
});
