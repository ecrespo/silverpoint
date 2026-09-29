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
import { baseOf, el, frame, glyph, root, slot, text, tone } from './view-kit';

export { UI_GLYPHS, type UiGlyph } from './view-kit';

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
  /** What an adapter binds to the element: see `UiBind`. */
  readonly bind?: UiBind;
}

/**
 * `native`: a control an adapter binds value, events and forms to —one, or one per item of a
 * composite, told apart by its `value` or `data-key`. `close`: the button that emits `close`.
 */
export type UiBind = 'native' | 'close';

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
