import { bandScale, linearScale, type LinearScale } from '../../scales/scales';
import { extent } from '../../scales/util';
import type { Accessor, Datum, Rect, Stroke, TextLabel, ToneLevel } from '../../types';
import { rectPath } from './cells';
import { diagnose } from '../../diagnostics/diagnose';
import { accessorName, formatNumber, read } from './format';

/** Room under the plot for the category labels. */
export const AXIS_BAND = 20;
/** Room around the plot so a heightened point or a pill end is never clipped. */
export const PLOT_INSET = 6;
/** Minimum horizontal room per category label. */
const LABEL_SPACING = 48;

/** The plot of a cartesian chart inside its drawing area: inset, with the axis band below. */
export function cartesianPlot(area: Rect): Rect {
  return {
    x: area.x + PLOT_INSET,
    y: area.y + PLOT_INSET,
    width: Math.max(area.width - 2 * PLOT_INSET, 1),
    height: Math.max(area.height - AXIS_BAND - PLOT_INSET, 1),
  };
}

export interface SeriesPoint {
  readonly index: number;
  readonly datum: Datum;
  readonly value: number | undefined;
}

export interface Series {
  readonly key: string;
  readonly points: readonly SeriesPoint[];
  /** Points whose value is not a finite number. */
  readonly missing: number;
}

/** Reads one numeric series through an accessor; non-finite values become gaps. */
export function readSeries(data: readonly Datum[], accessor: Accessor<number | null | undefined>, fallbackName: string): Series {
  let missing = 0;
  const points = data.map((datum, index) => {
    const raw = read(accessor, datum, index);
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
    if (value === undefined) missing += 1;
    return { index, datum, value };
  });
  return { key: accessorName(accessor, fallbackName), points, missing };
}

/** Points per series a cartesian chart draws before it recommends aggregation (API Spec §12). */
export const POINTS_PER_SERIES = 500;

/**
 * Warns SP008 when a series runs past the family's ceiling. The series is still drawn in full:
 * the warning recommends aggregation, it never degrades silently (REQ-096).
 */
export function checkVolume(chart: string, series: readonly Series[]): void {
  for (const s of series) checkCount(chart, s.key, s.points.length);
}

/** The same ceiling, for a chart whose points are not read as a `Series`. */
export function checkCount(chart: string, property: string, count: number): void {
  if (process.env.NODE_ENV === 'production' || count <= POINTS_PER_SERIES) return;
  diagnose('SP008', chart, { property, message: `${count} points; the ceiling is ${POINTS_PER_SERIES} per series.` });
}

/** The finite values of a set of series. */
export function seriesValues(series: readonly Series[]): number[] {
  return series.flatMap((s) => s.points.flatMap((p) => (p.value === undefined ? [] : [p.value])));
}

export interface ValueAxis {
  readonly scale: LinearScale;
  readonly strokes: readonly Stroke[];
  readonly labels: readonly TextLabel[];
}

/**
 * The vertical value scale of a cartesian chart, niced, with its grid lines and tick labels and
 * the base rule. The domain always reaches zero when `zero` is set, as bars and areas need.
 */
export function valueAxis(
  plot: Rect,
  domain: readonly [number, number],
  options: {
    readonly chart: string;
    readonly property: string;
    readonly padding: number;
    readonly locale: string;
    readonly numberFormat: Intl.NumberFormatOptions | undefined;
    readonly zero?: boolean;
    /** Round the domain out to tick values; `true` by default. Pinned bounds pass `false`. */
    readonly nice?: boolean;
  },
): ValueAxis {
  const bottom = plot.y + plot.height;
  const low = options.zero === false ? domain[0] : Math.min(0, domain[0]);
  const high = options.zero === false ? domain[1] : Math.max(0, domain[1]);
  const scale = linearScale([low, high], [bottom, plot.y], {
    chart: options.chart,
    property: options.property,
    padding: options.padding,
    nice: options.nice !== false,
    fromZero: options.zero !== false,
  });
  const strokes: Stroke[] = [];
  const labels: TextLabel[] = [];
  for (const tick of scale.ticks(4)) {
    const ty = scale(tick);
    if (tick === scale.domain[0]) continue;
    strokes.push({ d: `M${plot.x},${ty}H${plot.x + plot.width}`, role: 'ornament', part: 'grid' });
    labels.push({ x: plot.x, y: ty - 3, text: formatNumber(tick, options.locale, options.numberFormat), kind: 'tick', part: 'axis', anchor: 'start' });
  }
  strokes.push({ d: `M${plot.x},${bottom}H${plot.x + plot.width}`, role: 'ornament', part: 'rule' });
  return { scale, strokes, labels };
}

export interface CategoryAxis {
  /** Centre of item `index` along x. */
  at(index: number): number;
  /** Width of one category's band; 0 on a numeric axis. */
  readonly bandwidth: number;
}

/**
 * Positions along x: a linear scale when every x value is a finite number, otherwise one band per
 * row, whose centre is the item's position.
 */
