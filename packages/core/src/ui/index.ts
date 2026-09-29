/**
 * `@silverpoint/core/ui`: the framework-neutral half of the UI components (feature-002) — types,
 * catalog, value geometry, keyboard transitions, frame variants and checks. A subpath of its own,
 * so the charts' bundle is unchanged and the UI runtime is measured apart (REQ-330).
 */
export type * from './types';
export { UI_COMPONENTS, type UiComponentRow, type UiGroup } from './catalog';
export { uiRateCount, uiValue, type UiRange, type UiValue } from './value';
export { UI_PROGRESS_VIEWBOX, uiProgressArc } from './progress';
export { uiSteps, type UiStep } from './steps';
export { uiRovingKey, type UiRovingKey, type UiRovingState } from './keyboard';
export { UI_FRAME_KINDS, uiFrameOutline, uiFrameVariant, type UiFrameKind } from './frame';
export { uiItems } from './items';
export { uiRequireName } from './names';
export { resolveUiTokens, UI_TOKEN_DEFAULTS } from './tokens';
export { uiToneTile, type UiToneLayer } from './tone';
export {
  resolveUi,
  UI_GLYPHS,
  uiButtonView,
  uiCardView,
  uiCheckboxView,
  uiDividerView,
  uiInputView,
  uiSwitchView,
  type UiAttrValue,
  type UiElement,
  type UiEnvironment,
  type UiGlyph,
  type UiNode,
  type UiResolved,
  type UiSlot,
} from './view';
