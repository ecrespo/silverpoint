import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { __setDiagnosticSink } from '@silverpoint/core';
import { UI_COMPONENTS } from '@silverpoint/core/ui';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp, createSSRApp, h, nextTick, ref, type Component, type VNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { stubPopoverApi } from '../../../tools/visual-gate/popover-stub';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiFixtureParts, uiMatrix, type UiFixture } from '../../../tools/visual-gate/ui-matrix';
import * as Ui from '../src/ui';

/*
 * Vue overlays (T-215, T-216; REQ-490..REQ-502): Modal and Drawer on a native <dialog>, Popover,
 * Tooltip, the Select list and the Menu on the Popover API, Toast and Toaster, with `v-model:open`.
 * The server markup is the core's, open or closed by `data-state`, never by the `open` attribute;
 * the client opens it after mount and places it with `uiAnchor`. A trigger is the `trigger` slot.
 */

let cleanup: (() => void)[] = [];
let popovers: ReturnType<typeof stubPopoverApi>;
beforeEach(() => {
  cleanup.push(__setDiagnosticSink(() => {}));
  popovers = stubPopoverApi();
  cleanup.push(() => popovers.restore());
});
afterEach(() => {
  for (const undo of cleanup.reverse()) undo();
  cleanup = [];
  vi.useRealTimers();
});

const set = Ui as unknown as Record<string, Component>;
const B = UI_COMPONENTS.filter((c) => c.batch === 'B');
const button = (text: string) => () => h('button', { type: 'button' }, text);

/** A fixture as a Vue consumer writes it: a button in the `trigger` slot, the value as its default. */
function element(fixture: UiFixture): VNode {
  const { props, value, slots, trigger } = uiFixtureParts(fixture);
  const children = { ...(trigger !== undefined && { trigger: button(trigger) }), ...(slots.content !== undefined && { default: () => slots.content }), ...(slots.footer !== undefined && { footer: () => slots.footer }) };
  switch (fixture.component) {
    case 'modal':
      return h(set.SpModal!, props, children);
    case 'drawer':
      return h(set.SpDrawer!, props, children);
    case 'popover':
      return h(set.SpPopover!, props, children);
    case 'tooltip':
      return h(set.SpTooltip!, props, children);
    case 'select':
      return h(set.SpSelect!, { ...props, defaultValue: value });
    case 'dropdown-menu':
      return h(set.SpDropdownMenu!, props);
    default:
      return h(set.SpToast!, props, slots.action !== undefined ? { action: () => slots.action } : {});
  }
}

function mount(render: () => VNode): HTMLElement {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp({ render });
  app.mount(host);
  cleanup.push(() => {
    app.unmount();
    host.remove();
  });
  return host;
}

const key = async (target: Element, name: string) => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
  await nextTick();
};
const click = async (target: Element) => {
  (target as HTMLElement).click();
  await nextTick();
};
const shown = (element: Element) => element.matches(':popover-open');
const pr = uiMatrix(['B']).filter((f) => f.scope === 'pr');

