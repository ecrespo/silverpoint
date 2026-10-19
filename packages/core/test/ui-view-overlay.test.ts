import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, type SpCode } from '../src';
import {
  resolveUi,
  uiDrawerView,
  uiDropdownMenuView,
  uiMenuItems,
  uiModalView,
  uiPopoverView,
  uiSelectItems,
  uiSelectView,
  uiToastDuration,
  uiToasterView,
  uiToastView,
  uiTooltipView,
  uiTriggerAria,
  uiTriggerView,
  type MenuEntry,
  type UiElement,
  type UiNode,
} from '../src/ui';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): Array<{ code: SpCode; message: string }> {
  const seen: Array<{ code: SpCode; message: string }> = [];
  restore = __setDiagnosticSink((code, message) => seen.push({ code, message }));
  return seen;
}

const isElement = (n: UiNode): n is UiElement => 'tag' in n;
const all = (n: UiNode): UiElement[] => (isElement(n) ? [n, ...n.children.flatMap(all)] : []);
const partsOf = (e: UiElement) => (typeof e.attrs.part === 'string' ? e.attrs.part.split(' ') : []);
const withPart = (n: UiNode, part: string) => all(n).filter((e) => partsOf(e).includes(part));
const classes = (e: UiElement) => (typeof e.attrs.class === 'string' ? e.attrs.class.split(' ') : []);
const one = (n: UiNode, pick: (e: UiElement) => boolean) => {
  const found = all(n).filter(pick);
  expect(found).toHaveLength(1);
  return found[0]!;
};
const texts = (n: UiNode): string[] => ('text' in n ? [n.text] : isElement(n) ? n.children.flatMap(texts) : []);
const glyphs = (n: UiNode) => withPart(n, 'sp-mark').map((e) => e.attrs['data-glyph']);
const slots = (n: UiNode): string[] => ('slot' in n ? [n.slot] : isElement(n) ? n.children.flatMap(slots) : []);
const r = (props = {}) => resolveUi(props, {});

function drawnAreHidden(view: UiElement): void {
  const walk = (n: UiNode, hidden: boolean) => {
    if (!isElement(n)) return;
    const h = hidden || n.attrs['aria-hidden'] === 'true';
    if (partsOf(n).length > 0) expect(h, `${n.tag}[part=${n.attrs.part}]`).toBe(true);
    for (const c of n.children) walk(c, h);
  };
  walk(view, false);
}

/** REQ-502: the server markup carries the state, never the `open` attribute nor a position. */
function noOpenNorPosition(view: UiElement): void {
  for (const e of all(view)) {
    expect(e.attrs.open, e.tag).toBeUndefined();
    expect(typeof e.attrs.style === 'string' && /--sp-ui-[xy]:/.test(e.attrs.style)).toBe(false);
    expect(e.attrs['data-side'] === undefined || e.tag === 'dialog').toBe(true);
  }
}

