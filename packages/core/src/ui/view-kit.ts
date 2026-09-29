import type { CommonUiProps } from './types';
import type { UiAttrValue, UiBind, UiElement, UiNode, UiResolved, UiSlot } from './view';

export type Attrs = Record<string, UiAttrValue | undefined | false>;

/** Drops absent attributes: `undefined` and `false` are never written. */
function clean(attrs: Attrs): Record<string, UiAttrValue> {
  const out: Record<string, UiAttrValue> = {};
  for (const [name, value] of Object.entries(attrs)) if (value !== undefined && value !== false) out[name] = value;
  return out;
}

export const el = (tag: string, attrs: Attrs, children: readonly UiNode[] = [], bind?: UiBind): UiElement => ({
  tag,
  attrs: clean(attrs),
  children,
  ...(bind ? { bind } : {}),
});
export const text = (value: string): UiNode => ({ text: value });
export const slot = (name: UiSlot): UiNode => ({ slot: name });

export function root(slug: string, props: CommonUiProps, r: UiResolved, attrs: Attrs = {}): Attrs {
  return {
    class: ['sp-ui', `sp-${slug}`, `sp-ground-${r.ground}`, props.className].filter(Boolean).join(' '),
    'data-ground': r.ground,
    'data-substrate': r.substrate,
    'data-mode': r.mode,
    'data-size': r.size,
    'data-frame': String(r.frame),
    ...attrs,
  };
}

export type FrameKind = 'control' | 'pill' | 'box' | 'card' | 'round';
export const frame = (kind: FrameKind) => el('span', { part: 'sp-frame', 'data-kind': kind, 'aria-hidden': 'true' });
/** A tone by state (`primary`, `selected`…) or ramp level; ui.css maps a state to its ground's level. */
export const tone = (value: string, kind: FrameKind) => el('span', { part: 'sp-tone', 'data-tone': value, 'data-kind': kind, 'aria-hidden': 'true' });

/** Exact glyphs in a 16 × 16 box: their strokes are values, never inked (REQ-304, REQ-310). */
export const UI_GLYPHS = Object.freeze({
  tick: 'M3.5,8.5L6.5,11.5L12.5,4.5',
  dash: 'M4,8H12',
  cross: 'M4.5,4.5L11.5,11.5M11.5,4.5L4.5,11.5',
  warning: 'M8,2.5L14.5,13.5H1.5Z M8,6.5V9.5 M8,11.5V11.5',
  /** A radio's selection: filled by ui.css. */
  dot: 'M11,8A3,3 0 1,1 5,8A3,3 0 1,1 11,8Z',
  /** A Rate mark (C-2). */
  lozenge: 'M8,1.5L14.5,8L8,14.5L1.5,8Z',
  info: 'M14.5,8A6.5,6.5 0 1,1 1.5,8A6.5,6.5 0 1,1 14.5,8Z M8,7.5V11.5 M8,4.75V4.75',
});
export type UiGlyph = keyof typeof UI_GLYPHS;
export const glyph = (name: UiGlyph) => el('svg', { part: 'sp-mark', 'data-glyph': name, viewBox: '0 0 16 16', 'aria-hidden': 'true' }, [el('path', { d: UI_GLYPHS[name] })]);


/** Text for assistive technology only, hidden for sight as a native input is (REQ-314). */
export const sr = (value: string) => el('span', { class: 'sp-ui-sr' }, [text(value)]);

/** The id relations of a control derive from its `id`, else its `name` (REQ-329). */
export const baseOf = (props: { readonly id?: string; readonly name?: string }) => props.id ?? props.name;

/** A native radio or checkbox, hidden for sight: the control the adapter binds (REQ-314). */
export function nativeInput(type: 'checkbox' | 'radio', attrs: Attrs): UiElement {
  return el('input', { type, class: 'sp-ui-native', ...attrs }, [], 'native');
}