describe('Vue overlay markup (T-216)', () => {
  test.each(pr)('REQ-502 · $id is the canonical tree', async (fixture) => {
    const markup = await renderToString(createSSRApp({ render: () => element(fixture) }));
    expect(compareUi(markup, canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test('REQ-327 · mounting every fixture raises no Vue warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    cleanup.push(() => warn.mockRestore());
    for (const fixture of pr) mount(() => element(fixture));
    expect(warn).not.toHaveBeenCalled();
  });

  test('REQ-490 · every overlay has its subpath and is on the barrel', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as { exports: Record<string, unknown> };
    for (const { slug } of B) expect(pkg.exports[`./ui/${slug}`], slug).toBeDefined();
    for (const name of ['SpModal', 'SpDrawer', 'SpPopover', 'SpTooltip', 'SpSelect', 'SpDropdownMenu', 'SpToast', 'SpToaster']) expect(Ui, name).toHaveProperty(name);
  });

  test("REQ-500 · REQ-502 · the server writes the trigger's ARIA and the open state, never the `open` attribute", async () => {
    const html = await renderToString(createSSRApp({ render: () => h(set.SpModal!, { id: 'm', title: 'T', open: true }, { trigger: button('Edit'), default: () => 'x' }) }));
    expect(html).toContain('<button type="button" aria-haspopup="dialog" aria-expanded="true" aria-controls="m--dialog">Edit</button><dialog ');
    expect(html).not.toMatch(/<dialog[^>]* open/);
    const tip = await renderToString(createSSRApp({ render: () => h(set.SpTooltip!, { id: 't', text: 'Copy' }, { trigger: button('C') }) }));
    expect(tip).toContain('<button type="button" aria-describedby="t--tooltip">C</button>');
  });
});

describe('Vue dialogs (T-215, T-216)', () => {
  const modal = (props: Record<string, unknown> = {}) => h(set.SpModal!, { id: 'm', title: 'Edit', ...props }, { trigger: button('Edit'), default: () => 'body' });

  test('REQ-491 · REQ-500 · the trigger opens the dialog with showModal() after mount; its close button closes it', async () => {
    const changed = vi.fn();
    const host = mount(() => modal({ 'onUpdate:open': changed }));
    const dialog = host.querySelector('dialog')!;
    const showModal = vi.spyOn(dialog, 'showModal');
    const trigger = host.querySelector('button')!;
    expect(dialog.open).toBe(false);
    await click(trigger);
    expect(showModal).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('data-state')).toBe('open');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(changed).toHaveBeenLastCalledWith(true);
    await click(dialog.querySelector('.sp-ui-icon-button')!);
    expect(dialog.open).toBe(false);
    expect(changed).toHaveBeenLastCalledWith(false);
    expect(changed).toHaveBeenCalledTimes(2);
  });

  test('REQ-502 · an open dialog on the server is shown with showModal() once mounted', async () => {
    const host = mount(() => modal({ defaultOpen: true }));
    await nextTick();
    expect(host.querySelector('dialog')!.open).toBe(true);
  });

  test("REQ-491 · Escape (`cancel`) and the platform's close report the close; a backdrop click closes it", async () => {
    const changed = vi.fn();
    const host = mount(() => modal({ defaultOpen: true, 'onUpdate:open': changed }));
    await nextTick();
    const dialog = host.querySelector('dialog')!;
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(false);
    dialog.close();
    await nextTick();
    expect(changed).toHaveBeenLastCalledWith(false);
    await click(host.querySelector('button')!);
    expect(dialog.open).toBe(true);
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(dialog.open).toBe(false);
  });

  test('REQ-491 · a click inside the dialog, on its content, leaves it open', async () => {
    const host = mount(() => modal({ defaultOpen: true }));
    await nextTick();
    await click(host.querySelector('.sp-ui-overlay-body')!);
    expect(host.querySelector('dialog')!.open).toBe(true);
  });

  test('REQ-491 · `dismissible: false` cancels Escape and ignores a backdrop click', async () => {
    const host = mount(() => modal({ defaultOpen: true, dismissible: false }));
    await nextTick();
    const dialog = host.querySelector('dialog')!;
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(dialog.open).toBe(true);
  });

  test("REQ-500 · v-model:open shows the parent's state and only reports the user's change", async () => {
    const changed = vi.fn();
    const open = ref(false);
    const host = mount(() => modal({ open: open.value, 'onUpdate:open': changed }));
    const dialog = host.querySelector('dialog')!;
    await click(host.querySelector('button')!);
    expect(changed).toHaveBeenCalledWith(true);
    expect(dialog.open).toBe(false);
    open.value = true;
    await nextTick();
    expect(dialog.open).toBe(true);
    open.value = false;
    await nextTick();
    expect(dialog.open).toBe(false);
    expect(changed).toHaveBeenCalledTimes(1);
  });

  test('REQ-491 · a Drawer with `modal: false` opens with show()', async () => {
    const host = mount(() => h(set.SpDrawer!, { title: 'Filters', modal: false }, { trigger: button('F') }));
    const show = vi.spyOn(host.querySelector('dialog')!, 'show');
    await click(host.querySelector('button')!);
    expect(show).toHaveBeenCalledOnce();
    expect(host.querySelector('dialog')!.open).toBe(true);
  });
});

describe('Vue popovers (T-215, T-216)', () => {
  test('REQ-492 · REQ-493 · a Popover opens from its trigger, is placed by uiAnchor, and a light dismiss reports the close', async () => {
    const changed = vi.fn();
    const host = mount(() => h(set.SpPopover!, { id: 'p', title: 'Order', 'onUpdate:open': changed }, { trigger: button('Details'), default: () => 'body' }));
    const popover = host.querySelector('[popover]')!;
    const trigger = host.querySelector('button')!;
    await click(trigger);
    expect(shown(popover)).toBe(true);
    expect((popover as HTMLElement).style.getPropertyValue('--sp-ui-x')).toMatch(/px$/);
    expect(popover.getAttribute('data-side')).toBe('bottom');
    popovers.light(popover);
    await nextTick();
    expect(changed).toHaveBeenLastCalledWith(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  test('REQ-492 · a click on the trigger of an open popover closes it, even when the click outside dismissed it first', async () => {
    const host = mount(() => h(set.SpPopover!, { title: 'Order' }, { trigger: button('Details'), default: () => 'body' }));
    const popover = host.querySelector('[popover]')!;
    const trigger = host.querySelector('button')!;
    await click(trigger);
    trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    popovers.light(popover);
    await nextTick();
    await click(trigger);
    expect(shown(popover)).toBe(false);
  });

  test('REQ-496 · a Tooltip shows after its delay on focus, keeps while the pointer is on it, and hides on Escape', async () => {
    vi.useFakeTimers();
    const host = mount(() => h(set.SpTooltip!, { id: 't', text: 'Copy the id', delay: 200 }, { trigger: button('Copy') }));
    const tooltip = host.querySelector('[role="tooltip"]')!;
    const trigger = host.querySelector('button')!;
    trigger.focus();
    await nextTick();
    expect(shown(tooltip)).toBe(false);
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(shown(tooltip)).toBe(true);
    trigger.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
    tooltip.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
    vi.advanceTimersByTime(500);
    await nextTick();
    expect(shown(tooltip)).toBe(true);
    await key(trigger, 'Escape');
    expect(shown(tooltip)).toBe(false);
  });

  test('REQ-496 · a Tooltip shown by hover hides on Escape anywhere, with focus elsewhere (WCAG 1.4.13, T-223)', async () => {
    vi.useFakeTimers();
    const host = mount(() => h(set.SpTooltip!, { text: 'Copy the id' }, { trigger: button('Copy') }));
    const tooltip = host.querySelector('[role="tooltip"]')!;
    host.querySelector('button')!.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
    vi.advanceTimersByTime(300);
    await nextTick();
    expect(shown(tooltip)).toBe(true);
    await key(document.body, 'Escape');
    expect(shown(tooltip)).toBe(false);
  });

  test('REQ-496 · a Tooltip hides on blur and on the pointer leaving both', async () => {
    vi.useFakeTimers();
    const host = mount(() => h(set.SpTooltip!, { text: 'Copy the id' }, { trigger: button('Copy') }));
    const tooltip = host.querySelector('[role="tooltip"]')!;
    const trigger = host.querySelector('button')!;
    trigger.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
    vi.advanceTimersByTime(300);
    await nextTick();
    expect(shown(tooltip)).toBe(true);
    trigger.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
    vi.advanceTimersByTime(100);
    await nextTick();
    expect(shown(tooltip)).toBe(false);
    trigger.focus();
    vi.advanceTimersByTime(300);
    await nextTick();
    expect(shown(tooltip)).toBe(true);
    trigger.blur();
    await nextTick();
    expect(shown(tooltip)).toBe(false);
  });
});

describe('Vue Select and Menu (T-216)', () => {
  const items = [{ key: 'placed', label: 'Placed' }, { key: 'paid', label: 'Paid', disabled: true }, { key: 'packed', label: 'Packed' }, { key: 'shipped', label: 'Shipped' }];
  const active = (host: HTMLElement) => host.querySelector('[role="option"] [part="sp-heighten"]')?.closest('[role="option"]')?.getAttribute('data-key');

  test('REQ-494 · REQ-498 · keys open the list on the chosen option, move past disabled ones, and Enter selects', async () => {
    const changed = vi.fn();
    const host = mount(() => h(set.SpSelect!, { id: 's', label: 'Status', items, defaultValue: 'placed', 'onUpdate:modelValue': changed }));
    const trigger = host.querySelector<HTMLButtonElement>('[role="combobox"]')!;
    await key(trigger, 'ArrowDown');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(shown(host.querySelector('[popover]')!)).toBe(true);
    expect(active(host)).toBe('placed');
    await key(trigger, 'ArrowDown');
    expect(active(host)).toBe('packed');
    expect(trigger.getAttribute('aria-activedescendant')).toBe('s--option-packed');
    await key(trigger, 'Enter');
    expect(changed).toHaveBeenCalledWith('packed');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector('.sp-ui-select-value')!.textContent).toBe('Packed');
  });

  test('REQ-494 · v-model follows the chosen key, and the parent can set it', async () => {
    const model = ref<string | null>('placed');
    const host = mount(() => h(set.SpSelect!, { label: 'Status', items, modelValue: model.value, 'onUpdate:modelValue': (v: string) => (model.value = v), defaultOpen: true }));
    await click(host.querySelector('[data-key="shipped"]')!);
    expect(model.value).toBe('shipped');
    model.value = 'packed';
    await nextTick();
    expect(host.querySelector('.sp-ui-select-value')!.textContent).toBe('Packed');
  });

  test('REQ-494 · typeahead moves to the next match; its buffer clears 500 ms after the last key', async () => {
    vi.useFakeTimers();
    const host = mount(() => h(set.SpSelect!, { label: 'Status', items, defaultOpen: true }));
    const trigger = host.querySelector('[role="combobox"]')!;
    await key(trigger, 's');
    expect(active(host)).toBe('shipped');
    await key(trigger, 'p');
    expect(active(host)).toBe('shipped');
    vi.advanceTimersByTime(500);
    await key(trigger, 'p');
    expect(active(host)).toBe('placed');
  });

  test('REQ-494 · Escape closes without selecting; a click selects an enabled option and submits its key', async () => {
    const changed = vi.fn();
    const host = mount(() => h(set.SpSelect!, { label: 'Status', name: 'status', items, defaultOpen: true, 'onUpdate:modelValue': changed }));
    await key(host.querySelector('[role="combobox"]')!, 'Escape');
    expect(changed).not.toHaveBeenCalled();
    expect(host.querySelector('[role="combobox"]')!.getAttribute('aria-expanded')).toBe('false');
    await click(host.querySelector('[data-key="paid"]')!);
    expect(changed).not.toHaveBeenCalled();
    await click(host.querySelector('[data-key="shipped"]')!);
    expect(changed).toHaveBeenCalledWith('shipped');
    expect(host.querySelector<HTMLInputElement>('input[type="hidden"]')!.value).toBe('shipped');
  });

  test('REQ-494 · a list reopened by a click after Escape starts again on the chosen option; pressing an option keeps focus on the trigger', async () => {
    const host = mount(() => h(set.SpSelect!, { label: 'Status', items, defaultValue: 'placed' }));
    const trigger = host.querySelector('[role="combobox"]')!;
    await key(trigger, 'ArrowDown');
    await key(trigger, 'ArrowDown');
    expect(active(host)).toBe('packed');
    await key(trigger, 'Escape');
    await click(trigger);
    expect(active(host)).toBe('placed');
    const press = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
    host.querySelector('[data-key="shipped"]')!.dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
  });

  const entries = [
    { key: 'edit', label: 'Edit' },
    { key: 'archive', label: 'Archive', disabled: true },
    { type: 'separator' as const, key: 'sep' },
    { key: 'delete', label: 'Delete' },
  ];

  test('REQ-495 · a click opens the menu on its first item, with focus; arrows wrap past disabled ones; Enter selects and returns focus', async () => {
    const selected = vi.fn();
    const host = mount(() => h(set.SpDropdownMenu!, { id: 'd', label: 'Actions', items: entries, onSelect: selected }));
    const trigger = host.querySelector<HTMLButtonElement>('.sp-ui-menu-trigger')!;
    await click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement?.getAttribute('data-key')).toBe('edit');
    await key(document.activeElement!, 'ArrowDown');
    expect(document.activeElement?.getAttribute('data-key')).toBe('delete');
    await key(document.activeElement!, 'ArrowDown');
    expect(document.activeElement?.getAttribute('data-key')).toBe('edit');
    await key(document.activeElement!, 'ArrowUp');
    await key(document.activeElement!, 'Enter');
    expect(selected).toHaveBeenCalledWith('delete');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  test('REQ-495 · an item is focused only once its menu is shown: a hidden element takes no focus in a browser (T-223)', async () => {
    const host = mount(() => h(set.SpDropdownMenu!, { id: 'd', label: 'Actions', items: entries }));
    const trigger = host.querySelector<HTMLButtonElement>('.sp-ui-menu-trigger')!;
    const menu = host.querySelector('[role="menu"]')!;
    const focus = HTMLElement.prototype.focus;
    const seen: boolean[] = [];
    HTMLElement.prototype.focus = function (this: HTMLElement, options?: FocusOptions) {
      if (this.getAttribute('role') === 'menuitem') seen.push(menu.matches(':popover-open'));
      return focus.call(this, options);
    };
    try {
      for (const name of [' ', 'Enter', 'ArrowDown']) {
        await key(trigger, name);
        await nextTick();
        await key(document.activeElement!, 'Escape');
      }
    } finally {
      HTMLElement.prototype.focus = focus;
    }
    expect(seen.length).toBeGreaterThanOrEqual(3);
    expect(seen.every(Boolean)).toBe(true);
  });

  test('REQ-495 · REQ-498 · a menu mounted open focuses its first item, as one opened by a click', async () => {
    mount(() => h(set.SpDropdownMenu!, { id: 'd', label: 'Actions', items: entries, open: true }));
    await nextTick();
    expect(document.activeElement?.getAttribute('data-key')).toBe('edit');
  });

  test('REQ-495 · ArrowUp opens on the last item; Escape closes; a disabled item ignores a click', async () => {
    const selected = vi.fn();
    const host = mount(() => h(set.SpDropdownMenu!, { label: 'Actions', items: entries, onSelect: selected }));
    const trigger = host.querySelector<HTMLButtonElement>('.sp-ui-menu-trigger')!;
    await key(trigger, 'ArrowUp');
    expect(document.activeElement?.getAttribute('data-key')).toBe('delete');
    await key(document.activeElement!, 'Escape');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await click(trigger);
    await click(host.querySelector('[data-key="archive"]')!);
    expect(selected).not.toHaveBeenCalled();
  });

  test("REQ-500 · a menu's trigger slot takes the menu button's ARIA", async () => {
    const html = await renderToString(createSSRApp({ render: () => h(set.SpDropdownMenu!, { id: 'd', label: 'Actions', items: entries }, { trigger: button('More') }) }));
    expect(html).toContain('<span class="sp-ui-trigger"><button type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="d--menu">More</button></span>');
  });
});

describe('Vue toasts (T-216)', () => {
  test('REQ-497 · a toast closes after its duration, pausing while the pointer is in it, and reports the close', async () => {
    vi.useFakeTimers();
    const changed = vi.fn();
    const host = mount(() => h(set.SpToast!, { title: 'Saved', duration: 2000, defaultOpen: true, 'onUpdate:open': changed }));
    await nextTick();
    const toast = host.querySelector('li')!;
    vi.advanceTimersByTime(1000);
    toast.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
    vi.advanceTimersByTime(5000);
    expect(changed).not.toHaveBeenCalled();
    toast.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
    vi.advanceTimersByTime(2000);
    await nextTick();
    expect(changed).toHaveBeenCalledWith(false);
    expect(toast.getAttribute('data-state')).toBe('closed');
  });

  test("REQ-497 · a toast takes its toaster's duration; its close button closes it; F8 focuses the toaster", async () => {
    vi.useFakeTimers();
    const host = mount(() => h(set.SpToaster!, { duration: 3000 }, () => [h(set.SpToast!, { title: 'One', defaultOpen: true }), h(set.SpToast!, { title: 'Two', defaultOpen: true, duration: Infinity })]));
    await nextTick();
    const [one, two] = [...host.querySelectorAll('li')];
    vi.advanceTimersByTime(3000);
    await nextTick();
    expect(one!.getAttribute('data-state')).toBe('closed');
    expect(two!.getAttribute('data-state')).toBe('open');
    await click(two!.querySelector('.sp-ui-icon-button')!);
    expect(two!.getAttribute('data-state')).toBe('closed');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F8', bubbles: true }));
    expect(document.activeElement).toBe(host.querySelector('section'));
  });
});
