import { linearScale } from '../../scales/scales';
import { extent } from '../../scales/util';
import type { Accessor, ChartModel, CommonChartProps, Datum, HitArea, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from './card';
import { cartesianPlot, checkCount, TICK_CHAR, valueAxis } from './cartesian';
import { finite, inset, warnValue } from './cells';
import { accessorName, circlePath, formatNumber, formatValue, read } from './format';
import { emptyModel, measure, modelBase, readyModel } from './shell';

/** What tells the scatter from the bubble: defaults, the kind of fill, and the name. */
export interface PointFamily {
  readonly chart: string;
  readonly fallbackName: string;
  readonly defaultSizeRange: readonly [number, number];
  /** Whether a size is read when no `sizeKey` is given. */
  readonly sizeByDefault: boolean;
  readonly toned: boolean;
}

interface PointProps extends CommonChartProps {
  xKey?: Accessor<number | null | undefined>;
  yKey?: Accessor<number | null | undefined>;
  sizeKey?: Accessor<number | null | undefined>;
  sizeRange?: readonly [number, number];
}

interface Point {
  readonly index: number;
  readonly datum: Datum;
  readonly x: number;
  readonly y: number;
  readonly size: number | undefined;
}

const validRange = (range: readonly [number, number] | undefined): range is readonly [number, number] =>
  !!range && Number.isFinite(range[0]) && Number.isFinite(range[1]) && range[0] > 0 && range[0] <= range[1];

/**
 * Points on two linear scales. A size maps to marker **area**, affinely from the smallest size to
 * the largest across `sizeRange` (px²): area, not radius, so a size twice as far from the smallest
 * is a mark twice as much larger to the eye (REQ-082, REQ-083).
 */
export function buildPoints(family: PointFamily, props: PointProps, context: RecipeContext, demo: readonly Datum[]): ChartModel {
  const { chart } = family;
  const usesDemo = props.data === undefined;
  const data = props.data ?? demo;
  const xKey = usesDemo ? 'x' : (props.xKey ?? 'x');
  const yKey = usesDemo ? 'y' : (props.yKey ?? 'y');
  const sizeKey = usesDemo ? 'size' : (props.sizeKey ?? (family.sizeByDefault ? 'size' : undefined));
  const sizeRange = validRange(props.sizeRange) ? props.sizeRange : family.defaultSizeRange;
  if (props.sizeRange !== undefined && !validRange(props.sizeRange)) {
    warnValue(chart, 'sizeRange', `[${String(props.sizeRange)}] is not two finite areas with 0 < smallest ≤ largest; the default [${String(family.defaultSizeRange)}] is used.`);
  }
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const xName = accessorName(xKey, 'x');
  const yName = accessorName(yKey, 'y');
  const sizeName = sizeKey === undefined ? undefined : accessorName(sizeKey, 'size');
  checkCount(chart, yName, data.length);

  const points: Point[] = [];
  data.forEach((datum, index) => {
    const x = finite(read(xKey, datum, index));
    const y = finite(read(yKey, datum, index));
    const size = sizeKey === undefined ? undefined : finite(read(sizeKey, datum, index));
    if (x === undefined || y === undefined) {
      warnValue(chart, x === undefined ? xName : yName, `Row ${index} has no finite ${x === undefined ? xName : yName}; it is omitted.`);
      return;
    }
    if (sizeKey !== undefined && (size === undefined || size < 0)) {
      warnValue(chart, sizeName ?? 'size', `Row ${index} has a size of ${String(size ?? 'no number')}; sizes must be zero or more, so it is omitted.`);
      return;
    }
    points.push({ index, datum, x, y, size });
  });

  const base = modelBase(chart, props, context, family.fallbackName, {
    columns: [xName, yName, ...(sizeName ? [sizeName] : [])],
    rows: data.map((datum, index) => [
      formatValue(read(xKey, datum, index), locale, numberFormat),
      formatValue(read(yKey, datum, index), locale, numberFormat),
      ...(sizeKey ? [formatValue(read(sizeKey, datum, index), locale, numberFormat)] : []),
    ]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = cartesianPlot(card.area);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  if (points.length === 0) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);
  }

  const sizes = extent(points.flatMap((p) => (p.size === undefined ? [] : [p.size])));
  const areaOf = (s: number | undefined) => {
    if (s === undefined || !sizes) return sizeRange[0];
    if (sizes[0] === sizes[1]) return sizeRange[1];
    return sizeRange[0] + ((s - sizes[0]) / (sizes[1] - sizes[0])) * (sizeRange[1] - sizeRange[0]);
  };
  const radius = (s: number | undefined) => Math.sqrt(areaOf(s) / Math.PI);
  const largest = Math.max(...points.map((p) => radius(p.size)));
  // The scales run inside the plot by the largest radius, so no mark is ever clipped.
  const inner = inset(plot, largest);

  const axis = valueAxis(inner, extent(points.map((p) => p.y)) ?? [0, 0], { chart, property: yName, padding: context.domainPadding, locale, numberFormat, zero: false });
  const y = axis.scale;
  strokes.push(...axis.strokes);
  labels.push(...axis.labels);
  // The value labels sit at the plot's left edge; the marks start after them, so none covers one.
  const gutter = Math.min(Math.max(0, ...axis.labels.map((l) => l.text.length * TICK_CHAR)) + 4 + largest, inner.width / 3);
  const x = linearScale(extent(points.map((p) => p.x)) ?? [0, 0], [inner.x + gutter, inner.x + inner.width], { chart, property: xName, padding: context.domainPadding, nice: true });
  for (const tick of x.ticks(4)) {
    labels.push({ x: x(tick), y: card.area.y + card.area.height - 5, text: formatNumber(tick, locale, numberFormat), kind: 'tick', part: 'axis', anchor: 'middle' });
  }

  // The largest mark is drawn first, so the small ones stay on top of it.
  for (const p of [...points].sort((a, b) => radius(b.size) - radius(a.size) || a.index - b.index)) {
    strokes.push({ d: circlePath(x(p.x), y(p.y), radius(p.size)), role: 'encoding', part: 'ink', ...(family.toned ? { tone: 1 as const } : {}) });
  }
  for (const p of points) {
    const r = radius(p.size);
    hitAreas.push({ seriesKey: yName, index: p.index, datum: p.datum, value: p.y, x: x(p.x), y: y(p.y), box: { x: x(p.x) - r, y: y(p.y) - r, width: 2 * r, height: 2 * r } });
  }

  const xs = extent(points.map((p) => p.x)) ?? [0, 0];
  const ys = extent(points.map((p) => p.y)) ?? [0, 0];
  const description =
    props.description ??
    `${base.name}. ${points.length} points; ${xName} from ${formatNumber(xs[0], locale, numberFormat)} to ${formatNumber(xs[1], locale, numberFormat)}, ${yName} from ${formatNumber(ys[0], locale, numberFormat)} to ${formatNumber(ys[1], locale, numberFormat)}${
      sizeName && sizes ? `, ${sizeName} from ${formatNumber(sizes[0], locale, numberFormat)} to ${formatNumber(sizes[1], locale, numberFormat)} as marker area` : ''
    }.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}