export function categoryAxis(
  xValues: readonly unknown[],
  plot: Rect,
  options: { readonly chart: string; readonly property: string; readonly padding: number; readonly paddingInner?: number; readonly paddingOuter?: number; readonly numeric?: boolean },
): CategoryAxis {
  const numeric = options.numeric !== false && xValues.length > 0 && xValues.every((v) => typeof v === 'number' && Number.isFinite(v));
  if (numeric) {
    const numbers = xValues as number[];
    const x = linearScale(extent(numbers) ?? [0, 0], [plot.x, plot.x + plot.width], {
      chart: options.chart,
      property: options.property,
      padding: options.padding,
    });
    return { at: (index) => x(numbers[index] ?? 0), bandwidth: 0 };
  }
  const keys = xValues.map((_, index) => String(index));
  const band = bandScale(keys, [plot.x, plot.x + plot.width], { paddingInner: options.paddingInner, paddingOuter: options.paddingOuter });
  return { at: (index) => band.center(String(index)) ?? plot.x, bandwidth: band.bandwidth };
}

/** Category labels under the plot, thinned so they never crowd: one every `step` items. */
export function categoryLabels(texts: readonly string[], at: (index: number) => number, area: Rect, plot: Rect): TextLabel[] {
  const count = texts.length;
  const step = Math.max(1, Math.ceil(count / Math.max(2, Math.floor(plot.width / LABEL_SPACING))));
  const labels: TextLabel[] = [];
  for (let index = 0; index < count; index += step) {
    labels.push({
      x: at(index),
      y: area.y + area.height - 5,
      text: texts[index] ?? '',
      kind: 'tick',
      part: 'axis',
      anchor: index === 0 ? 'start' : 'middle',
    });
  }
  return labels;
}

/** Height of the legend row at the top of the drawing area: a full line above the top value tick. */
export const LEGEND_BAND = 22;
/** Advance of one character of tick or legend text at the 9.5 px tick size. */
export const TICK_CHAR = 5.2;
const LEGEND_CHAR = TICK_CHAR;

export interface LegendEntry {
  readonly name: string;
  readonly part: 'ink' | 'ink-secondary';
  readonly tone?: ToneLevel;
  readonly dash?: 'dotted';
}

/**
 * A legend row at the top of the area: a swatch drawn like its series — outline, dash and tone —
 * and the series' name. The swatch carries no data, so it is an ornament; the name is what tells
 * the series apart, never the tone alone (REQ-124). Returns the area left below it.
 */
export function legend(area: Rect, entries: readonly LegendEntry[]): { area: Rect; strokes: Stroke[]; labels: TextLabel[] } {
  const strokes: Stroke[] = [];
  const labels: TextLabel[] = [];
  let x = area.x + PLOT_INSET;
  for (const entry of entries) {
    const swatch = { x, y: area.y + 4, width: 12, height: 7 };
    strokes.push({ d: rectPath(swatch), role: 'ornament', part: entry.part, ...(entry.tone ? { tone: entry.tone } : {}), ...(entry.dash ? { dash: entry.dash } : {}) });
    labels.push({ x: x + 16, y: area.y + 11, text: entry.name, kind: 'tick', part: 'axis', anchor: 'start' });
    x += 16 + entry.name.length * LEGEND_CHAR + 12;
  }
  return { area: { x: area.x, y: area.y + LEGEND_BAND, width: area.width, height: Math.max(area.height - LEGEND_BAND, 1) }, strokes, labels };
}

/** A rectangle with fully rounded ends — a pill — as a closed path of lines and arcs. */
export function pillPath(rect: Rect): string {
  const { x, y, width, height } = rect;
  const r = Math.min(width, height) / 2;
  if (r <= 0) return `M${x},${y}H${x + width}V${y + height}H${x}Z`;
  return (
    `M${x},${y + r}A${r},${r},0,0,1,${x + r},${y}H${x + width - r}A${r},${r},0,0,1,${x + width},${y + r}` +
    `V${y + height - r}A${r},${r},0,0,1,${x + width - r},${y + height}H${x + r}A${r},${r},0,0,1,${x},${y + height - r}Z`
  );
}

/**
 * The horizontal value scale of a chart laid out in rows: niced, zero in the domain, with vertical
 * grid lines and tick labels under the plot, and the base rule at zero.
 */
export function horizontalValueAxis(
  plot: Rect,
  area: Rect,
  domain: readonly [number, number],
  options: { readonly chart: string; readonly property: string; readonly padding: number; readonly locale: string; readonly numberFormat: Intl.NumberFormatOptions | undefined },
): ValueAxis {
  const scale = linearScale([Math.min(0, domain[0]), Math.max(0, domain[1])], [plot.x, plot.x + plot.width], {
    chart: options.chart,
    property: options.property,
    padding: options.padding,
    nice: true,
    fromZero: true,
  });
  const strokes: Stroke[] = [];
  const labels: TextLabel[] = [];
  for (const tick of scale.ticks(4)) {
    const tx = scale(tick);
    if (tick !== 0) strokes.push({ d: `M${tx},${plot.y}V${plot.y + plot.height}`, role: 'ornament', part: 'grid' });
    labels.push({ x: tx, y: area.y + area.height - 5, text: formatNumber(tick, options.locale, options.numberFormat), kind: 'tick', part: 'axis', anchor: 'middle' });
  }
  strokes.push({ d: `M${scale(0)},${plot.y}V${plot.y + plot.height}`, role: 'ornament', part: 'rule' });
  return { scale, strokes, labels };
}
