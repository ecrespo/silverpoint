/**
 * The DOM-free surface every build shares — validation, the render, the registry, the version —
 * without the two renderers, which each build binds to the face it carries (DD-062).
 */
export type { ChartSpec, EmbedDiagnostic, SpecError, SpecResult } from './spec/types';
export type { SVGOptions } from './render/svg';
export type { HTMLOptions } from './render/html';
export { validateSpec, specErrorMessage } from './spec/validate';
export { renderSpec } from './render/render-spec';
export { CHART_SLUGS } from './registry';
export { VERSION } from './render/assets.generated';
