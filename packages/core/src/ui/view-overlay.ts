import { diagnose } from '../diagnostics/diagnose';
import { uiItems, uiSelectedKey } from './items';
import { uiRequireName } from './names';
import type {
  AlertKind,
  MenuEntry,
  SpDrawerProps,
  SpDropdownMenuProps,
  SpModalProps,
  SpPopoverProps,
  SpSelectProps,
  SpToasterProps,
  SpToastProps,
  SpTooltipProps,
  UiItem,
} from './types';
import { cssLength, el, frame, glyph, iconClose, root, slot, text } from './view-kit';
import type { UiElement, UiNode, UiResolved } from './view';

/*
 * The overlays (API delta §4, DD-038): native `<dialog>` and the Popover API. The server markup
 * carries `data-state` and the full content, never the `open` attribute (a `<dialog open>` is
 * non-modal) nor a position: the adapter calls `showModal()`/`showPopover()` after hydration, then
 * `uiAnchor` (REQ-502). In an open list the active item is the one heightened (REQ-498, I-28).
 */

const heighten = () => el('span', { part: 'sp-heighten', 'aria-hidden': 'true' });
const state = (open: boolean) => (open ? 'open' : 'closed');
const style = (property: string, value: string | undefined) => (value !== undefined ? `${property}:${value}` : undefined);
const label = (value: string, plate: boolean) => el('span', { class: plate ? 'sp-ui-label sp-ui-plate' : 'sp-ui-label' }, [text(value)]);

export type UiTriggerKind = 'dialog' | 'popover' | 'menu' | 'tooltip';

/** Where a consumer's trigger goes: the adapter binds the element inside it (REQ-500). */
export function uiTriggerView(): UiElement {
  return el('span', { class: 'sp-ui-trigger' }, [slot('trigger')], 'trigger');
}

const CONTROLS: Record<Exclude<UiTriggerKind, 'tooltip'>, [popup: string, part: string]> = {
  dialog: ['dialog', 'dialog'],
  popover: ['dialog', 'popover'],
  menu: ['menu', 'menu'],
};

/**
 * The ARIA an overlay sets on a consumer's trigger, at runtime (REQ-500): `aria-haspopup`,
 * `aria-expanded` and `aria-controls` as its APG pattern asks; a tooltip's `aria-describedby`.
 * The relations need the instance `id`.
 */
export function uiTriggerAria(kind: UiTriggerKind, id: string | undefined, open: boolean): Readonly<Record<string, string>> {
  if (kind === 'tooltip') return id ? { 'aria-describedby': `${id}--tooltip` } : {};
  const [popup, part] = CONTROLS[kind];
  return { 'aria-haspopup': popup, 'aria-expanded': String(open), ...(id ? { 'aria-controls': `${id}--${part}` } : {}) };
}

/** A Select's items: a string is its own key and label; repeated keys skipped, `SP019` (REQ-325). */
export function uiSelectItems(items: readonly (string | UiItem)[]): readonly UiItem[] {
  return uiItems(
    items.map((item) => (typeof item === 'string' ? { key: item, label: item } : item)),
    'SpSelect',
  );
}

const actionable = (entry: MenuEntry): entry is Extract<MenuEntry, { readonly label: string; readonly type?: 'item' }> =>
  entry.type === undefined || entry.type === 'item';

/** A menu's actionable items, in order: what `uiListKey` and `uiTypeahead` move over (REQ-495). */
export function uiMenuItems(entries: readonly MenuEntry[]): readonly UiItem[] {
  return uiItems(entries, 'SpDropdownMenu')
    .filter(actionable)
    .map((entry) => ({ key: entry.key, label: entry.label, ...(entry.disabled ? { disabled: true } : {}) }));
}

/** How long a toast stays: its own duration, the toaster's, or 5000 ms; at least 1000 or `Infinity` (Data Model §2.27). */
export function uiToastDuration(duration: number | undefined, toaster?: number): number {
  const ms = duration ?? toaster ?? 5000;
  if (ms === Infinity || (Number.isFinite(ms) && ms >= 1000)) return ms;
  if (process.env.NODE_ENV !== 'production') diagnose('SP017', 'SpToast', { property: 'duration', message: `${ms} ms is drawn as 1000 ms.` });
  return 1000;
}

/** The dialog of Modal and Drawer: header, rule, description, body, footer (REQ-491). */
function dialog(
  component: string,
  slug: string,
  props: SpModalProps,
  r: UiResolved,
  open: boolean,
  footer: boolean,
  attrs: Record<string, string | undefined>,
): UiElement {
  uiRequireName(component, props.title, props.label);
  const { id, title } = props;
  const titleId = title !== undefined && id ? `${id}--title` : undefined;
  const descriptionId = props.description && id ? `${id}--description` : undefined;
  const closable = props.closable !== false;
  const header = title !== undefined || closable;
  return el(
    'dialog',
    root(slug, props, r, {
      id: id ? `${id}--dialog` : undefined,
      'aria-labelledby': titleId,
      'aria-label': titleId ? undefined : (title ?? props.label),
      'aria-describedby': descriptionId,
      'data-state': state(open),
      ...attrs,
    }),
    [
      frame('card'),
      ...(header
        ? [
            el('div', { class: 'sp-ui-overlay-header' }, [
              ...(title !== undefined ? [el('h2', { class: 'sp-ui-overlay-title', id: titleId }, [text(title)])] : []),
              ...(closable ? [iconClose(props.closeLabel ?? 'Close')] : []),
            ]),
            el('span', { part: 'sp-rule', 'aria-hidden': 'true' }),
          ]
        : []),
      ...(props.description ? [el('p', { class: 'sp-ui-overlay-description', id: descriptionId }, [text(props.description)])] : []),
      el('div', { class: 'sp-ui-overlay-body' }, [slot('content')]),
      ...(footer ? [el('div', { class: 'sp-ui-overlay-footer' }, [slot('footer')])] : []),
    ],
    'dialog',
  );
}

