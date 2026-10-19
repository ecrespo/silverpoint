// @vitest-environment happy-dom
import { ApplicationRef, Component, provideZonelessChangeDetection, signal, type Type } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { SpDrawer, SpDropdownMenu, SpModal, SpPopover, SpSelect, SpToast, SpToaster, SpTooltip, SpTrigger } from '@silverpoint/angular/ui';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { stubPopoverApi } from '../../../tools/visual-gate/popover-stub';

/*
 * Angular overlays in the browser (T-215, T-216; REQ-491..REQ-500): opened after render with
 * `uiOverlaySync`, placed with `uiAnchor`, `[(open)]`; every key of the Select and the Menu goes
 * through the core.
 */

let apps: ApplicationRef[] = [];
let popovers: ReturnType<typeof stubPopoverApi>;
beforeEach(() => {
  popovers = stubPopoverApi();
});
afterEach(() => {
  for (const app of apps) app.destroy();
  apps = [];
  document.body.innerHTML = '';
  popovers.restore();
  vi.useRealTimers();
});

const B = [SpModal, SpDrawer, SpPopover, SpTooltip, SpSelect, SpDropdownMenu, SpToast, SpToaster, SpTrigger];

async function mount(template: string, members: object = {}, imports: Type<unknown>[] = []): Promise<ApplicationRef> {
  document.body.innerHTML = '<app-root></app-root>';
  const host = Component({ selector: 'app-root', imports: [...B, ...imports], template })(
    class {
      constructor() {
        Object.assign(this, members);
      }
    },
  );
  const app = await bootstrapApplication(host, { providers: [provideZonelessChangeDetection()] });
  apps.push(app);
  // The zoneless scheduler runs on timers: under fake ones, render now.
  if (vi.isFakeTimers()) app.tick();
  else await app.whenStable();
  return app;
}

const $ = <E extends Element = HTMLElement>(selector: string) => document.querySelector<E>(selector)!;
const shown = (element: Element) => element.matches(':popover-open');
const key = (target: Element, name: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
/** Under fake timers: the timers, then the render, which their scheduler would otherwise run. */
const tick = async (app: ApplicationRef, ms = 0) => {
  vi.advanceTimersByTime(ms);
  app.tick();
  await Promise.resolve();
};

describe('Angular dialogs (T-215, T-216)', () => {
  const modal = '<sp-modal id="m" title="Edit" [(open)]="open" [dismissible]="dismissible"><button type="button" spTrigger>Edit</button>body</sp-modal>';

  test('REQ-491 · REQ-500 · the trigger opens the dialog with showModal() after render; its close button closes it', async () => {
    const open = signal<boolean | undefined>(undefined);
    const app = await mount(modal, { open, dismissible: true });
    const dialog = $<HTMLDialogElement>('dialog');
    const showModal = vi.spyOn(dialog, 'showModal');
    const trigger = $('button[spTrigger]');
    expect(dialog.open).toBe(false);
    trigger.click();
    await app.whenStable();
    expect(showModal).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('data-state')).toBe('open');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(open()).toBe(true);
    $('dialog .sp-ui-icon-button').click();
    await app.whenStable();
    expect(dialog.open).toBe(false);
    expect(open()).toBe(false);
  });

  test("REQ-491 · REQ-500 · Escape (`cancel`) and the platform's close report the close; the parent's state opens it", async () => {
    const open = signal<boolean | undefined>(true);
    const app = await mount(modal, { open, dismissible: true });
    const dialog = $<HTMLDialogElement>('dialog');
    expect(dialog.open).toBe(true);
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(false);
    dialog.close();
    await app.whenStable();
    expect(open()).toBe(false);
    open.set(true);
    await app.whenStable();
    expect(dialog.open).toBe(true);
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await app.whenStable();
    expect(dialog.open).toBe(false);
    expect(open()).toBe(false);
  });

  test('REQ-491 · `dismissible: false` cancels Escape and ignores a backdrop click', async () => {
    const app = await mount(modal, { open: signal(true), dismissible: false });
    const dialog = $<HTMLDialogElement>('dialog');
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await app.whenStable();
    expect(dialog.open).toBe(true);
  });

  test('REQ-491 · a click inside the dialog, on its content, leaves it open', async () => {
    const app = await mount(modal, { open: signal(true), dismissible: true });
    $('.sp-ui-overlay-body').click();
    await app.whenStable();
    expect($<HTMLDialogElement>('dialog').open).toBe(true);
  });

  test('REQ-491 · a Drawer with `modal: false` opens with show()', async () => {
    const app = await mount('<sp-drawer title="Filters" [modal]="false"><button type="button" spTrigger>F</button></sp-drawer>');
    const show = vi.spyOn($<HTMLDialogElement>('dialog'), 'show');
    $('button[spTrigger]').click();
    await app.whenStable();
    expect(show).toHaveBeenCalledOnce();
    expect($<HTMLDialogElement>('dialog').open).toBe(true);
  });
});

