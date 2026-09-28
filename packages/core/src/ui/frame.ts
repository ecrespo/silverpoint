import { roundPathData } from '../render/round';
import { resolveSeed } from '../render/seed';
import type { Geometry, Seed } from '../types';

export type UiFrameKind = 'control' | 'pill' | 'box' | 'card' | 'round';

/**
 * Each frame kind is drawn once in a square box and cut into slices for the grounds build
 * (DD-022): four corners of `slice` px, and four edges between them when `size > 2 * slice`.
 * `round` and `box` have no edges; they frame fixed-size squares.
 */
export const UI_FRAME_KINDS: Readonly<Record<UiFrameKind, Readonly<{ size: number; slice: number; radius: number }>>> =
  /* @__PURE__ */ Object.freeze({
    control: Object.freeze({ size: 24, slice: 8, radius: 2 }),
    pill: Object.freeze({ size: 36, slice: 12, radius: 12 }),
    box: Object.freeze({ size: 16, slice: 8, radius: 2 }),
    card: Object.freeze({ size: 48, slice: 16, radius: 2 }),
    round: Object.freeze({ size: 24, slice: 12, radius: 12 }),
  });

/** A ground generates at most this many frame variants per kind (Data Model §3.8). */
const MAX_VARIANTS = 6;

/**
 * The frame variant of a component: from `seed`, else `id`, by the charts' seed rule; `0` with
 * neither (REQ-307, I-21). Never from mount order, randomness or time (Art. 4). `variants` is read
 * as an integer in 1..6.
 */
export function uiFrameVariant(seed: Seed | undefined, id: string | undefined, variants: number): number {
  const n = Number.isFinite(variants) ? Math.min(Math.max(Math.floor(variants), 1), MAX_VARIANTS) : 1;
  if (seed === undefined && !id) return 0;
  return resolveSeed(seed, id ?? '') % n;
}

/** Half the hairline: the outline is inset so its stroke stays inside the box. */
const INSET = 0.5;

function roundedSquare(size: number, radius: number): string {
  const lo = INSET;
  const hi = size - INSET;
  const r = Math.min(radius, (hi - lo) / 2);
  const arc = (x: number, y: number) => `A${r},${r},0,0,1,${x},${y}`;
  return (
    `M${lo + r},${lo}H${hi - r}${arc(hi, lo + r)}V${hi - r}${arc(hi - r, hi)}` +
    `H${lo + r}${arc(lo, hi - r)}V${lo + r}${arc(lo + r, lo)}Z`
  );
}

/**
 * The exact outline of a frame kind: the input the grounds build inks, once per variant, into the
 * pieces of `ui.css` (DD-022). It is an `ornament` stroke —a frame carries no value (Art. 1, as
 * amended)— so the ground's inker may draw it by hand, with its vertices preserved. Build time only.
 */
export function uiFrameOutline(kind: UiFrameKind): Geometry {
  const { size, radius } = UI_FRAME_KINDS[kind];
  const box = { x: 0, y: 0, width: size, height: size };
  return {
    viewBox: box,
    plot: box,
    strokes: [{ d: roundPathData(roundedSquare(size, radius)), role: 'ornament', part: 'ink' }],
    labels: [],
    hitAreas: [],
    defs: [],
  };
}
