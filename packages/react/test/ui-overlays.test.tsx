import { act, createElement, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { __setDiagnosticSink } from '@silverpoint/core';
import { UI_COMPONENTS } from '@silverpoint/core/ui';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { stubPopoverApi } from '../../../tools/visual-gate/popover-stub';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiFixtureParts, uiMatrix, type UiFixture } from '../../../tools/visual-gate/ui-matrix';
import * as Client from '../src/ui';

/*
 * React overlays (T-215, T-216; REQ-490..REQ-502): Modal and Drawer on a native <dialog>, Popover,
 * Tooltip, the Select list and the Menu on the Popover API, Toast and Toaster. The server markup is
 * the core's, open or closed by `data-state`, never by the `open` attribute; the client opens it
 * after mount and places it with `uiAnchor`.
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

const { SpModal, SpDrawer, SpPopover, SpTooltip, SpSelect, SpDropdownMenu, SpToast, SpToaster } = Client;
/** The fixtures' props are untyped demo data. */
const loose = <P,>(component: P) => component as unknown as (props: Record<string, unknown>) => ReactElement;
const B = UI_COMPONENTS.filter((c) => c.batch === 'B');

/** A fixture as a React consumer writes it: a button as the trigger, the value as its default. */
function element(fixture: UiFixture): ReactElement {
  const { props, value, slots, trigger } = uiFixtureParts(fixture);
  const button = trigger !== undefined ? <button type="button">{trigger}</button> : undefined;
  switch (fixture.component) {
    case 'modal':
      return createElement(loose(SpModal), { ...props, trigger: button }, slots.content);
    case 'drawer':
      return createElement(loose(SpDrawer), { ...props, trigger: button }, slots.content);
    case 'popover':
      return createElement(loose(SpPopover), { ...props, trigger: button }, slots.content);
    case 'tooltip':
      return createElement(loose(SpTooltip), { ...props, trigger: button });
    case 'select':
      return createElement(loose(SpSelect), { ...props, defaultValue: value });
    case 'dropdown-menu':
      return createElement(loose(SpDropdownMenu), props);
    default:
      return createElement(loose(SpToast), { ...props, action: slots.action });
  }
}

function mount(node: ReactElement): { host: HTMLElement; render(next: ReactElement): void } {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(node));
  cleanup.push(() => {
    act(() => root.unmount());
    host.remove();
  });
  return { host, render: (next) => act(() => root.render(next)) };
}

const key = (target: Element, name: string) => act(() => void target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true })));
const click = (target: Element) => act(() => (target as HTMLElement).click());
const shown = (element: Element) => element.matches(':popover-open');
const pr = uiMatrix(['B']).filter((f) => f.scope === 'pr');

