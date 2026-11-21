/**
 * The faces a build carries (REQ-647, DD-062): the `full` standalone files provide EB Garamond's
 * three cuts as one `@font-face` sheet from inlined data, and the regular cut for `embedFonts`; the
 * module build and the base file carry none, so their default is `'none'` and the ground's fallback
 * stack draws. Nothing is ever fetched.
 */
let embedded: string | undefined;
let regular: string | undefined;

/** Called once by the `full` entries; `undefined` clears it (tests). */
export function provideEmbeddedFonts(css: string | undefined, regularFace?: string): void {
  embedded = css;
  regular = css === undefined ? undefined : regularFace;
}

export const embeddedFonts = (): string | undefined => embedded;
/** The regular cut's `@font-face`, for `embedFonts` in a standalone build. */
export const embeddedRegularFace = (): string | undefined => regular;

/** The font text a mount adopts with the stylesheet. */
export function fontsFor(option: 'embedded' | 'none' | undefined): string {
  const wanted = option ?? (embedded ? 'embedded' : 'none');
  return wanted === 'embedded' && embedded ? embedded : '';
}
