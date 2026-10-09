import { curveBumpX, line } from 'd3-shape';
import type { BumpChartProps, ChartModel, ChartRecipe, HitArea, Rect, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { AXIS_BAND, PLOT_INSET, TICK_CHAR, categoryAxis, categoryLabels, spreadLabels } from '../shared/cartesian';
import { readRanked } from '../shared/contracts';
import { accessorName, circlePath, formatCategory } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { rank, type Rank } from '../shared/stats';
import { BUMP_CHART_DEMO, BUMP_CHART_DEMO_KEYS } from './demo';

const CHART = 'BumpChart';
const DOT_RADIUS = 3;
const HEIGHTEN_RADIUS = 3.5;
const NAME_GAP = 11;

interface Place {
  readonly x: number;
  readonly y: number;
  readonly rank: number;
  readonly value: number;
}

function buildBumpChart(props: BumpChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? BUMP_CHART_DEMO;
  const xKey = usesDemo ? BUMP_CHART_DEMO_KEYS.xKey : (props.xKey ?? 'x');
  const seriesKey = usesDemo ? BUMP_CHART_DEMO_KEYS.seriesKey : (props.seriesKey ?? 'series');
  const valueKey = usesDemo ? BUMP_CHART_DEMO_KEYS.valueKey : (props.valueKey ?? 'value');
  const order = props.order ?? 'descending';
  const { locale } = context;
  const xName = accessorName(xKey, 'x');

  const read = readRanked(CHART, data, { x: xKey, series: seriesKey, value: valueKey });
  const ranks = rank(read.rows, read.series, order);
  const xIndex = new Map(read.xs.map((x, i) => [`${typeof x}:${String(x)}`, i]));
  /** `places[series][x]`: where a series stands at each x, when it has a value there. */
  const at = new Map<string, (Rank & { value: number } | undefined)[]>(read.series.map((s) => [s, read.xs.map(() => undefined)]));
  read.rows.forEach((row, i) => {
    const list = at.get(row.series) as (Rank & { value: number } | undefined)[];
    list[xIndex.get(`${typeof row.x}:${String(row.x)}`) as number] = { ...(ranks[i] as Rank), value: row.value };
  });
  // Best-ranked first, at the last x each series reaches; `series` caps how many are drawn.
  const standing = (s: string) => {
    const list = at.get(s) ?? [];
    for (let i = list.length - 1; i >= 0; i -= 1) if (list[i]) return [read.xs.length - i, (list[i] as Rank).slot];
    return [Number.POSITIVE_INFINITY, 0];
  };
  const best = [...read.series].sort((a, b) => {
    const [ga, sa] = standing(a);
    const [gb, sb] = standing(b);
    return (ga as number) - (gb as number) || (sa as number) - (sb as number);
  });
  const cap = props.series !== undefined && Number.isInteger(props.series) && props.series > 0 ? props.series : best.length;
  const drawn = read.series.filter((s) => best.slice(0, cap).includes(s));
  const tied = (xi: number, r: number) => read.series.filter((s) => at.get(s)?.[xi]?.rank === r).length > 1;
  const rankText = (xi: number, s: string) => {
    const place = at.get(s)?.[xi];
    return place ? `${place.rank}${tied(xi, place.rank) ? '=' : ''}` : '—';
  };

  const xLabels = read.xs.map((x) => formatCategory(x, locale));
  const base = modelBase(CHART, props, context, 'Bump chart', {
    columns: [xName, ...drawn],
    rows: read.xs.map((_, xi) => [xLabels[xi] ?? '', ...drawn.map((s) => rankText(xi, s))]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const area = card.area;
  const room = Math.min(Math.max(0, ...drawn.map((s) => s.length * TICK_CHAR)) + 10, area.width / 4);
  const plot: Rect = { x: area.x + room, y: area.y + PLOT_INSET, width: Math.max(area.width - 2 * room, 1), height: Math.max(area.height - AXIS_BAND - PLOT_INSET, 1) };
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (read.rows.length === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const columns = categoryAxis(read.xs.map((_, i) => i), plot, { chart: CHART, property: xName, padding: context.domainPadding, numeric: false, paddingInner: 0, paddingOuter: 0.1 });
  const slots = Math.max(1, ...drawn.flatMap((s) => (at.get(s) ?? []).map((p) => p?.slot ?? 0)));
  const rowHeight = plot.height / slots;
  const y = (slot: number) => plot.y + (slot - 0.5) * rowHeight;
  // The rank rows, as grid lines: a line keeps its slot between them.
  for (let slot = 1; slot <= slots; slot += 1) strokes.push({ d: `M${plot.x},${y(slot)}H${plot.x + plot.width}`, role: 'ornament', part: 'grid' });
  labels.push(...categoryLabels(xLabels, columns.at, area, plot));

  const ends: { first: Place; last: Place; series: string }[] = [];
  drawn.forEach((series, row) => {
    const places: (Place | undefined)[] = (at.get(series) ?? []).map((p, xi) => (p ? { x: columns.at(xi), y: y(p.slot), rank: p.rank, value: p.value } : undefined));
    const d = line<Place | undefined>().defined((p) => p !== undefined).x((p) => (p as Place).x).y((p) => (p as Place).y).curve(curveBumpX)(places);
    if (d) strokes.push({ d, role: 'encoding', part: 'ink' });
    places.forEach((p, xi) => {
      if (!p) return;
      strokes.push({ d: circlePath(p.x, p.y, DOT_RADIUS), role: 'encoding', part: 'ink' });
      hitAreas.push({ seriesKey: series, index: xi, datum: Object.freeze({ x: read.xs[xi], series, value: p.value, rank: p.rank }), value: p.rank, x: p.x, y: p.y, cell: { column: xi, row } });
    });
    const present = places.filter((p): p is Place => p !== undefined);
    if (present.length > 0) ends.push({ first: present[0] as Place, last: present.at(-1) as Place, series });
  });
  // The series' names at both ends, as direct labels, spread apart (DD-035).
  const lefts = spreadLabels(ends.map((e) => e.first.y), NAME_GAP, plot.y, plot.y + plot.height);
  const rights = spreadLabels(ends.map((e) => e.last.y), NAME_GAP, plot.y, plot.y + plot.height);
  ends.forEach((e, k) => {
    labels.push({ x: e.first.x - 7, y: (lefts[k] as number) + 3, text: e.series, kind: 'tick', part: 'axis', anchor: 'end' });
    labels.push({ x: e.last.x + 7, y: (rights[k] as number) + 3, text: e.series, kind: 'tick', part: 'axis', anchor: 'start' });
  });

  // One heightened element (REQ-442): the last point of the rank-1 series.
  const last = read.xs.length - 1;
  const leader = hitAreas.filter((h) => h.index === last).sort((a, b) => a.y - b.y)[0] ?? hitAreas.at(-1);
  if (leader) {
    const mark = circlePath(leader.x, leader.y, HEIGHTEN_RADIUS);
    strokes.push({ d: mark, role: 'encoding', part: 'heighten', paint: 'fill' });
    strokes.push({ d: mark, role: 'encoding', part: 'ink', paint: 'stroke' });
  }

  const description =
    props.description ??
    `${base.name}. Bump chart of the rank of ${drawn.length} series over ${read.xs.length} ${xName} values, rank 1 the ${order === 'descending' ? 'highest' : 'lowest'} ${accessorName(valueKey, 'value')}, competition ranking with ties shared${
      leader ? `; ${leader.seriesKey} leads at ${xLabels[last] ?? ''}` : ''
    }.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `BumpChart` recipe (REQ-409): the rank of each series at each x, computed in the core. */
export const bumpChart: ChartRecipe<BumpChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildBumpChart });
