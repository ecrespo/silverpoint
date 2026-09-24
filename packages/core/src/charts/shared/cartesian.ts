import { bandScale, linearScale, type LinearScale } from '../../scales/scales';
import { extent } from '../../scales/util';
import type { Accessor, Datum, Rect, Stroke, TextLabel } from '../../types';
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
  if (process.env.NODE_ENV === 'production') return;
  for (const s of series) {
    if (s.points.length > POINTS_PER_SERIES) {
      diagnose('SP008', chart, { property: s.key, message: `${s.points.length} points; the ceiling is ${POINTS_PER_SERIES} per series.` });
    }
  }
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
  },
): ValueAxis {
  const bottom = plot.y + plot.height;
  const low = options.zero === false ? domain[0] : Math.min(0, domain[0]);
  const high = options.zero === false ? domain[1] : Math.max(0, domain[1]);
  const scale = linearScale([low, high], [bottom, plot.y], {
    chart: options.chart,
    property: options.property,
    padding: options.padding,
    nice: true,
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
