import { round2 } from '../render/round';
import type { Stroke, ToneSpec } from '../types';

/** One repeating layer of a control's tone: a tile the grounds build inks and lays as a CSS mask. */
export interface UiToneLayer {
  readonly width: number;
  readonly height: number;
  readonly strokes: readonly Stroke[];
}

const RAD = Math.PI / 180;
const EPSILON = 1e-6;

/** About this many px of lines per tile side: enough for hand variation, few enough to stay light. */
const TILE_SPAN = 24;

/**
 * One family of parallel lines at `angle`, `gap` apart, clipped to the rectangle that is its own
 * period: shifting the tile by its width or its height lands every line on another line of the
 * family, so the tile repeats without a seam although the lines are not axis-aligned (a CSS mask
 * cannot rotate a repeating image, as an SVG pattern can).
 */
function family(gap: number, angle: number): UiToneLayer {
  const sin = Math.sin(angle * RAD);
  const cos = Math.cos(angle * RAD);
  const lines = Math.max(2, Math.round(TILE_SPAN / gap));
  const width = Math.abs(sin) < EPSILON ? lines * gap : (lines * gap) / Math.abs(sin);
  const height = Math.abs(cos) < EPSILON ? lines * gap : (lines * gap) / Math.abs(cos);
  // A point's offset across the family: lines sit at (k + ½)·gap, so none grazes a corner.
  const offset = (x: number, y: number) => -sin * x + cos * y;
  const corners = [offset(0, 0), offset(width, 0), offset(0, height), offset(width, height)];
  const first = Math.ceil(Math.min(...corners) / gap - 0.5);
  const last = Math.floor(Math.max(...corners) / gap - 0.5);
  const strokes: Stroke[] = [];
  for (let k = first; k <= last; k++) {
    const c = (k + 0.5) * gap;
    // Points of the line: c·n + t·d, with n = (−sin, cos) and d = (cos, sin).
    const at = (t: number) => ({ x: -sin * c + cos * t, y: cos * c + sin * t, t });
    const hits = [
      Math.abs(cos) > EPSILON ? [(0 + sin * c) / cos, (width + sin * c) / cos] : [],
      Math.abs(sin) > EPSILON ? [(0 - cos * c) / sin, (height - cos * c) / sin] : [],
    ]
      .flat()
      .map(at)
      .filter((p) => p.x >= -EPSILON && p.x <= width + EPSILON && p.y >= -EPSILON && p.y <= height + EPSILON)
      .sort((a, b) => a.t - b.t);
    const from = hits[0];
    const to = hits.at(-1);
    if (!from || !to || to.t - from.t < EPSILON * 1e3) continue;
    const clamp = (v: number, hi: number) => round2(Math.min(Math.max(v, 0), hi));
    const w = round2(width);
    const h = round2(height);
    strokes.push({
      d: `M${clamp(from.x, w)},${clamp(from.y, h)}L${clamp(to.x, w)},${clamp(to.y, h)}`,
      role: 'ornament',
      part: 'ink',
    });
  }
  return { width: round2(width), height: round2(height), strokes };
}

/**
 * The tone of a control at one step of a ground's ramp (DD-026, REQ-308): one layer of hachure,
 * two for cross-hatch (each its own period, laid as two mask layers), none for a `weight` step,
 * whose tone is the frame's line weight. Its lines are `ornament`: a tone is not a value, so the
 * ground's inker may draw them by hand, vertices preserved. Build time only. Pure.
 */
export function uiToneTile(spec: ToneSpec): readonly UiToneLayer[] {
  if (spec.style === 'weight') return [];
  const layers = [family(spec.gap, spec.angle)];
  if (spec.style === 'cross-hatch') layers.push(family(spec.gap, spec.angle + 90));
  return layers;
}
