/**
 * `renderToSVG` (REQ-632, REQ-660): `render_chart`'s function moved here — the canonical markup with
 * the ground's stylesheet as the root's first child, and nothing else changed.
 */
import { toSVGString } from '@silverpoint/grounds';
import type { ChartSpec, SpecResult } from '../spec/types';
import { GROUND_CSS } from './assets.generated';
import { renderSpec } from './render-spec';

export interface SVGOptions {
  /** EB Garamond 400 as a data URI, as `render_chart` does. */
  readonly embedFonts?: boolean;
}

/** `@font-face` text for the regular cut, or `undefined` in a build that carries no face. */
export type FaceSource = () => string | undefined;

export const fontFace400 = (base64: string): string =>
  `@font-face{font-family:'EB Garamond';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,${base64}) format('woff2')}`;

/** The stylesheet a standalone render carries; with `embedFonts`, the face first. */
export function standaloneStyle(embedFonts: boolean | undefined, face: FaceSource): { readonly css: string; readonly missingFace: boolean } {
  if (!embedFonts) return { css: GROUND_CSS, missingFace: false };
  const css = face();
  return css === undefined ? { css: GROUND_CSS, missingFace: true } : { css: `${css}${GROUND_CSS}`, missingFace: false };
}

const MISSING_FACE = {
  code: 'SP013',
  severity: 'warn' as const,
  message: '[SP013] embedFonts: this build carries no face (silverpoint-embed.js); the system stack is drawn. Use silverpoint-embed.full.js or the package module to embed EB Garamond.',
};

/** Builds `renderToSVG` over a face source: the package and the `full` file carry one, the base file none (DD-062). */
export function createRenderToSVG(face: FaceSource) {
  return function renderToSVG(spec: ChartSpec | string, options: SVGOptions = {}): SpecResult<{ svg: string; width: number; height: number }> {
    const rendered = renderSpec(spec);
    if (!rendered.ok) return rendered;
    const markup = toSVGString(rendered.value);
    const open = markup.indexOf('>') + 1;
    const style = standaloneStyle(options.embedFonts, face);
    const { width, height } = rendered.value.geometry.viewBox;
    return {
      ok: true,
      value: { svg: `${markup.slice(0, open)}<style>${style.css}</style>${markup.slice(open)}`, width, height },
      diagnostics: style.missingFace ? [...rendered.diagnostics, MISSING_FACE] : rendered.diagnostics,
    };
  };
}