/** `SpModal`: a native dialog opened with `showModal()` (REQ-491). */
export function uiModalView(props: SpModalProps, r: UiResolved, s: { readonly open: boolean }, slots: { readonly footer?: boolean }): UiElement {
  return dialog('SpModal', 'modal', props, r, s.open, slots.footer === true, {
    style: style('--sp-ui-overlay-width', cssLength(props.width, 'SpModal', 'width')),
  });
}

/** `SpDrawer`: the same dialog on a logical side (REQ-491, REQ-523). */
export function uiDrawerView(props: SpDrawerProps, r: UiResolved, s: { readonly open: boolean }, slots: { readonly footer?: boolean }): UiElement {
  return dialog('SpDrawer', 'drawer', props, r, s.open, slots.footer === true, {
    'data-side': props.side ?? 'end',
    style: style('--sp-ui-drawer-extent', cssLength(props.extent, 'SpDrawer', 'extent')),
  });
}

/** `SpPopover`: an `auto` popover with the dialog role (REQ-492). */
export function uiPopoverView(props: SpPopoverProps, r: UiResolved, s: { readonly open: boolean }): UiElement {
  uiRequireName('SpPopover', props.title, props.label);
  const { id, title } = props;
  const titleId = title !== undefined && id ? `${id}--title` : undefined;
  const header = title !== undefined || props.closable === true;
  return el(
    'div',
    root('popover', props, r, {
      id: id ? `${id}--popover` : undefined,
      popover: 'auto',
      role: 'dialog',
      'aria-labelledby': titleId,
      'aria-label': titleId ? undefined : (title ?? props.label),
      'data-state': state(s.open),
      style: style('--sp-ui-overlay-width', cssLength(props.width, 'SpPopover', 'width')),
    }),
    [
      frame('card'),
      ...(header
        ? [
            el('div', { class: 'sp-ui-overlay-header' }, [
              ...(title !== undefined ? [el('div', { class: 'sp-ui-overlay-title', id: titleId }, [text(title)])] : []),
              ...(props.closable ? [iconClose(props.closeLabel ?? 'Close')] : []),
            ]),
          ]
        : []),
      el('div', { class: 'sp-ui-overlay-body' }, [slot('content')]),
    ],
    'popover',
  );
}

/** `SpTooltip`: a `manual` popover, so it never closes an open `auto` one (REQ-492, REQ-496). */
export function uiTooltipView(props: SpTooltipProps, r: UiResolved, s: { readonly open: boolean }): UiElement {
  return el(
    'div',
    root('tooltip', props, r, { id: props.id ? `${props.id}--tooltip` : undefined, popover: 'manual', role: 'tooltip', 'data-state': state(s.open) }),
    [frame('control'), el('span', { class: 'sp-ui-tooltip-text' }, [text(props.text)])],
    'popover',
  );
}

/** `SpSelect`: the APG select-only combobox; focus stays on the trigger (REQ-494, REQ-498, DD-039). */
export function uiSelectView(
  props: SpSelectProps,
  r: UiResolved,
  s: { readonly value: string | null; readonly open: boolean; readonly active: string | null },
): UiElement {
  uiRequireName('SpSelect', undefined, props.label);
  const items = uiSelectItems(props.items);
  const value = uiSelectedKey(items, s.value, 'none');
  const chosen = items.find((item) => item.key === value);
  const { id } = props;
  const optionId = (key: string) => (id ? `${id}--option-${key}` : undefined);
  const active = s.open ? items.find((item) => item.key === s.active && item.disabled !== true) : undefined;
  const options: UiNode[] = items.map((item) => {
    const isActive = item === active;
    const isChosen = item === chosen;
    return el(
      'div',
      {
        class: 'sp-ui-option',
        role: 'option',
        id: optionId(item.key),
        'data-key': item.key,
        'aria-selected': String(isChosen),
        'aria-disabled': item.disabled ? 'true' : undefined,
      },
      [...(isActive ? [heighten()] : []), label(item.label, isActive), ...(isChosen ? [glyph('tick')] : [])],
      'option',
    );
  });
  return el('span', root('select', props, r, { id, style: style('--sp-ui-select-width', cssLength(props.width, 'SpSelect', 'width')) }), [
    el(
      'button',
      {
        type: 'button',
        class: 'sp-ui-select-trigger',
        role: 'combobox',
        'aria-haspopup': 'listbox',
        'aria-expanded': String(s.open),
        'aria-controls': id ? `${id}--listbox` : undefined,
        'aria-activedescendant': active ? optionId(active.key) : undefined,
        'aria-label': props.label,
        'aria-required': props.required ? 'true' : undefined,
        disabled: props.disabled === true,
      },
      [
        frame('control'),
        el('span', { class: 'sp-ui-select-value', 'data-placeholder': chosen ? undefined : 'true' }, [text(chosen?.label ?? props.placeholder ?? 'Select…')]),
        glyph('chevronDown'),
      ],
      'trigger',
    ),
    el('div', { class: 'sp-ui-select-content', popover: 'auto', 'data-state': state(s.open) }, [
      frame('card'),
      el('div', { role: 'listbox', id: id ? `${id}--listbox` : undefined, 'aria-label': props.label }, options),
    ], 'popover'),
    ...(props.name ? [el('input', { type: 'hidden', name: props.name, value: value ?? '' })] : []),
  ]);
}

