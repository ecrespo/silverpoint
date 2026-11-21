/** The `full` files' faces: EB Garamond 400, 500 and 400 italic from inlined data (REQ-647, DD-062). */
import { provideEmbeddedFonts } from '../client/fonts';
import { EB_GARAMOND_400, EB_GARAMOND_400_ITALIC, EB_GARAMOND_500 } from '../render/fonts.generated';
import { fontFace400 } from '../render/svg';

const face = (style: string, weight: number, base64: string): string =>
  `@font-face{font-family:'EB Garamond';font-style:${style};font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${base64}) format('woff2')}`;

/** Called first by the `full` entries: a call, not a bare import, so no bundler drops it. */
export function installFullFonts(): void {
  provideEmbeddedFonts(face('normal', 400, EB_GARAMOND_400) + face('normal', 500, EB_GARAMOND_500) + face('italic', 400, EB_GARAMOND_400_ITALIC), fontFace400(EB_GARAMOND_400));
}
