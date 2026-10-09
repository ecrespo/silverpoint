import { linearScale } from '../../scales/scales';
import type { ChartModel, ChartRecipe, DivergingBarChartProps, HitArea, Rect, RecipeContext, Stroke, TextLabel, ToneLevel } from '../../types';
import { cardLayout } from '../shared/card';
import { AXIS_BAND, PLOT_INSET, TICK_CHAR, categoryAxis, legend } from '../shared/cartesian';
import { rectPath } from '../shared/cells';
import { readLikert } from '../shared/contracts';
import { accessorName, fitText, formatNumber } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { niceStep } from '../shared/stats';
import { DIVERGING_BAR_CHART_DEMO, DIVERGING_BAR_CHART_DEMO_KEYS } from './demo';

const CHART = 'DivergingBarChart';
/** The deepest tone a level takes: the darkest steps of the ramp stay for the heaviest marks. */
const MAX_TONE = 3;
const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 1 };

/** Where each level sits: its side of the centre, its tone, and whether it is the split neutral. */
interface Placement {
  readonly side: -1 | 0 | 1;
  readonly tone: ToneLevel;
}

/**
 * Levels left of the neutral run left of the centre, the rest right; the neutral is split across
 * it. The side carries the sign; the tone, the distance from neutral (REQ-412, REQ-440).
 */
function placements(count: number, neutral: number | null): Placement[] {
  const tone = (distance: number) => Math.min(distance, MAX_TONE) as ToneLevel;
  if (neutral === null) {
    const middle = Math.floor(count / 2);
    return Array.from({ length: count }, (_, i) => (i < middle ? { side: -1, tone: tone(middle - i) } : { side: 1, tone: tone(i - middle + 1) }));
  }
  return Array.from({ length: count }, (_, i) => (i < neutral ? { side: -1, tone: tone(neutral - i) } : i > neutral ? { side: 1, tone: tone(i - neutral) } : { side: 0, tone: 0 }));
}