describe('triggers (T-207)', () => {
  test('REQ-500 · a consumer trigger sits in a wrapper the adapter binds', () => {
    expect(uiTriggerView()).toEqual({ tag: 'span', attrs: { class: 'sp-ui-trigger' }, children: [{ slot: 'trigger' }], bind: 'trigger' });
  });

  test('REQ-500 · the ARIA each overlay sets on its trigger, from the instance id', () => {
    expect(uiTriggerAria('dialog', 'm', false)).toEqual({ 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': 'm--dialog' });
    expect(uiTriggerAria('popover', 'p', true)).toEqual({ 'aria-haspopup': 'dialog', 'aria-expanded': 'true', 'aria-controls': 'p--popover' });
    expect(uiTriggerAria('menu', 'd', true)).toEqual({ 'aria-haspopup': 'menu', 'aria-expanded': 'true', 'aria-controls': 'd--menu' });
    expect(uiTriggerAria('tooltip', 't', false)).toEqual({ 'aria-describedby': 't--tooltip' });
  });

  test('REQ-500 · without an id there is nothing to point at: only the expanded state', () => {
    expect(uiTriggerAria('menu', undefined, true)).toEqual({ 'aria-haspopup': 'menu', 'aria-expanded': 'true' });
    expect(uiTriggerAria('tooltip', undefined, true)).toEqual({});
  });
});

describe('uiModalView and uiDrawerView (T-207)', () => {
  test('REQ-491 · a modal is a framed dialog named by its title and described by its description', () => {
    const view = uiModalView({ id: 'm', title: 'Delete order', description: 'This cannot be undone.' }, r(), { open: false }, { footer: true });
    expect(view.tag).toBe('dialog');
    expect(view.bind).toBe('dialog');
    expect(view.attrs).toMatchObject({
      id: 'm--dialog',
      class: 'sp-ui sp-modal sp-ground-silverpoint',
      'aria-labelledby': 'm--title',
      'aria-describedby': 'm--description',
      'data-state': 'closed',
    });
    const [drawn, header, rule, description, body, footer] = view.children as UiElement[];
    expect(drawn!.attrs).toMatchObject({ part: 'sp-frame', 'data-kind': 'card' });
    expect(header!.attrs.class).toBe('sp-ui-overlay-header');
    expect(one(header!, (e) => e.tag === 'h2')).toEqual({ tag: 'h2', attrs: { class: 'sp-ui-overlay-title', id: 'm--title' }, children: [{ text: 'Delete order' }] });
    expect(one(header!, (e) => e.bind === 'close').attrs).toEqual({ type: 'button', class: 'sp-ui-icon-button', 'aria-label': 'Close' });
    expect(rule!.attrs).toEqual({ part: 'sp-rule', 'aria-hidden': 'true' });
    expect(description).toEqual({ tag: 'p', attrs: { class: 'sp-ui-overlay-description', id: 'm--description' }, children: [{ text: 'This cannot be undone.' }] });
    expect(body).toEqual({ tag: 'div', attrs: { class: 'sp-ui-overlay-body' }, children: [{ slot: 'content' }] });
    expect(footer).toEqual({ tag: 'div', attrs: { class: 'sp-ui-overlay-footer' }, children: [{ slot: 'footer' }] });
    drawnAreHidden(view);
    noOpenNorPosition(view);
  });

  test('REQ-502 · open is data-state, never the open attribute', () => {
    const view = uiModalView({ id: 'm', title: 'T' }, r(), { open: true }, {});
    expect(view.attrs['data-state']).toBe('open');
    noOpenNorPosition(view);
    expect(slots(view)).toEqual(['content']);
  });

  test('REQ-501 · a label names a modal without a title; neither warns SP018', () => {
    const labelled = uiModalView({ label: 'Settings', closable: false, closeLabel: 'x' }, r(), { open: false }, {});
    expect(labelled.attrs['aria-label']).toBe('Settings');
    expect(all(labelled).filter((e) => e.tag === 'h2' || e.bind === 'close')).toEqual([]);
    expect(withPart(labelled, 'sp-rule')).toEqual([]);
    const seen = capture();
    uiModalView({}, r(), { open: false }, {});
    expect(seen.map((s) => s.code)).toEqual(['SP018']);
  });

  test('REQ-491 · a title without an id names the dialog by aria-label; a width is a computed style', () => {
    const view = uiModalView({ title: 'Hello', width: '640px', closeLabel: 'Cerrar' }, r(), { open: false }, {});
    expect(view.attrs).toMatchObject({ 'aria-label': 'Hello', style: '--sp-ui-overlay-width:640px' });
    expect(view.attrs['aria-labelledby']).toBeUndefined();
    expect(one(view, (e) => e.bind === 'close').attrs['aria-label']).toBe('Cerrar');
  });

  test('REQ-486 · a width that is not a plain length is dropped, SP017', () => {
    const seen = capture();
    expect(uiModalView({ title: 'T', width: '1px;color:red' }, r(), { open: false }, {}).attrs.style).toBeUndefined();
    expect(seen.map((s) => s.code)).toEqual(['SP017']);
  });

  test('REQ-491 · REQ-523 · a drawer is the same dialog on a logical side, end by default', () => {
    const view = uiDrawerView({ id: 'd', title: 'Filters' }, r(), { open: true }, {});
    expect(view.tag).toBe('dialog');
    expect(view.attrs).toMatchObject({ id: 'd--dialog', class: 'sp-ui sp-drawer sp-ground-silverpoint', 'data-side': 'end', 'data-state': 'open' });
    expect(uiDrawerView({ title: 'F', side: 'start', extent: '25rem' }, r(), { open: false }, {}).attrs).toMatchObject({
      'data-side': 'start',
      style: '--sp-ui-drawer-extent:25rem',
    });
    noOpenNorPosition(view);
  });
});

describe('uiPopoverView and uiTooltipView (T-207)', () => {
  test('REQ-492 · a popover is an auto popover with the dialog role, framed, named by its title', () => {
    const view = uiPopoverView({ id: 'p', title: 'Ground' }, r(), { open: false });
    expect(view.tag).toBe('div');
    expect(view.bind).toBe('popover');
    expect(view.attrs).toMatchObject({ id: 'p--popover', class: 'sp-ui sp-popover sp-ground-silverpoint', popover: 'auto', role: 'dialog', 'aria-labelledby': 'p--title', 'data-state': 'closed' });
    const [drawn, header, body] = view.children as UiElement[];
    expect(drawn!.attrs['data-kind']).toBe('card');
    expect(header).toEqual({ tag: 'div', attrs: { class: 'sp-ui-overlay-header' }, children: [{ tag: 'div', attrs: { class: 'sp-ui-overlay-title', id: 'p--title' }, children: [{ text: 'Ground' }] }] });
    expect(body).toEqual({ tag: 'div', attrs: { class: 'sp-ui-overlay-body' }, children: [{ slot: 'content' }] });
    noOpenNorPosition(view);
  });

  test('REQ-501 · closable adds a close button; a label names it; neither warns SP018', () => {
    const view = uiPopoverView({ label: 'Help', closable: true, width: '20rem' }, r(), { open: true });
    expect(view.attrs).toMatchObject({ 'aria-label': 'Help', 'data-state': 'open', style: '--sp-ui-overlay-width:20rem' });
    expect(one(view, (e) => e.bind === 'close').attrs['aria-label']).toBe('Close');
    const seen = capture();
    uiPopoverView({}, r(), { open: false });
    expect(seen.map((s) => s.code)).toEqual(['SP018']);
  });

  test('REQ-492 · REQ-496 · a tooltip is a manual popover with the tooltip role and its text', () => {
    const view = uiTooltipView({ id: 't', text: 'Copies the link' }, r(), { open: true });
    expect(view.attrs).toMatchObject({ id: 't--tooltip', class: 'sp-ui sp-tooltip sp-ground-silverpoint', popover: 'manual', role: 'tooltip', 'data-state': 'open' });
    expect(view.bind).toBe('popover');
    expect(view.children).toEqual([
      { tag: 'span', attrs: { part: 'sp-frame', 'data-kind': 'control', 'aria-hidden': 'true' }, children: [] },
      { tag: 'span', attrs: { class: 'sp-ui-tooltip-text' }, children: [{ text: 'Copies the link' }] },
    ]);
    noOpenNorPosition(view);
  });
});

describe('uiSelectItems and uiSelectView (T-207)', () => {
  const items = ['Silverpoint', { key: 'cyanotype', label: 'Cyanotype', disabled: true }, { key: 'burin', label: 'Burin' }];

  test('REQ-494 · items: a string is its own key and label; repeated keys are skipped, SP019', () => {
    expect(uiSelectItems(items)).toEqual([
      { key: 'Silverpoint', label: 'Silverpoint' },
      { key: 'cyanotype', label: 'Cyanotype', disabled: true },
      { key: 'burin', label: 'Burin' },
    ]);
    const seen = capture();
    expect(uiSelectItems(['a', 'a'])).toEqual([{ key: 'a', label: 'a' }]);
    expect(seen.map((s) => s.code)).toEqual(['SP019']);
  });

  test('REQ-494 · closed with no value: a combobox showing the placeholder, the listbox in a closed popover', () => {
    const view = uiSelectView({ id: 's', label: 'Ground', items, name: 'ground' }, r(), { value: null, open: false, active: null });
    expect(view.tag).toBe('span');
    expect(classes(view).slice(0, 2)).toEqual(['sp-ui', 'sp-select']);
    const [trigger, content, hidden] = view.children as UiElement[];
    expect([trigger!.tag, trigger!.bind]).toEqual(['button', 'trigger']);
    expect(trigger!.attrs).toEqual({
      type: 'button',
      class: 'sp-ui-select-trigger',
      role: 'combobox',
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false',
      'aria-controls': 's--listbox',
      'aria-label': 'Ground',
    });
    expect(one(trigger!, (e) => classes(e).includes('sp-ui-select-value')).attrs['data-placeholder']).toBe('true');
    expect(texts(trigger!)).toEqual(['Select…']);
    expect(glyphs(trigger!)).toEqual(['chevronDown']);
    expect(content!.attrs).toEqual({ class: 'sp-ui-select-content', popover: 'auto', 'data-state': 'closed' });
    expect(content!.bind).toBe('popover');
    const listbox = one(content!, (e) => e.attrs.role === 'listbox');
    expect(listbox.attrs).toEqual({ role: 'listbox', id: 's--listbox', 'aria-label': 'Ground' });
    expect(listbox.children.map((o) => (o as UiElement).attrs)).toEqual([
      { class: 'sp-ui-option', role: 'option', id: 's--option-Silverpoint', 'data-key': 'Silverpoint', 'aria-selected': 'false' },
      { class: 'sp-ui-option', role: 'option', id: 's--option-cyanotype', 'data-key': 'cyanotype', 'aria-selected': 'false', 'aria-disabled': 'true' },
      { class: 'sp-ui-option', role: 'option', id: 's--option-burin', 'data-key': 'burin', 'aria-selected': 'false' },
    ]);
    expect(listbox.children.every((o) => (o as UiElement).bind === 'option')).toBe(true);
    expect(hidden).toEqual({ tag: 'input', attrs: { type: 'hidden', name: 'ground', value: '' }, children: [] });
    expect(withPart(view, 'sp-heighten')).toEqual([]);
    drawnAreHidden(view);
  });

  test('REQ-498 · I-28 · open with a value: the active option heightened and active-descendant, the chosen one ticked', () => {
    const view = uiSelectView({ id: 's', label: 'Ground', items, name: 'ground' }, r(), { value: 'burin', open: true, active: 'Silverpoint' });
    const trigger = view.children[0] as UiElement;
    expect(trigger.attrs).toMatchObject({ 'aria-expanded': 'true', 'aria-activedescendant': 's--option-Silverpoint' });
    expect(texts(one(trigger, (e) => classes(e).includes('sp-ui-select-value')))).toEqual(['Burin']);
    expect(one(trigger, (e) => classes(e).includes('sp-ui-select-value')).attrs['data-placeholder']).toBeUndefined();
    const heightened = withPart(view, 'sp-heighten');
    expect(heightened).toHaveLength(1);
    const active = one(view, (e) => e.attrs.id === 's--option-Silverpoint');
    expect(withPart(active, 'sp-heighten')).toHaveLength(1);
    const chosen = one(view, (e) => e.attrs.id === 's--option-burin');
    expect(chosen.attrs['aria-selected']).toBe('true');
    expect(glyphs(chosen)).toEqual(['tick']);
    expect((view.children[1] as UiElement).attrs['data-state']).toBe('open');
    expect((view.children[2] as UiElement).attrs.value).toBe('burin');
    noOpenNorPosition(view);
  });

  test('I-28 · closed, or with a disabled or unknown active key, nothing is heightened', () => {
    for (const state of [
      { value: null, open: false, active: 'burin' },
      { value: null, open: true, active: 'cyanotype' },
      { value: null, open: true, active: 'gone' },
    ]) {
      const view = uiSelectView({ id: 's', label: 'Ground', items }, r(), state);
      expect(withPart(view, 'sp-heighten')).toEqual([]);
      expect((view.children[0] as UiElement).attrs['aria-activedescendant']).toBeUndefined();
    }
  });

  test('A-06 · an unknown or disabled value shows the placeholder, silently; required, disabled, width', () => {
    const seen = capture();
    const view = uiSelectView({ label: 'Ground', items, placeholder: 'Pick one', required: true, disabled: true, width: '12rem' }, r(), { value: 'cyanotype', open: false, active: null });
    expect(texts(view.children[0]!)).toEqual(['Pick one']);
    expect((view.children[0] as UiElement).attrs).toMatchObject({ 'aria-required': 'true', disabled: true });
    expect(view.attrs.style).toBe('--sp-ui-select-width:12rem');
    expect(view.children).toHaveLength(2);
    expect(seen).toEqual([]);
  });

  test('REQ-319 · a select without a label warns SP018', () => {
    const seen = capture();
    uiSelectView({ label: ' ', items }, r(), { value: null, open: false, active: null });
    expect(seen.map((s) => s.code)).toEqual(['SP018']);
  });
});

describe('uiMenuItems and uiDropdownMenuView (T-207)', () => {
  const entries: MenuEntry[] = [
    { type: 'label', key: 'h', label: 'Order' },
    { key: 'edit', label: 'Edit', shortcut: 'E' },
    { key: 'copy', label: 'Duplicate', disabled: true },
    { type: 'separator', key: 's1' },
    { key: 'delete', label: 'Delete', danger: true },
  ];

  test('REQ-495 · the actionable items, in order, for uiListKey and uiTypeahead', () => {
    expect(uiMenuItems(entries)).toEqual([
      { key: 'edit', label: 'Edit' },
      { key: 'copy', label: 'Duplicate', disabled: true },
      { key: 'delete', label: 'Delete' },
    ]);
  });

  test('REQ-325 · a key repeated across entries is skipped, SP019', () => {
    const seen = capture();
    expect(uiMenuItems([{ key: 'a', label: 'A' }, { type: 'separator', key: 'a' }, { key: 'b', label: 'B' }]).map((i) => i.key)).toEqual(['a', 'b']);
    expect(seen.map((s) => s.code)).toEqual(['SP019']);
  });

  test('REQ-495 · its own trigger, a menu button; the menu an auto popover of menuitems, separators and labels', () => {
    const view = uiDropdownMenuView({ id: 'd', label: 'Actions', items: entries }, r(), { open: false, active: null }, {});
    expect(classes(view).slice(0, 2)).toEqual(['sp-ui', 'sp-dropdown-menu']);
    const [trigger, menu] = view.children as UiElement[];
    expect(trigger!.bind).toBe('trigger');
    expect(trigger!.attrs).toEqual({ type: 'button', class: 'sp-ui-menu-trigger', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-controls': 'd--menu' });
    expect(texts(trigger!)).toEqual(['Actions']);
    expect(glyphs(trigger!)).toEqual(['chevronDown']);
    expect(menu!.bind).toBe('popover');
    expect(menu!.attrs).toEqual({ class: 'sp-ui-menu', id: 'd--menu', popover: 'auto', role: 'menu', 'aria-label': 'Actions', 'data-state': 'closed' });
    const [drawn, ...rest] = menu!.children as UiElement[];
    expect(drawn!.attrs['data-kind']).toBe('card');
    expect(rest.map((e) => [e.attrs.role, e.attrs['data-key'], e.bind])).toEqual([
      ['presentation', undefined, undefined],
      ['menuitem', 'edit', 'menuitem'],
      ['menuitem', 'copy', 'menuitem'],
      ['separator', undefined, undefined],
      ['menuitem', 'delete', 'menuitem'],
    ]);
    expect(rest[1]!.attrs).toEqual({ class: 'sp-ui-menuitem', role: 'menuitem', tabindex: '-1', 'data-key': 'edit' });
    expect(rest[2]!.attrs['aria-disabled']).toBe('true');
    expect(rest[4]!.attrs['data-danger']).toBe('true');
    expect(texts(rest[0]!)).toEqual(['Order']);
    expect(texts(rest[1]!)).toEqual(['Edit', 'E']);
    expect(one(rest[1]!, (e) => classes(e).includes('sp-ui-menu-shortcut')).attrs['aria-hidden']).toBe('true');
    drawnAreHidden(view);
    noOpenNorPosition(view);
  });

  test('REQ-498 · open: the active item heightened, exactly one', () => {
    const view = uiDropdownMenuView({ id: 'd', label: 'Actions', items: entries }, r(), { open: true, active: 'delete' }, {});
    expect((view.children[0] as UiElement).attrs['aria-expanded']).toBe('true');
    expect((view.children[1] as UiElement).attrs['data-state']).toBe('open');
    expect(withPart(view, 'sp-heighten')).toHaveLength(1);
    expect(withPart(one(view, (e) => e.attrs['data-key'] === 'delete'), 'sp-heighten')).toHaveLength(1);
    expect(withPart(uiDropdownMenuView({ label: 'A', items: entries }, r(), { open: true, active: 'copy' }, {}), 'sp-heighten')).toEqual([]);
  });

  test('REQ-500 · a trigger slot replaces its own button', () => {
    const view = uiDropdownMenuView({ id: 'd', label: 'Actions', items: entries }, r(), { open: false, active: null }, { trigger: true });
    expect(view.children[0]).toEqual(uiTriggerView());
  });
});

describe('uiToastView, uiToasterView and uiToastDuration (T-207)', () => {
  test.each([
    ['info', 'status', 'info'],
    ['success', 'status', 'tick'],
    ['warning', 'alert', 'warning'],
    ['error', 'alert', 'cross'],
  ] as const)('REQ-497 · a %s toast is announced by %s, its kind carried by the %s glyph', (kind, role, mark) => {
    const view = uiToastView({ id: 'n', kind, title: 'Saved' }, r(), { open: true }, {});
    expect(view.tag).toBe('li');
    expect(view.attrs).toMatchObject({ id: 'n', class: 'sp-ui sp-toast sp-ground-silverpoint', 'data-kind': kind, 'data-state': 'open' });
    expect(view.attrs.role).toBeUndefined();
    expect(one(view, (e) => e.attrs.role !== undefined).attrs).toEqual({ class: 'sp-ui-toast-body', role });
    expect(glyphs(view)).toEqual([mark, 'cross']);
  });

  test('REQ-497 · title, description, action and a close button', () => {
    const view = uiToastView({ title: 'Order sent', description: 'A-1 is on its way', closeLabel: 'Close' }, r(), { open: false }, { action: true });
    expect(view.attrs['data-kind']).toBe('info');
    expect(view.attrs['data-state']).toBe('closed');
    expect(withPart(view, 'sp-frame').map((e) => e.attrs['data-kind'])).toEqual(['card']);
    expect(texts(view)).toEqual(['Order sent', 'A-1 is on its way']);
    expect(slots(view)).toEqual(['action']);
    expect(one(view, (e) => e.bind === 'close').attrs).toEqual({ type: 'button', class: 'sp-ui-icon-button', 'aria-label': 'Close' });
    expect(one(uiToastView({ title: 'x' }, r(), { open: true }, {}), (e) => e.bind === 'close').attrs['aria-label']).toBe('Dismiss');
    drawnAreHidden(view);
  });

  test('REQ-497 · a toaster is a labelled region holding the toasts in a list', () => {
    const view = uiToasterView({}, r());
    expect(view.tag).toBe('section');
    expect(view.attrs).toMatchObject({ class: 'sp-ui sp-toaster sp-ground-silverpoint', 'aria-label': 'Notifications', 'data-position': 'bottom-end' });
    expect(view.children).toEqual([{ tag: 'ol', attrs: { class: 'sp-ui-toaster-list' }, children: [{ slot: 'content' }] }]);
    expect(uiToasterView({ position: 'top-start', label: 'Avisos' }, r()).attrs).toMatchObject({ 'data-position': 'top-start', 'aria-label': 'Avisos' });
  });

  test('Data Model §2.27 · a toast lasts its own duration, else the toaster’s, else 5000; under 1000 is 1000, SP017', () => {
    expect(uiToastDuration(undefined)).toBe(5000);
    expect(uiToastDuration(undefined, 8000)).toBe(8000);
    expect(uiToastDuration(2000, 8000)).toBe(2000);
    expect(uiToastDuration(Infinity)).toBe(Infinity);
    const seen = capture();
    expect(uiToastDuration(200)).toBe(1000);
    expect(uiToastDuration(Number.NaN)).toBe(1000);
    expect(uiToastDuration(undefined, -5)).toBe(1000);
    expect(seen.map((s) => s.code)).toEqual(['SP017', 'SP017', 'SP017']);
  });
});
