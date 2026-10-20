import { round2 } from '../render/round';

/** A box in viewport coordinates (`getBoundingClientRect`). */
export interface UiBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Logical sides: `start` and `end` are left and right in `ltr`, mirrored in `rtl` (REQ-523). */
export type UiSide = 'top' | 'end' | 'bottom' | 'start';
export type UiAlign = 'start' | 'center' | 'end';

export interface UiPlaceInput {
  readonly anchor: UiBox;
  readonly floating: { readonly width: number; readonly height: number };
  readonly viewport: { readonly width: number; readonly height: number };
  readonly side: UiSide;
  readonly align: UiAlign;
  /** Gap between the anchor and the overlay, px. */
  readonly offset: number;
  /** The overlay keeps this far from the viewport's edges, px. */
  readonly padding: number;
  readonly dir: 'ltr' | 'rtl';
}

export interface UiPlacement {
  /** The overlay's top-left corner, viewport px, 2 decimals. */
  readonly x: number;
  readonly y: number;
  /** The side it ended on, after any flip. */
  readonly side: UiSide;
  readonly align: UiAlign;
}

const OPPOSITE: Readonly<Record<UiSide, UiSide>> = { top: 'bottom', bottom: 'top', start: 'end', end: 'start' };

/** Held into `[padding, size − padding − extent]`, or at `padding` when it cannot fit. */
const shift = (at: number, extent: number, size: number, padding: number) => Math.max(padding, Math.min(at, size - padding - extent));

/**
 * Where an anchored overlay goes (REQ-493, I-35): on the preferred side of its anchor, flipped to the
 * opposite side when it does not fit there and fits there, aligned along the side, then shifted to
 * stay in the viewport. Pure.
 */
export function uiPlace(input: UiPlaceInput): UiPlacement {
  const { anchor: a, floating: f, viewport: v, align, offset, padding, dir } = input;
  const vertical = (side: UiSide) => side === 'top' || side === 'bottom';
  /** The physical left/right of a logical side. */
  const isLeft = (side: UiSide) => (side === 'start') === (dir === 'ltr');
  const main = (side: UiSide): number => {
    if (side === 'bottom') return a.y + a.height + offset;
    if (side === 'top') return a.y - offset - f.height;
    return isLeft(side) ? a.x - offset - f.width : a.x + a.width + offset;
  };
  const fits = (side: UiSide): boolean => {
    const at = main(side);
    const [extent, size] = vertical(side) ? [f.height, v.height] : [f.width, v.width];
    return at >= padding && at + extent <= size - padding;
  };
  const side = !fits(input.side) && fits(OPPOSITE[input.side]) ? OPPOSITE[input.side] : input.side;
  if (vertical(side)) {
    // Along a horizontal side, `start` is the reading start: the left edge in ltr, the right in rtl.
    const fromLeft = align === 'center' ? null : (align === 'start') === (dir === 'ltr');
    const x = fromLeft === null ? a.x + (a.width - f.width) / 2 : fromLeft ? a.x : a.x + a.width - f.width;
    return { x: round2(shift(x, f.width, v.width, padding)), y: round2(main(side)), side, align };
  }
  const y = align === 'center' ? a.y + (a.height - f.height) / 2 : align === 'start' ? a.y : a.y + a.height - f.height;
  return { x: round2(main(side)), y: round2(shift(y, f.height, v.height, padding)), side, align };
}
