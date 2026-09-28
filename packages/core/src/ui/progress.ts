import { circlePath } from '../charts/shared/format';
import { arcPath, type PolarFrame } from '../charts/shared/polar';
import { roundPathData } from '../render/round';
import type { Stroke } from '../types';

/** The circle Progress draws in a fixed 100 × 100 view box (DD-025). */
export const UI_PROGRESS_VIEWBOX = 100;

/**
 * The circle Progress: the exact track and the exact filled arc, from 12 o'clock clockwise, on the
 * charts' polar engine. Both are `encoding`, so no inker touches them (REQ-304). `stroke` is the
 * ring's width in view-box units; the ring is inset by half of it so nothing is clipped.
 */
export function uiProgressArc(fraction: number, stroke: number): { readonly track: Stroke; readonly fill: Stroke } {
  const centre = UI_PROGRESS_VIEWBOX / 2;
  const radius = centre - stroke / 2;
  const frame: PolarFrame = { cx: centre, cy: centre, radius };
  const f = Number.isFinite(fraction) ? Math.min(Math.max(fraction, 0), 1) : 0;
  return {
    track: { d: roundPathData(circlePath(centre, centre, radius)), role: 'encoding', part: 'rule' },
    fill: { d: roundPathData(arcPath(frame, radius, 0, f * 2 * Math.PI)), role: 'encoding', part: 'ink' },
  };
}