describe('Angular popovers (T-215, T-216)', () => {
  test('REQ-492 · REQ-493 · a Popover opens from its trigger, is placed by uiAnchor, and a light dismiss reports the close', async () => {
    const seen: boolean[] = [];
    const app = await mount('<sp-popover id="p" title="Order" (openChange)="seen.push($event)"><button type="button" spTrigger>Details</button>body</sp-popover>', { seen });
    const popover = $('[popover]');
    const trigger = $('button[spTrigger]');
    trigger.click();
    await app.whenStable();
    expect(shown(popover)).toBe(true);
    expect(popover.style.getPropertyValue('--sp-ui-x')).toMatch(/px$/);
    expect(popover.getAttribute('data-side')).toBe('bottom');
    popovers.light(popover);
    await app.whenStable();
    expect(seen).toEqual([true, false]);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  test('REQ-492 · a click on the trigger of an open popover closes it, even when the click outside dismissed it first', async () => {
    const app = await mount('<sp-popover title="Order"><button type="button" spTrigger>Details</button>body</sp-popover>');
    const popover = $('[popover]');
    const trigger = $('button[spTrigger]');
    trigger.click();
    await app.whenStable();
    trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    popovers.light(popover);
    await app.whenStable();
    trigger.click();
    await app.whenStable();
    expect(shown(popover)).toBe(false);
  });

  test('REQ-500 · an overlay open from `defaultOpen` reports nothing when asked to open again', async () => {
    const seen: boolean[] = [];
    const app = await mount('<sp-tooltip text="Copy the id" [defaultOpen]="true" (openChange)="seen.push($event)"><button type="button" spTrigger>Copy</button></sp-tooltip>', { seen });
    vi.useFakeTimers();
    $('button[spTrigger]').dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
    await tick(app, 300);
    expect(seen).toEqual([]);
    expect(shown($('[role="tooltip"]'))).toBe(true);
  });

  test('REQ-496 · a Tooltip shows after its delay on focus, keeps while the pointer is on it, and hides on Escape or blur', async () => {
    const app = await mount('<sp-tooltip id="t" text="Copy the id" [delay]="200"><button type="button" spTrigger>Copy</button></sp-tooltip>');
    vi.useFakeTimers();
    const tooltip = $('[role="tooltip"]');
    const trigger = $('button[spTrigger]');
    trigger.focus();
    await tick(app);
    expect(shown(tooltip)).toBe(false);
    await tick(app, 200);
    expect(shown(tooltip)).toBe(true);
    trigger.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
    tooltip.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
    await tick(app, 500);
    expect(shown(tooltip)).toBe(true);
    key(trigger, 'Escape');
    await tick(app);
    expect(shown(tooltip)).toBe(false);
    trigger.blur();
    trigger.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
    await tick(app, 200);
    expect(shown(tooltip)).toBe(true);
    trigger.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
    await tick(app, 100);
    expect(shown(tooltip)).toBe(false);
  });
});

describe('Angular Select and Menu (T-216)', () => {
  const items = [{ key: 'placed', label: 'Placed' }, { key: 'paid', label: 'Paid', disabled: true }, { key: 'packed', label: 'Packed' }, { key: 'shipped', label: 'Shipped' }];
  const active = () => document.querySelector('[role="option"] [part="sp-heighten"]')?.closest('[role="option"]')?.getAttribute('data-key');

  test('REQ-494 · REQ-498 · keys open the list on the chosen option, move past disabled ones, and Enter selects', async () => {
    const value = signal<string | null | undefined>('placed');
    const app = await mount('<sp-select id="s" label="Status" [items]="items" [(value)]="value" />', { items, value });
    const trigger = $('[role="combobox"]');
    key(trigger, 'ArrowDown');
    await app.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(shown($('[popover]'))).toBe(true);
    expect(active()).toBe('placed');
    key(trigger, 'ArrowDown');
    await app.whenStable();
    expect(active()).toBe('packed');
    expect(trigger.getAttribute('aria-activedescendant')).toBe('s--option-packed');
    key(trigger, 'Enter');
    await app.whenStable();
    expect(value()).toBe('packed');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect($('.sp-ui-select-value').textContent).toBe('Packed');
  });

  test('REQ-494 · typeahead moves to the next match; its buffer clears 500 ms after the last key', async () => {
    const app = await mount('<sp-select label="Status" [items]="items" [defaultOpen]="true" />', { items });
    vi.useFakeTimers();
    const trigger = $('[role="combobox"]');
    key(trigger, 's');
    await tick(app);
    expect(active()).toBe('shipped');
    key(trigger, 'p');
    await tick(app);
    expect(active()).toBe('shipped');
    await tick(app, 500);
    key(trigger, 'p');
    await tick(app);
    expect(active()).toBe('placed');
  });

  test('REQ-494 · REQ-323 · Escape closes without selecting; a click selects an enabled option; a FormControl reads it', async () => {
    const status = new FormControl<string | null>(null);
    const app = await mount('<sp-select label="Status" name="status" [items]="items" [defaultOpen]="true" [formControl]="status" />', { items, status }, [ReactiveFormsModule]);
    key($('[role="combobox"]'), 'Escape');
    await app.whenStable();
    expect(status.value).toBeNull();
    expect($('[role="combobox"]').getAttribute('aria-expanded')).toBe('false');
    $('[data-key="paid"]').click();
    await app.whenStable();
    expect(status.value).toBeNull();
    $('[data-key="shipped"]').click();
    await app.whenStable();
    expect(status.value).toBe('shipped');
    expect($<HTMLInputElement>('input[type="hidden"]').value).toBe('shipped');
    status.setValue('packed');
    await app.whenStable();
    expect($('.sp-ui-select-value').textContent).toBe('Packed');
  });

  test('REQ-494 · a list reopened by a click after Escape starts again on the chosen option; pressing an option keeps focus on the trigger', async () => {
    const app = await mount('<sp-select label="Status" [items]="items" defaultValue="placed" />', { items });
    const trigger = $('[role="combobox"]');
    key(trigger, 'ArrowDown');
    await app.whenStable();
    key(trigger, 'ArrowDown');
    await app.whenStable();
    expect(active()).toBe('packed');
    key(trigger, 'Escape');
    await app.whenStable();
    trigger.click();
    await app.whenStable();
    expect(active()).toBe('placed');
    const press = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
    $('[data-key="shipped"]').dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
  });

  test("REQ-323 · a form's null leaves sp-select with none chosen; it does not fall back to defaultValue", async () => {
    const status = new FormControl<string | null>('packed');
    const app = await mount('<sp-select label="Status" [items]="items" defaultValue="placed" [formControl]="status" />', { items, status }, [ReactiveFormsModule]);
    expect($('.sp-ui-select-value').textContent).toBe('Packed');
    status.setValue(null);
    await app.whenStable();
    expect($('.sp-ui-select-value').textContent).toBe('Select…');
  });

  const entries = [
    { key: 'edit', label: 'Edit' },
    { key: 'archive', label: 'Archive', disabled: true },
    { type: 'separator', key: 'sep' },
    { key: 'delete', label: 'Delete' },
  ];

  test('REQ-495 · a click opens the menu on its first item, with focus; arrows wrap past disabled ones; Enter selects and returns focus', async () => {
    const seen: string[] = [];
    const app = await mount('<sp-dropdown-menu id="d" label="Actions" [items]="entries" (select)="seen.push($event)" />', { entries, seen });
    const trigger = $('.sp-ui-menu-trigger');
    trigger.click();
    await app.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement?.getAttribute('data-key')).toBe('edit');
    key(document.activeElement!, 'ArrowDown');
    await app.whenStable();
    expect(document.activeElement?.getAttribute('data-key')).toBe('delete');
    key(document.activeElement!, 'ArrowDown');
    await app.whenStable();
    expect(document.activeElement?.getAttribute('data-key')).toBe('edit');
    key(document.activeElement!, 'ArrowUp');
    await app.whenStable();
    key(document.activeElement!, 'Enter');
    await app.whenStable();
    expect(seen).toEqual(['delete']);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  test('REQ-495 · ArrowUp opens on the last item; Escape closes; a disabled item ignores a click; a spTrigger opens it', async () => {
    const seen: string[] = [];
    const app = await mount('<sp-dropdown-menu label="Actions" [items]="entries" (select)="seen.push($event)" />', { entries, seen });
    const trigger = $('.sp-ui-menu-trigger');
    key(trigger, 'ArrowUp');
    await app.whenStable();
    expect(document.activeElement?.getAttribute('data-key')).toBe('delete');
    key(document.activeElement!, 'Escape');
    await app.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click();
    await app.whenStable();
    $('[data-key="archive"]').click();
    await app.whenStable();
    expect(seen).toEqual([]);
    apps.pop()!.destroy();
    const other = await mount('<sp-dropdown-menu id="d" label="Actions" [items]="entries"><button type="button" spTrigger>More</button></sp-dropdown-menu>', { entries });
    $('button[spTrigger]').click();
    await other.whenStable();
    expect($('button[spTrigger]').getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement?.getAttribute('data-key')).toBe('edit');
    key(document.activeElement!, 'Escape');
    await other.whenStable();
    expect(document.activeElement).toBe($('button[spTrigger]'));
  });
});

describe('Angular toasts (T-216)', () => {
  test('REQ-497 · a toast closes after its duration, pausing while the pointer is in it, and reports the close', async () => {
    vi.useFakeTimers();
    const seen: boolean[] = [];
    const app = await mount('<sp-toast title="Saved" [duration]="2000" [defaultOpen]="true" (openChange)="seen.push($event)" />', { seen });
    const toast = $('li');
    await tick(app, 1000);
    toast.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
    await tick(app, 5000);
    expect(seen).toEqual([]);
    toast.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
    await tick(app, 2000);
    expect(seen).toEqual([false]);
    expect(toast.getAttribute('data-state')).toBe('closed');
  });

  test("REQ-497 · a toast takes its toaster's duration; its close button closes it; F8 focuses the toaster", async () => {
    vi.useFakeTimers();
    const app = await mount('<sp-toaster [duration]="3000"><sp-toast title="One" [defaultOpen]="true" /><sp-toast title="Two" [defaultOpen]="true" [duration]="forever" /></sp-toaster>', { forever: Infinity });
    const [one, two] = [...document.querySelectorAll('li')];
    await tick(app, 3000);
    expect(one!.getAttribute('data-state')).toBe('closed');
    expect(two!.getAttribute('data-state')).toBe('open');
    two!.querySelector<HTMLElement>('.sp-ui-icon-button')!.click();
    await tick(app);
    expect(two!.getAttribute('data-state')).toBe('closed');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'F8', bubbles: true }));
    expect(document.activeElement).toBe($('section'));
  });
});
