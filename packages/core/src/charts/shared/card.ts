import type { CommonChartProps, Rect, Stroke, TextLabel } from '../../types';
import { formatValue } from './format';

/** Inner padding of the card frame. */
export const CARD_PADDING = 16;
const TITLE_ROW = 20;
const VALUE_ROW = 52;
const HEADER_GAP = 8;
const FOOTER_ROW = 30;

export interface CardLayout {
  readonly viewBox: Rect;
  /** Where the chart draws; the whole viewBox under `chrome: 'bare'`. */
  readonly area: Rect;
  readonly strokes: readonly Stroke[];
  readonly labels: readonly TextLabel[];
}

/**
 * Lays out the card frame shared by every chart: title and badge, metric and unit, the drawing
 * area and the footer. Under `chrome: 'bare'` it emits the drawing area and nothing else
 * (REQ-095).
 */
export function cardLayout(
  props: CommonChartProps,
  options: {
    readonly width: number;
    readonly areaHeight: number;
    readonly chrome: 'card' | 'bare';
    readonly locale: string;
  },
): CardLayout {
  const { width, areaHeight, chrome, locale } = options;
  if (chrome === 'bare') {
    const box = { x: 0, y: 0, width, height: areaHeight };
    return { viewBox: box, area: box, strokes: [], labels: [] };
  }

  const labels: TextLabel[] = [];
  const strokes: Stroke[] = [];
  const left = CARD_PADDING;
  const right = width - CARD_PADDING;
  let cursor = CARD_PADDING;

  if (props.title !== undefined || props.badge !== undefined) {
    const baseline = cursor + 11;
    if (props.title !== undefined) {
      labels.push({ x: left, y: baseline, text: props.title, kind: 'title', part: 'text', anchor: 'start' });
    }
    if (props.badge !== undefined) {
      labels.push({ x: right, y: baseline, text: props.badge, kind: 'badge', part: 'axis', anchor: 'end' });
    }
    cursor += TITLE_ROW;
  }

  if (props.value !== undefined || props.unit !== undefined) {
    if (props.value !== undefined) {
      labels.push({
        x: left,
        y: cursor + 30,
        text: formatValue(props.value, locale, props.numberFormat),
        kind: 'value',
        part: 'text',
        anchor: 'start',
      });
    }
    if (props.unit !== undefined) {
      labels.push({ x: left, y: cursor + 46, text: props.unit, kind: 'unit', part: 'axis', anchor: 'start' });
    }
    cursor += VALUE_ROW;
  }

  if (cursor > CARD_PADDING) cursor += HEADER_GAP;
  const area = { x: left, y: cursor, width: right - left, height: areaHeight };
  cursor += areaHeight;

  if (props.footerLeft !== undefined || props.footerRight !== undefined) {
    const ruleY = cursor + 8;
    strokes.push({ d: `M${left},${ruleY}H${right}`, role: 'ornament', part: 'rule' });
    if (props.footerLeft !== undefined) {
      labels.push({ x: left, y: ruleY + 18, text: props.footerLeft, kind: 'footer', part: 'axis', anchor: 'start' });
    }
    if (props.footerRight !== undefined) {
      labels.push({ x: right, y: ruleY + 18, text: props.footerRight, kind: 'footer', part: 'axis', anchor: 'end' });
    }
    cursor += FOOTER_ROW;
  }

  const height = cursor + CARD_PADDING;
  const inset = 0.5;
  strokes.unshift({
    d: `M${inset},${inset}H${width - inset}V${height - inset}H${inset}Z`,
    role: 'ornament',
    part: 'rule',
  });

  return { viewBox: { x: 0, y: 0, width, height }, area, strokes, labels };
}