function buildDivergingBarChart(props: DivergingBarChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? DIVERGING_BAR_CHART_DEMO;
  const labelKey = usesDemo ? DIVERGING_BAR_CHART_DEMO_KEYS.labelKey : (props.labelKey ?? 'label');
  const levels = usesDemo ? DIVERGING_BAR_CHART_DEMO_KEYS.levels : props.levels;
  const percent = props.percent !== false;
  // The middle level of an odd scale by default; a given index is held to the scale.
  const neutral =
    props.neutral === null
      ? null
      : props.neutral === undefined
        ? levels.length % 2 === 1 ? (levels.length - 1) / 2 : null
        : Math.min(Math.max(Math.round(Number.isFinite(props.neutral) ? props.neutral : 0), 0), levels.length - 1);
  const { locale } = context;
  const share = (v: number) => (percent ? formatNumber(v / 100, locale, PERCENT) : formatNumber(v, locale, props.numberFormat));
  const labelName = accessorName(labelKey, 'label');

  const rows = readLikert(CHART, data, labelKey, levels, percent);
  const base = modelBase(CHART, props, context, 'Diverging bar chart', {
    columns: [labelName, ...levels],
    rows: rows.map((r) => [r.label, ...r.shares.map(share)]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const place = placements(levels.length, neutral);
  const key = legend(card.area, levels.map((name, i) => ({ name, part: 'ink' as const, ...(place[i]?.tone ? { tone: place[i]?.tone } : {}) })));
  const area = key.area;
  const room = Math.min(Math.max(0, ...rows.map((r) => r.label.length * TICK_CHAR)) + 10, area.width * 0.35);
  const plot: Rect = { x: area.x + room, y: area.y + PLOT_INSET, width: Math.max(area.width - room - PLOT_INSET, 1), height: Math.max(area.height - AXIS_BAND - PLOT_INSET, 1) };
  const strokes: Stroke[] = [...card.strokes, ...key.strokes];
  const labels: TextLabel[] = [...card.labels, ...key.labels];
  const hitAreas: HitArea[] = [];

  if (rows.length === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const sideTotal = (shares: readonly number[], side: -1 | 1) =>
    shares.reduce((sum, s, i) => sum + (place[i]?.side === side ? s : place[i]?.side === 0 ? s / 2 : 0), 0);
  const left = Math.max(...rows.map((r) => sideTotal(r.shares, -1)), 0);
  const rightTotal = Math.max(...rows.map((r) => sideTotal(r.shares, 1)), 0);
  // Symmetric about the centre, so the two sides read on one scale, to the next step of the
  // 1-2-5 ladder: d3's nice would round ±55 % out to ±100 %.
  const reach = Math.max(left, rightTotal, 1e-9);
  const step = niceStep(reach / 2);
  const bound = Math.ceil(reach / step - 1e-9) * step;
  const x = linearScale([-bound, bound], [plot.x, plot.x + plot.width], { chart: CHART, property: labelName, padding: context.domainPadding });
  for (let k = -Math.round(bound / step); k <= Math.round(bound / step); k += 1) {
    const t = k * step;
    if (k !== 0) strokes.push({ d: `M${x(t)},${plot.y}V${plot.y + plot.height}`, role: 'ornament', part: 'grid' });
    labels.push({ x: x(t), y: area.y + area.height - 5, text: share(Math.abs(t)), kind: 'tick', part: 'axis', anchor: 'middle' });
  }
  const centre = x(0);
  strokes.push({ d: `M${centre},${plot.y}V${plot.y + plot.height}`, role: 'ornament', part: 'rule' });
  const band = categoryAxis(rows.map((_, i) => i), { x: plot.y, y: plot.x, width: plot.height, height: plot.width }, { chart: CHART, property: labelName, padding: context.domainPadding, numeric: false, paddingInner: 0.3, paddingOuter: 0.15 });
  const thickness = Math.min(band.bandwidth, 22);

  let raised: { d: string; share: number } | undefined;
  rows.forEach((row, r) => {
    const c = band.at(r);
    const top = c - thickness / 2;
    labels.push({ x: area.x + PLOT_INSET, y: c + 4, text: fitText(row.label, room - PLOT_INSET - 4), kind: 'tick', part: 'axis', anchor: 'start' });
    // Out from the centre on each side: the neutral half first, then outward by distance.
    let leftEdge = centre;
    let rightEdge = centre;
    const segment = (from: number, to: number, tone: ToneLevel) => {
      const box = { x: Math.min(from, to), y: top, width: Math.abs(to - from), height: thickness };
      const d = rectPath(box);
      strokes.push({ d, role: 'encoding', part: 'ink', tone });
      return { box, d };
    };
    const order = levels.map((_, i) => i).sort((a, b) => (place[a]?.tone ?? 0) - (place[b]?.tone ?? 0) || a - b);
    for (const i of order) {
      const s = row.shares[i] as number;
      const p = place[i] as Placement;
      if (!(s > 0)) continue;
      let box: Rect;
      let d: string;
      if (p.side === 0) {
        const half = x(s / 2) - x(0);
        const a = segment(leftEdge - half, leftEdge, 0);
        const b = segment(rightEdge, rightEdge + half, 0);
        leftEdge -= half;
        rightEdge += half;
        box = { x: a.box.x, y: top, width: a.box.width + b.box.width, height: thickness };
        d = b.d;
      } else {
        const width = x(s) - x(0);
        const from = p.side < 0 ? leftEdge - width : rightEdge;
        const drawn = segment(from, from + width, p.tone);
        if (p.side < 0) leftEdge -= width;
        else rightEdge += width;
        box = drawn.box;
        d = drawn.d;
        if (p.side > 0 && (!raised || s > raised.share)) raised = { d, share: s };
      }
      hitAreas.push({
        seriesKey: levels[i] as string,
        index: row.index,
        datum: Object.freeze({ label: row.label, level: levels[i], share: s, count: row.values[i] }),
        value: s,
        x: box.x + box.width / 2,
        y: c,
        box,
        cell: { column: i, row: r },
      });
      const text = share(s);
      if (text.length * TICK_CHAR + 4 <= box.width && thickness >= 9) labels.push({ x: box.x + box.width / 2, y: c + 3, text, kind: 'tick', part: 'text', anchor: 'middle' });
    }
  });

  // One heightened element (REQ-442): the largest positive share, the segment itself.
  if (raised) strokes.push({ d: raised.d, role: 'encoding', part: 'heighten', paint: 'fill' });

  const description =
    props.description ??
    `${base.name}. Diverging bars of ${rows.length} ${labelName} rows on a ${levels.length}-level scale from ${levels[0] ?? ''} to ${levels.at(-1) ?? ''}${
      neutral === null ? '' : `, ${levels[neutral] ?? ''} split across the centre`
    }; ${percent ? 'each row as shares of 100 %' : 'counts'}, levels before the centre to its left.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `DivergingBarChart` recipe (REQ-412): ordered levels stacked on both sides of a neutral centre. */
export const divergingBarChart: ChartRecipe<DivergingBarChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildDivergingBarChart });
