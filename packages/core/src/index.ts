export type * from './types';

export { round2, roundPathData, roundGeometry } from './render/round';
export { serializeGeometry, parseGeometry, pathBytes, PATH_BYTE_BUDGET } from './render/serialize';
export { fnv1a32, deriveSeed, resolveSeed } from './render/seed';
export { enforceHeightening } from './render/heighten';
export { svgString, toSvgView, type PathView, type PatternView, type SvgView, type TextView, type ViewStyle } from './render/view';

export {
  diagnose,
  SilverpointError,
  __setDiagnosticSink,
  type DiagnosticSink,
  type Detail,
  type SpCode,
} from './diagnostics/diagnose';
export { checkTypeface, DISPLAY_FACE_PROBE, type FontFaceSetLike } from './diagnostics/typeface';

export { extent, min, max } from './scales/util';
export {
  bandScale,
  expandDomain,
  linearScale,
  type BandScale,
  type LinearScale,
  type ScaleSite,
} from './scales/scales';

export { NullInker } from './ink/null-inker';
export { registerInker, resolveInker } from './ink/registry';

export {
  DEFAULTS,
  FORCED_PRECISION_QUERY,
  instanceId,
  resolveConfig,
  type ResolvedConfig,
} from './config/resolve';

export { lineChart } from './charts/line-chart/line-chart';
export { LINE_CHART_DEMO, LINE_CHART_DEMO_KEYS } from './charts/line-chart/demo';
export { circlePath } from './charts/shared/format';

export {
  MIN_TOUCH_TARGET,
  NAVIGATION_KEYS,
  readout,
  resolveActive,
  stepActive,
  toSvgPoint,
  type PointerKind,
  type Readout,
} from './interaction/hit-test';
