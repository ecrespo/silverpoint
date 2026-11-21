/**
 * `@silverpoint/embed` — the DOM-free entry (API delta §1.5, §3): any chart from one JSON spec, as
 * an SVG or an HTML document, in any runtime. No DOM global is read here (DD-061, the lint rule).
 */
import { EB_GARAMOND_400 } from './render/fonts.generated';
import { createRenderToHTML } from './render/html';
import { createRenderToSVG, fontFace400 } from './render/svg';

export * from './api';
export { STANDALONE_INTEGRITY } from './integrity';

const face = (): string => fontFace400(EB_GARAMOND_400);
/** `render_chart`'s render: the canonical SVG with the ground's stylesheet (REQ-632, REQ-660). */
export const renderToSVG = /* @__PURE__ */ createRenderToSVG(face);
/** The chart root as a document or fragment, static or for a client to mount (REQ-633). */
export const renderToHTML = /* @__PURE__ */ createRenderToHTML(face);