/** `SpDropdownMenu`: the APG menu button; DOM focus moves to the active item (REQ-495, REQ-498, DD-039). */
export function uiDropdownMenuView(
  props: SpDropdownMenuProps,
  r: UiResolved,
  s: { readonly open: boolean; readonly active: string | null },
  slots: { readonly trigger?: boolean },
): UiElement {
  const { id } = props;
  const entries = uiItems(props.items, 'SpDropdownMenu');
  const active = s.open ? entries.find((entry) => actionable(entry) && entry.key === s.active && entry.disabled !== true) : undefined;
  const children: UiNode[] = entries.map((entry) => {
    if (entry.type === 'separator') return el('div', { class: 'sp-ui-menu-separator', role: 'separator' });
    if (entry.type === 'label') return el('div', { class: 'sp-ui-menu-label', role: 'presentation' }, [text(entry.label)]);
    const isActive = entry === active;
    return el(
      'div',
      {
        class: 'sp-ui-menuitem',
        role: 'menuitem',
        tabindex: '-1',
        'data-key': entry.key,
        'aria-disabled': entry.disabled ? 'true' : undefined,
        'data-danger': entry.danger ? 'true' : undefined,
      },
      [
        ...(isActive ? [heighten()] : []),
        label(entry.label, isActive),
        ...(entry.shortcut ? [el('span', { class: 'sp-ui-menu-shortcut', 'aria-hidden': 'true' }, [text(entry.shortcut)])] : []),
      ],
      'menuitem',
    );
  });
  const trigger = slots.trigger
    ? uiTriggerView()
    : el(
        'button',
        { type: 'button', class: 'sp-ui-menu-trigger', ...uiTriggerAria('menu', id, s.open) },
        [frame('control'), el('span', { class: 'sp-ui-label' }, [text(props.label)]), glyph('chevronDown')],
        'trigger',
      );
  return el('span', root('dropdown-menu', props, r, { id }), [
    trigger,
    el(
      'div',
      { class: 'sp-ui-menu', id: id ? `${id}--menu` : undefined, popover: 'auto', role: 'menu', 'aria-label': props.label, 'data-state': state(s.open) },
      [frame('card'), ...children],
      'popover',
    ),
  ]);
}

const TOAST_GLYPHS: Record<AlertKind, 'info' | 'tick' | 'warning' | 'cross'> = { info: 'info', success: 'tick', warning: 'warning', error: 'cross' };

/**
 * `SpToast`: its kind by glyph and text, announced politely or assertively (REQ-497). The live
 * role is on the toast's body: a list item may not take another role.
 */
export function uiToastView(props: SpToastProps, r: UiResolved, s: { readonly open: boolean }, slots: { readonly action?: boolean }): UiElement {
  const kind = props.kind ?? 'info';
  const urgent = kind === 'warning' || kind === 'error';
  return el('li', root('toast', props, r, { id: props.id, 'data-kind': kind, 'data-state': state(s.open) }), [
    frame('card'),
    el('div', { class: 'sp-ui-toast-body', role: urgent ? 'alert' : 'status' }, [
      glyph(TOAST_GLYPHS[kind]),
      el('div', { class: 'sp-ui-toast-text' }, [
        el('span', { class: 'sp-ui-toast-title' }, [text(props.title)]),
        ...(props.description ? [el('span', { class: 'sp-ui-toast-description' }, [text(props.description)])] : []),
      ]),
    ]),
    ...(slots.action ? [el('div', { class: 'sp-ui-toast-action' }, [slot('action')])] : []),
    iconClose(props.closeLabel ?? 'Dismiss'),
  ]);
}

/** `SpToaster`: a labelled region holding its toasts (REQ-497). */
export function uiToasterView(props: SpToasterProps, r: UiResolved): UiElement {
  return el(
    'section',
    root('toaster', props, r, { id: props.id, 'aria-label': props.label ?? 'Notifications', 'data-position': props.position ?? 'bottom-end' }),
    [el('ol', { class: 'sp-ui-toaster-list' }, [slot('content')])],
  );
}
