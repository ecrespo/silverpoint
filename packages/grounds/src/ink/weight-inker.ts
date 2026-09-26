import type { Geometry, Inker, InkOptions, Stroke, ToneLevel } from '@silverpoint/core';

/**
 * Inks a geometry by line weight (REQ-028, TD DD-019). A toned shape becomes its own outline,
 * weighted by its tonal level, which the view writes as `data-weight` and the stylesheet turns
 * into a stroke width; every other stroke is returned as given. It hatches nothing and draws
 * nothing by hand: a cyanotype is a contact print, and its line is exact (Art. 1). It reads no
 * seed (Art. 4).
 */
function ink(geometry: Geometry, options: InkOptions): Geometry {
  const ramp = options.tonalRamp;
  const strokes = geometry.strokes.map((stroke): Stroke => {
    const step = stroke.tone && ramp ? ramp[stroke.tone as Exclude<ToneLevel, 0>] : undefined;
    if (step?.style !== 'weight' || !stroke.tone) return stroke;
    const { tone, ...outline } = stroke;
    return { ...outline, paint: 'stroke', weight: tone };
  });
  return { ...geometry, strokes };
}

/** The `cyanotype` ground's inker, registered under the name its tokens declare. */
export const WeightInker: Inker = Object.freeze({ name: 'weight', ink });
