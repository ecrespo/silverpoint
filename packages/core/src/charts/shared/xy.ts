import { linearScale, type LinearScale } from '../../scales/scales';
import type { Rect, Stroke, TextLabel } from '../../types';
import { TICK_CHAR, valueAxis } from './cartesian';
import { inset } from './cells';
import { formatNumber } from './format';

/**
 * The x-y frame the field charts share (DD-036) — density bins, contours, Delaunay, vector field —
 * as the connected scatter draws it: the value axis up the left with its grid, `x` niced across
 * after the value labels, its ticks under the plot. `region` is where the data's extent maps.
 */
export interface XYFrame {
  readonly x: LinearScale;
  readonly y: LinearScale;
  readonly region: Rect;
  readonly strokes: readonly Stroke[];
  readonly labels: readonly TextLabel[];
}

export function xyFrame(
  area: Rect,
  plot: Rect,
  domain: { readonly x: readonly [number, number]; readonly y: readonly [number, number] },
  options: {
    readonly chart: string;
    readonly xName: string;
    readonly yName: string;
    readonly padding: number;
    readonly locale: string;
    readonly numberFormat: Intl.NumberFormatOptions | undefined;
    /** Room inside the plot for marks centred on its edge. */
    readonly inset: number;
  },
): XYFrame {
  const inner = inset(plot, options.inset);
  const { chart, padding, locale, numberFormat } = options;
  const axis = valueAxis(inner, domain.y, { chart, property: options.yName, padding, locale, numberFormat, zero: false });
  const gutter = Math.min(Math.max(0, ...axis.labels.map((l) => l.text.length * TICK_CHAR)) + 6, inner.width / 3);
  const x = linearScale(domain.x, [inner.x + gutter, inner.x + inner.width], { chart, property: options.xName, padding, nice: true });
  const labels: TextLabel[] = [...axis.labels];
  for (const tick of x.ticks(4)) {
    labels.push({ x: x(tick), y: area.y + area.height - 5, text: formatNumber(tick, locale, numberFormat), kind: 'tick', part: 'axis', anchor: 'middle' });
  }
  const region = { x: inner.x + gutter, y: inner.y, width: Math.max(inner.width - gutter, 1), height: inner.height };
  return { x, y: axis.scale, region, strokes: axis.strokes, labels };
}
