import type { ChartModel, CommonChartProps, HitArea, Rect, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from './card';
import { warnValue } from './cells';
import { formatNumber } from './format';
import type { PolarFrame } from './polar';
import { measure, modelBase, readyModel } from './shell';

/** The demo value of a meter (REQ-093). */
export const SCALAR_DEMO = 72;

interface ScalarProps extends CommonChartProps {
  percent?: number;
  caption?: string;
  readout?: string;
}

export interface ScalarDrawing {
  readonly strokes: Stroke[];
  readonly labels: TextLabel[];
  /** Where the value points: the item's position. */
  readonly tip?: { readonly x: number; readonly y: number };
}

export interface ScalarFamily {
  readonly chart: string;
  readonly fallbackName: string;
  frameIn(area: Rect): PolarFrame;
  /** Baselines of the readout and of the caption: clear of the value's marks. */
  readoutAt(frame: PolarFrame): { readonly value: number; readonly caption: number };
  /** Draws the track, and the value when there is one (0-100, already saturated). */
  draw(frame: PolarFrame, value: number | undefined): ScalarDrawing;
}

/**
 * A meter (Data Model §2.3): one percent, saturated at 0 and 100 with `SP002`; a non-finite one
 * draws the empty track. The readout — the percent, or `readout` — is printed under the drawing,
 * with the `caption` that names it (REQ-080, REQ-081).
 */
export function buildScalar(family: ScalarFamily, props: ScalarProps, context: RecipeContext): ChartModel {
  const { chart } = family;
  const { locale } = context;
  const raw = props.percent === undefined ? SCALAR_DEMO : props.percent;
  let value: number | undefined;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    warnValue(chart, 'percent', `The percent is ${String(raw)}; a meter needs a finite number, so none is drawn.`);
  } else {
    value = Math.min(Math.max(raw, 0), 100);
    if (value !== raw) warnValue(chart, 'percent', `The percent is ${raw}; it is drawn at ${value}, the end of the 0-100 range.`);
  }
  const printed = value === undefined ? '—' : (props.readout ?? `${formatNumber(value, locale, { maximumFractionDigits: 1 })}%`);
  const caption = props.caption && props.caption !== '' ? props.caption : undefined;

  const base = modelBase(chart, props, context, family.fallbackName, { columns: ['measure', 'value'], rows: [[caption ?? 'value', printed]] });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = card.area;
  const frame = family.frameIn(plot);
  const drawing = family.draw(frame, value);
  const strokes: Stroke[] = [...card.strokes, ...drawing.strokes];
  const labels: TextLabel[] = [...card.labels, ...drawing.labels];
  const at = family.readoutAt(frame);
  labels.push({ x: frame.cx, y: at.value, text: printed, kind: 'value', part: 'text', anchor: 'middle' });
  if (caption) labels.push({ x: frame.cx, y: at.caption, text: caption, kind: 'tick', part: 'axis', anchor: 'middle' });
  const hitAreas: HitArea[] = [];
  if (value !== undefined && drawing.tip) {
    hitAreas.push({ seriesKey: 'value', index: 0, datum: { value }, value, x: drawing.tip.x, y: drawing.tip.y });
  }
  const description = props.description ?? `${base.name}. ${caption ?? 'The value'} at ${printed}${props.readout && value !== undefined ? ` (${formatNumber(value, locale, undefined)}% of the range)` : ' of the range'}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}
