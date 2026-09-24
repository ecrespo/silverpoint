import { diagnose } from './diagnose';

/** The subset of `FontFaceSet` the check needs; injected so the core stays DOM-free. */
export interface FontFaceSetLike {
  load(font: string): Promise<readonly unknown[]>;
  check(font: string): boolean;
}

/** Font shorthand used to probe the display face. */
export const DISPLAY_FACE_PROBE = '16px "EB Garamond"';

/**
 * Checks that the display typeface loaded. On failure it reports SP013 and resolves `false`;
 * it never throws and never blocks the render (REQ-032).
 */
export async function checkTypeface(
  fonts: FontFaceSetLike,
  chart: string,
  face: string = DISPLAY_FACE_PROBE,
): Promise<boolean> {
  let loaded: boolean;
  try {
    const faces = await fonts.load(face);
    loaded = faces.length > 0 && fonts.check(face);
  } catch {
    loaded = false;
  }
  if (!loaded && process.env.NODE_ENV !== 'production') {
    diagnose('SP013', chart, { property: 'font-family', message: `Probe: ${face}.` });
  }
  return loaded;
}
