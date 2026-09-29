import { DEFAULTS } from '../config/resolve';
import type { InkMode, ProviderConfig, SubstrateName } from '../types';
import { uiFrameVariant } from './frame';
import { uiRequireName } from './names';
import type {
  CommonUiProps,
  SpButtonProps,
  SpCardProps,
  SpCheckboxProps,
  SpDividerProps,
  SpInputProps,
  SpSwitchProps,
  UiSize,
} from './types';

/**
 * The markup contract of the UI components (API delta §4), as data: every adapter writes this tree
 * and nothing else, and the parity gate compares each adapter's server render with it (REQ-327).
 * An adapter binds behaviour —value, events, forms— to the elements marked `bind`, and puts the
 * consumer's content where a `slot` stands. It computes nothing (Art. 2).
 */
export type UiAttrValue = string | true;

export interface UiElement {
  readonly tag: string;
  /** HTML attribute names; `true` is a boolean attribute. */
  readonly attrs: Readonly<Record<string, UiAttrValue>>;
  readonly children: readonly UiNode[];
  /** `native`: the control an adapter binds value, events and forms to. */
  readonly bind?: 'native';
}

export type UiSlot = 'content' | 'prefix' | 'suffix' | 'extra' | 'footer';
export type UiNode = UiElement | { readonly text: string } | { readonly slot: UiSlot };

/** What a component inherits around it: the provider, the dashboard cell, the environment. */
export interface UiEnvironment {
  readonly provider?: ProviderConfig;
  /** The configuration of the dashboard whose cell holds the component (REQ-311). */
  readonly cell?: ProviderConfig;
  /** `prefers-contrast: more` or `forced-colors: active` holds (REQ-123). */
  readonly forcedPrecision?: boolean;
}

export interface UiResolved {
  readonly ground: string;
  readonly substrate: SubstrateName;
  readonly mode: InkMode;
  readonly size: UiSize;
  /** 0..5: `ui.css` folds it onto the variants the ground draws. */
  readonly frame: number;
}

/** The most frame variants a ground may draw (Data Model §3.8); the runtime needs no ground tokens. */
const FRAME_SLOTS = 6;

/**
 * Ground, substrate and mode with the charts' precedence: prop, then dashboard, then provider,
 * then the library default; a forced `precision` applies after, and nothing overrides it (REQ-311).
 */
export function resolveUi(props: CommonUiProps, env: UiEnvironment): UiResolved {
  const { provider = {}, cell = {} } = env;
  const ground = props.ground ?? cell.ground ?? provider.ground ?? DEFAULTS.ground;
  return {
    ground: typeof ground === 'string' ? ground : ground.name,
    substrate: props.substrate ?? cell.substrate ?? provider.substrate ?? DEFAULTS.substrate,
    mode: env.forcedPrecision ? 'precision' : (props.mode ?? cell.mode ?? provider.mode ?? DEFAULTS.mode),
    size: props.size ?? 'md',
    frame: uiFrameVariant(props.seed, props.id, FRAME_SLOTS),
  };
}

type Attrs = Record<string, UiAttrValue | undefined | false>;

/** Drops absent attributes: `undefined` and `false` are never written. */
function clean(attrs: Attrs): Record<string, UiAttrValue> {
  const out: Record<string, UiAttrValue> = {};
  for (const [name, value] of Object.entries(attrs)) if (value !== undefined && value !== false) out[name] = value;
  return out;
}

const el = (tag: string, attrs: Attrs, children: readonly UiNode[] = [], bind?: 'native'): UiElement => ({
  tag,
  attrs: clean(attrs),
  children,
  ...(bind ? { bind } : {}),
});
const text = (value: string): UiNode => ({ text: value });
const slot = (name: UiSlot): UiNode => ({ slot: name });