describe('React overlay markup (T-216)', () => {
  test.each(pr)('REQ-502 · $id is the canonical tree', (fixture) => {
    expect(compareUi(renderToStaticMarkup(element(fixture)), canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test('REQ-327 · mounting every fixture raises no React warning', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    cleanup.push(() => error.mockRestore());
    for (const fixture of pr) mount(element(fixture));
    expect(error).not.toHaveBeenCalled();
  });

  test('REQ-490 · every overlay has a client subpath and is on the barrel', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as { exports: Record<string, unknown> };
    for (const { slug } of B) expect(pkg.exports[`./ui/${slug}`], slug).toBeDefined();
    for (const name of ['SpModal', 'SpDrawer', 'SpPopover', 'SpTooltip', 'SpSelect', 'SpDropdownMenu', 'SpToast', 'SpToaster']) expect(Client, name).toHaveProperty(name);
  });

  test('REQ-500 · REQ-502 · the server writes the trigger\'s ARIA and the open state, never the `open` attribute', () => {
    const html = renderToStaticMarkup(
      <SpModal id="m" title="T" open trigger={<button type="button">Edit</button>}>
        x
      </SpModal>,
    );
    expect(html).toMatch(/^<button type="button" aria-haspopup="dialog" aria-expanded="true" aria-controls="m--dialog">Edit<\/button><dialog /);
    expect(html).not.toMatch(/<dialog[^>]* open/);
    const tip = renderToStaticMarkup(<SpTooltip id="t" text="Copy" trigger={<button type="button">C</button>} />);
    expect(tip).toMatch(/^<button type="button" aria-describedby="t--tooltip">C<\/button>/);
  });
});

describe('React dialogs (T-215, T-216)', () => {
  const modal = (props: Record<string, unknown> = {}) => (
    <SpModal id="m" title="Edit" trigger={<button type="button">Edit</button>} {...props}>
      body
    </SpModal>
  );

  test('REQ-491 · REQ-500 · the trigger opens the dialog with showModal() after mount; its close button closes it', () => {
    const onOpenChange = vi.fn();
    const { host } = mount(modal({ onOpenChange }));
    const dialog = host.querySelector('dialog')!;
    const showModal = vi.spyOn(dialog, 'showModal');
    const trigger = host.querySelector('button')!;
    expect(dialog.open).toBe(false);
    click(trigger);
    expect(showModal).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('data-state')).toBe('open');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    click(dialog.querySelector('.sp-ui-icon-button')!);
    expect(dialog.open).toBe(false);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  test('REQ-502 · an open dialog on the server is shown with showModal() once mounted', () => {
    const { host } = mount(modal({ defaultOpen: true }));
    expect(host.querySelector('dialog')!.open).toBe(true);
  });

  test('REQ-491 · Escape (`cancel`) and the platform\'s close report the close; a backdrop click closes it', () => {
    const onOpenChange = vi.fn();
    const { host } = mount(modal({ defaultOpen: true, onOpenChange }));
    const dialog = host.querySelector('dialog')!;
    const cancel = new Event('cancel', { cancelable: true });
    act(() => void dialog.dispatchEvent(cancel));
    expect(cancel.defaultPrevented).toBe(false);
    act(() => dialog.close());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    click(host.querySelector('button')!);
    expect(dialog.open).toBe(true);
    act(() => void dialog.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(dialog.open).toBe(false);
  });

  test('REQ-491 · a click inside the dialog, on its content, leaves it open', () => {
    const { host } = mount(modal({ defaultOpen: true }));
    click(host.querySelector('.sp-ui-overlay-body')!);
    expect(host.querySelector('dialog')!.open).toBe(true);
  });

  test('REQ-491 · `dismissible: false` cancels Escape and ignores a backdrop click', () => {
    const { host } = mount(modal({ defaultOpen: true, dismissible: false }));
    const dialog = host.querySelector('dialog')!;
    const cancel = new Event('cancel', { cancelable: true });
    act(() => void dialog.dispatchEvent(cancel));
    expect(cancel.defaultPrevented).toBe(true);
    act(() => void dialog.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(dialog.open).toBe(true);
  });

  test('REQ-500 · a controlled dialog shows the given state and only reports the user\'s change', () => {
    const onOpenChange = vi.fn();
    const { host, render } = mount(modal({ open: false, onOpenChange }));
    const dialog = host.querySelector('dialog')!;
    click(host.querySelector('button')!);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(dialog.open).toBe(false);
    render(modal({ open: true, onOpenChange }));
    expect(dialog.open).toBe(true);
    render(modal({ open: false, onOpenChange }));
    expect(dialog.open).toBe(false);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  test('REQ-491 · a Drawer with `modal: false` opens with show()', () => {
    const { host } = mount(<SpDrawer title="Filters" modal={false} defaultOpen trigger={<button type="button">F</button>} />);
    const dialog = host.querySelector('dialog')!;
    expect(dialog.open).toBe(true);
    const { host: other } = mount(<SpDrawer title="Filters" modal={false} trigger={<button type="button">F</button>} />);
    const show = vi.spyOn(other.querySelector('dialog')!, 'show');
    click(other.querySelector('button')!);
    expect(show).toHaveBeenCalledOnce();
  });
});

describe('React popovers (T-215, T-216)', () => {
  test('REQ-492 · REQ-493 · a Popover opens from its trigger, is placed by uiAnchor, and a light dismiss reports the close', () => {
    const onOpenChange = vi.fn();
    const { host } = mount(
      <SpPopover id="p" title="Order" trigger={<button type="button">Details</button>} onOpenChange={onOpenChange}>
        body
      </SpPopover>,
    );
    const popover = host.querySelector('[popover]')!;
    const trigger = host.querySelector('button')!;
    click(trigger);
    expect(shown(popover)).toBe(true);
    expect((popover as HTMLElement).style.getPropertyValue('--sp-ui-x')).toMatch(/px$/);
    expect(popover.getAttribute('data-side')).toBe('bottom');
    act(() => popovers.light(popover));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  test('REQ-492 · a click on the trigger of an open popover closes it, even when the click outside dismissed it first', () => {
    const { host } = mount(
      <SpPopover title="Order" trigger={<button type="button">Details</button>}>
        body
      </SpPopover>,
    );
    const popover = host.querySelector('[popover]')!;
    const trigger = host.querySelector('button')!;
    click(trigger);
    act(() => {
      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      popovers.light(popover);
    });
    click(trigger);
    expect(shown(popover)).toBe(false);
  });

  test('REQ-496 · a Tooltip shows after its delay on focus, keeps while the pointer is on it, and hides on Escape', () => {
    vi.useFakeTimers();
    const { host } = mount(<SpTooltip id="t" text="Copy the id" delay={200} trigger={<button type="button">Copy</button>} />);
    const tooltip = host.querySelector('[role="tooltip"]')!;
    const trigger = host.querySelector('button')!;
    act(() => trigger.focus());
    expect(shown(tooltip)).toBe(false);
    act(() => void vi.advanceTimersByTime(200));
    expect(shown(tooltip)).toBe(true);
    act(() => {
      trigger.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
      tooltip.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
      vi.advanceTimersByTime(500);
    });
    expect(shown(tooltip)).toBe(true);
    key(trigger, 'Escape');
    expect(shown(tooltip)).toBe(false);
  });

  test('REQ-496 · a Tooltip shown by hover hides on Escape anywhere, with focus elsewhere (WCAG 1.4.13, T-223)', () => {
    vi.useFakeTimers();
    const { host } = mount(<SpTooltip text="Copy the id" trigger={<button type="button">Copy</button>} />);
    const tooltip = host.querySelector('[role="tooltip"]')!;
    act(() => {
      host.querySelector('button')!.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
      vi.advanceTimersByTime(300);
    });
    expect(shown(tooltip)).toBe(true);
    key(document.body, 'Escape');
    expect(shown(tooltip)).toBe(false);
  });

  test('REQ-496 · a Tooltip hides on blur and on the pointer leaving both', () => {
    vi.useFakeTimers();
    const { host } = mount(<SpTooltip text="Copy the id" trigger={<button type="button">Copy</button>} />);
    const tooltip = host.querySelector('[role="tooltip"]')!;
    const trigger = host.querySelector('button')!;
    act(() => {
      trigger.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
      vi.advanceTimersByTime(300);
    });
    expect(shown(tooltip)).toBe(true);
    act(() => {
      trigger.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
      vi.advanceTimersByTime(100);
    });
    expect(shown(tooltip)).toBe(false);
    act(() => {
      trigger.focus();
      vi.advanceTimersByTime(300);
    });
    expect(shown(tooltip)).toBe(true);
    act(() => trigger.blur());
    expect(shown(tooltip)).toBe(false);
  });
});

describe('React Select and Menu (T-216)', () => {
  const items = [{ key: 'placed', label: 'Placed' }, { key: 'paid', label: 'Paid', disabled: true }, { key: 'packed', label: 'Packed' }, { key: 'shipped', label: 'Shipped' }];
  const active = (host: HTMLElement) => host.querySelector('[role="option"] [part="sp-heighten"]')?.closest('[role="option"]')?.getAttribute('data-key');

  test('REQ-494 · REQ-498 · keys open the list on the chosen option, move past disabled ones, and Enter selects', () => {
    const onChange = vi.fn();
    const { host } = mount(<SpSelect id="s" label="Status" items={items} defaultValue="placed" onChange={onChange} />);
    const trigger = host.querySelector<HTMLButtonElement>('[role="combobox"]')!;
    key(trigger, 'ArrowDown');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(shown(host.querySelector('[popover]')!)).toBe(true);
    expect(active(host)).toBe('placed');
    key(trigger, 'ArrowDown');
    expect(active(host)).toBe('packed');
    expect(trigger.getAttribute('aria-activedescendant')).toBe('s--option-packed');
    key(trigger, 'Enter');
    expect(onChange).toHaveBeenCalledWith('packed');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector('.sp-ui-select-value')!.textContent).toBe('Packed');
  });

  test('REQ-494 · typeahead moves to the next match; its buffer clears 500 ms after the last key', () => {
    vi.useFakeTimers();
    const { host } = mount(<SpSelect label="Status" items={items} defaultOpen />);
    const trigger = host.querySelector('[role="combobox"]')!;
    key(trigger, 's');
    expect(active(host)).toBe('shipped');
    key(trigger, 'p');
    expect(active(host)).toBe('shipped');
    act(() => void vi.advanceTimersByTime(500));
    key(trigger, 'p');
    expect(active(host)).toBe('placed');
  });

  test('REQ-494 · Escape closes without selecting; a click selects an enabled option and submits its key', () => {
    const onChange = vi.fn();
    const { host } = mount(<SpSelect label="Status" name="status" items={items} defaultOpen onChange={onChange} />);
    key(host.querySelector('[role="combobox"]')!, 'Escape');
    expect(onChange).not.toHaveBeenCalled();
    expect(host.querySelector('[role="combobox"]')!.getAttribute('aria-expanded')).toBe('false');
    click(host.querySelector('[data-key="paid"]')!);
    expect(onChange).not.toHaveBeenCalled();
    click(host.querySelector('[data-key="shipped"]')!);
    expect(onChange).toHaveBeenCalledWith('shipped');
    expect(host.querySelector<HTMLInputElement>('input[type="hidden"]')!.value).toBe('shipped');
  });

  test('REQ-494 · a list reopened by a click after Escape starts again on the chosen option; pressing an option keeps focus on the trigger', () => {
    const { host } = mount(<SpSelect label="Status" items={items} defaultValue="placed" />);
    const trigger = host.querySelector('[role="combobox"]')!;
    key(trigger, 'ArrowDown');
    key(trigger, 'ArrowDown');
    expect(active(host)).toBe('packed');
    key(trigger, 'Escape');
    click(trigger);
    expect(active(host)).toBe('placed');
    const press = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
    act(() => void host.querySelector('[data-key="shipped"]')!.dispatchEvent(press));
    expect(press.defaultPrevented).toBe(true);
  });

  const entries = [
    { key: 'edit', label: 'Edit' },
    { key: 'archive', label: 'Archive', disabled: true },
    { type: 'separator' as const, key: 'sep' },
    { key: 'delete', label: 'Delete' },
  ];

  test('REQ-495 · a click opens the menu on its first item, with focus; arrows wrap past disabled ones; Enter selects and returns focus', () => {
    const onSelect = vi.fn();
    const { host } = mount(<SpDropdownMenu id="d" label="Actions" items={entries} onSelect={onSelect} />);
    const trigger = host.querySelector<HTMLButtonElement>('.sp-ui-menu-trigger')!;
    click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement?.getAttribute('data-key')).toBe('edit');
    key(document.activeElement!, 'ArrowDown');
    expect(document.activeElement?.getAttribute('data-key')).toBe('delete');
    key(document.activeElement!, 'ArrowDown');
    expect(document.activeElement?.getAttribute('data-key')).toBe('edit');
    key(document.activeElement!, 'ArrowUp');
    key(document.activeElement!, 'Enter');
    expect(onSelect).toHaveBeenCalledWith('delete');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  test('REQ-495 · ArrowUp opens on the last item; Escape closes; a disabled item ignores a click', () => {
    const onSelect = vi.fn();
    const { host } = mount(<SpDropdownMenu label="Actions" items={entries} onSelect={onSelect} />);
    const trigger = host.querySelector<HTMLButtonElement>('.sp-ui-menu-trigger')!;
    key(trigger, 'ArrowUp');
    expect(document.activeElement?.getAttribute('data-key')).toBe('delete');
    key(document.activeElement!, 'Escape');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    click(trigger);
    click(host.querySelector('[data-key="archive"]')!);
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('REQ-500 · a menu\'s trigger slot takes the menu button\'s ARIA', () => {
    const html = renderToStaticMarkup(<SpDropdownMenu id="d" label="Actions" items={entries} trigger={<button type="button">More</button>} />);
    expect(html).toContain('<span class="sp-ui-trigger"><button type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="d--menu">More</button></span>');
  });
});

describe('React toasts (T-216)', () => {
  test('REQ-497 · a toast closes after its duration, pausing while the pointer is in it, and reports the close', () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const { host } = mount(<SpToast title="Saved" duration={2000} defaultOpen onOpenChange={onOpenChange} />);
    const toast = host.querySelector('li')!;
    act(() => {
      vi.advanceTimersByTime(1000);
      toast.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
      vi.advanceTimersByTime(5000);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => {
      toast.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
      vi.advanceTimersByTime(2000);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.getAttribute('data-state')).toBe('closed');
  });

  test('REQ-497 · a toast takes its toaster\'s duration; its close button closes it; F8 focuses the toaster', () => {
    vi.useFakeTimers();
    const { host } = mount(
      <SpToaster duration={3000}>
        <SpToast title="One" defaultOpen />
        <SpToast title="Two" defaultOpen duration={Infinity} />
      </SpToaster>,
    );
    const [one, two] = [...host.querySelectorAll('li')];
    act(() => void vi.advanceTimersByTime(3000));
    expect(one!.getAttribute('data-state')).toBe('closed');
    expect(two!.getAttribute('data-state')).toBe('open');
    click(two!.querySelector('.sp-ui-icon-button')!);
    expect(two!.getAttribute('data-state')).toBe('closed');
    act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F8', bubbles: true })));
    expect(document.activeElement).toBe(host.querySelector('section'));
  });
});