function root(slug: string, props: CommonUiProps, r: UiResolved, attrs: Attrs = {}): Attrs {
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

type FrameKind = 'control' | 'pill' | 'box' | 'card' | 'round';
const frame = (kind: FrameKind) => el('span', { part: 'sp-frame', 'data-kind': kind, 'aria-hidden': 'true' });
/** A tone by state (`primary`, `selected`…) or ramp level; ui.css maps a state to its ground's level. */
const tone = (value: string, kind: FrameKind) => el('span', { part: 'sp-tone', 'data-tone': value, 'data-kind': kind, 'aria-hidden': 'true' });

/** Exact glyphs in a 16 × 16 box: their strokes are values, never inked (REQ-304, REQ-310). */
export const UI_GLYPHS = Object.freeze({
  tick: 'M3.5,8.5L6.5,11.5L12.5,4.5',
  dash: 'M4,8H12',
  cross: 'M4.5,4.5L11.5,11.5M11.5,4.5L4.5,11.5',
  warning: 'M8,2.5L14.5,13.5H1.5Z M8,6.5V9.5 M8,11.5V11.5',
});
export type UiGlyph = keyof typeof UI_GLYPHS;
const glyph = (name: UiGlyph) => el('svg', { part: 'sp-mark', 'data-glyph': name, viewBox: '0 0 16 16', 'aria-hidden': 'true' }, [el('path', { d: UI_GLYPHS[name] })]);

/** `SpButton`: a native `<button>`, or `<a>` with `href` (REQ-314, REQ-310). */
export function uiButtonView(props: SpButtonProps, r: UiResolved, content: { readonly text?: string }): UiElement {
  uiRequireName('SpButton', content.text, props.label);
  const variant = props.variant ?? 'default';
  const link = props.href !== undefined;
  const toned = props.disabled ? 'disabled' : variant === 'default' ? undefined : variant;
  return el(
    link ? 'a' : 'button',
    root('button', props, r, {
      id: props.id,
      type: link ? undefined : (props.type ?? 'button'),
      href: link && !props.disabled ? props.href : undefined,
      disabled: !link && props.disabled === true,
      'aria-disabled': link && props.disabled ? 'true' : undefined,
      'aria-label': props.label,
      'data-variant': variant,
      'data-block': props.block ? 'true' : undefined,
    }),
    [
      frame('control'),
      ...(toned ? [tone(toned, 'control')] : []),
      ...(variant === 'danger' ? [glyph('cross')] : []),
      el('span', { class: toned ? 'sp-ui-label sp-ui-plate' : 'sp-ui-label' }, [slot('content')]),
    ],
  );
}

/** The id relations of a control derive from its `id`, else its `name` (REQ-329). */
const baseOf = (props: { readonly id?: string; readonly name?: string }) => props.id ?? props.name;

/** `SpInput`: a native `<input>` in a framed box, its message after it (REQ-314, REQ-334). */
export function uiInputView(
  props: SpInputProps,
  r: UiResolved,
  state: { readonly value: string; readonly prefix?: boolean; readonly suffix?: boolean },
): UiElement {
  const base = baseOf(props);
  const message = props.message ? props.message : undefined;
  const messageId = message && base ? `${base}--message` : undefined;
  return el('span', root('input', props, r, { 'data-invalid': props.invalid ? 'true' : undefined }), [
    el('span', { class: 'sp-ui-box' }, [
      frame('control'),
      ...(state.prefix ? [el('span', { class: 'sp-ui-affix', 'data-slot': 'prefix' }, [slot('prefix')])] : []),
      el(
        'input',
        {
          class: 'sp-ui-control',
          id: props.id,
          type: props.type ?? 'text',
          name: props.name,
          value: state.value,
          placeholder: props.placeholder,
          disabled: props.disabled === true,
          readonly: props.readOnly === true,
          'aria-label': props.label,
          'aria-invalid': props.invalid ? 'true' : undefined,
          'aria-describedby': messageId,
        },
        [],
        'native',
      ),
      ...(state.suffix ? [el('span', { class: 'sp-ui-affix', 'data-slot': 'suffix' }, [slot('suffix')])] : []),
      ...(props.invalid ? [glyph('warning')] : []),
    ]),
    ...(message ? [el('span', { class: 'sp-ui-message', id: messageId }, [text(message)])] : []),
  ]);
}

/** A native checkbox, hidden for sight, first in its `<label>` (REQ-314). */
function nativeCheckbox(props: { readonly id?: string; readonly name?: string; readonly disabled?: boolean }, checked: boolean, role?: 'switch') {
  return el(
    'input',
    { type: 'checkbox', class: 'sp-ui-native', role, id: props.id, name: props.name, checked, disabled: props.disabled === true },
    [],
    'native',
  );
}

/** `SpCheckbox`: native state; the tick and dash are drawn and shown by it (REQ-310). */
export function uiCheckboxView(props: SpCheckboxProps, r: UiResolved, state: { readonly checked: boolean }): UiElement {
  return el('label', root('checkbox', props, r, { 'data-indeterminate': props.indeterminate ? 'true' : undefined }), [
    nativeCheckbox(props, state.checked),
    el('span', { class: 'sp-ui-box', 'aria-hidden': 'true' }, [frame('box'), tone('selected', 'box'), glyph('tick'), glyph('dash')]),
    el('span', { class: 'sp-ui-label' }, [text(props.label)]),
  ]);
}

/** `SpSwitch`: a native checkbox with `role="switch"`, a pill track and an exact knob (REQ-314). */
export function uiSwitchView(props: SpSwitchProps, r: UiResolved, state: { readonly checked: boolean }): UiElement {
  return el('label', root('switch', props, r), [
    nativeCheckbox(props, state.checked, 'switch'),
    el('span', { class: 'sp-ui-track', 'aria-hidden': 'true' }, [frame('pill'), tone('selected', 'pill'), el('span', { part: 'sp-knob' })]),
    el('span', { class: 'sp-ui-label' }, [text(props.label)]),
  ]);
}

/** `SpCard`: an `<article>` named by its heading, or a `<section>` without a title (REQ-318). */
export function uiCardView(props: SpCardProps, r: UiResolved, slots: { readonly extra?: boolean; readonly footer?: boolean }): UiElement {
  const titled = props.title !== undefined;
  const titleId = titled && props.id ? `${props.id}--title` : undefined;
  const header = titled || slots.extra;
  return el(
    titled ? 'article' : 'section',
    root('card', props, r, { id: props.id, 'aria-labelledby': titleId, 'aria-label': titled && !titleId ? props.title : undefined }),
    [
      frame('card'),
      ...(header
        ? [
            el('div', { class: 'sp-ui-card-header' }, [
              ...(titled ? [el(`h${props.headingLevel ?? 3}`, { class: 'sp-ui-card-title', id: titleId }, [text(props.title!)])] : []),
              ...(slots.extra ? [el('div', { class: 'sp-ui-card-extra' }, [slot('extra')])] : []),
            ]),
            el('span', { part: 'sp-rule', 'aria-hidden': 'true' }),
          ]
        : []),
      el('div', { class: 'sp-ui-card-body' }, [slot('content')]),
      ...(slots.footer ? [el('div', { class: 'sp-ui-card-footer' }, [slot('footer')])] : []),
    ],
  );
}

/** `SpDivider`: a `separator`; with text, the text between two rules (REQ-318). */
export function uiDividerView(props: SpDividerProps, r: UiResolved): UiElement {
  const vertical = props.orientation === 'vertical';
  const rule = () => el('span', { part: 'sp-rule', 'aria-hidden': 'true' });
  return el(
    'div',
    root('divider', props, r, {
      id: props.id,
      role: 'separator',
      'aria-orientation': vertical ? 'vertical' : undefined,
      'data-orientation': vertical ? 'vertical' : 'horizontal',
      'data-align': props.text ? (props.align ?? 'center') : undefined,
    }),
    props.text ? [rule(), el('span', { class: 'sp-ui-divider-text' }, [text(props.text)]), rule()] : [rule()],
  );
}
