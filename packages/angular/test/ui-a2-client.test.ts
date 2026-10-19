// @vitest-environment happy-dom
import { ApplicationRef, Component, provideZonelessChangeDetection, signal, type Type } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { SpCollapse, SpCollapseItem, SpInputNumber, SpPagination, SpTextarea } from '@silverpoint/angular/ui';
import { afterEach, describe, expect, test } from 'vitest';

let apps: ApplicationRef[] = [];
afterEach(() => {
  for (const app of apps) app.destroy();
  apps = [];
  document.body.innerHTML = '';
});

async function mount(host: Type<unknown>): Promise<ApplicationRef> {
  document.body.innerHTML = '<app-root></app-root>';
  const app = await bootstrapApplication(host, { providers: [provideZonelessChangeDetection()] });
  apps.push(app);
  await app.whenStable();
  return app;
}

const host = (template: string, imports: Type<unknown>[], members: object = {}) =>
  Component({ selector: 'app-root', imports, template })(class { constructor() { Object.assign(this, members); } });

const type = (field: HTMLInputElement | HTMLTextAreaElement, text: string) => {
  field.value = text;
  field.dispatchEvent(new Event('input', { bubbles: true }));
};
const current = () => document.querySelector('[aria-current="page"]')!.textContent;
const page = (n: number) => document.querySelector<HTMLButtonElement>(`button[data-page="${n}"][aria-label="Page ${n}"]`)!;

describe('Angular A2 behaviour (T-214)', () => {
  test('REQ-476 · REQ-322 · [(current)] follows the clicked page, and the parent can set it', async () => {
    const model = signal(2);
    const app = await mount(host('<sp-pagination [total]="50" [(current)]="model" />', [SpPagination], { model }));
    page(3).click();
    await app.whenStable();
    expect(model()).toBe(3);
    expect(current()).toBe('Page 3');
    model.set(1);
    await app.whenStable();
    expect(current()).toBe('Page 1');
  });

  test('REQ-322 · an uncontrolled sp-pagination holds the page and reports it', async () => {
    const seen: number[] = [];
    const app = await mount(host('<sp-pagination [total]="50" [defaultCurrent]="2" (currentChange)="seen.push($event)" />', [SpPagination], { seen }));
    page(3).click();
    await app.whenStable();
    expect(seen).toEqual([3]);
    expect(current()).toBe('Page 3');
  });

  test('REQ-482 · an accordion hands its items one name; an item reports its toggle', async () => {
    const seen: boolean[] = [];
    const app = await mount(
      host('<sp-collapse id="faq" accordion><sp-collapse-item title="One" (toggle)="seen.push($event)">a</sp-collapse-item><sp-collapse-item title="Two">b</sp-collapse-item></sp-collapse>', [SpCollapse, SpCollapseItem], { seen }),
    );
    const details = [...document.querySelectorAll('details')];
    expect(details.map((d) => d.getAttribute('name'))).toEqual(['faq--accordion', 'faq--accordion']);
    details[0]!.open = true;
    details[0]!.dispatchEvent(new Event('toggle'));
    await app.whenStable();
    expect(seen).toEqual([true]);
  });

  test('REQ-482 · a disabled item does not toggle: its summary\'s activation is cancelled', async () => {
    await mount(host('<sp-collapse-item title="Locked" disabled>a</sp-collapse-item><sp-collapse-item title="Open">b</sp-collapse-item>', [SpCollapseItem]));
    const [locked, free] = [...document.querySelectorAll('summary')];
    const a = new MouseEvent('click', { bubbles: true, cancelable: true });
    locked!.dispatchEvent(a);
    expect(a.defaultPrevented).toBe(true);
    const b = new MouseEvent('click', { bubbles: true, cancelable: true });
    free!.dispatchEvent(b);
    expect(b.defaultPrevented).toBe(false);
  });

  test('REQ-482 · [(open)] is open as given', async () => {
    const model = signal(false);
    const app = await mount(host('<sp-collapse-item title="T" [(open)]="model">a</sp-collapse-item>', [SpCollapseItem], { model }));
    expect(document.querySelector('details')!.hasAttribute('open')).toBe(false);
    model.set(true);
    await app.whenStable();
    expect(document.querySelector('details')!.hasAttribute('open')).toBe(true);
  });

  test('REQ-484 · REQ-488 · [(value)] on sp-textarea follows what is typed, and the parent can set it', async () => {
    const model = signal('Hi');
    const app = await mount(host('<sp-textarea label="Notes" showCount [maxLength]="10" [(value)]="model" />', [SpTextarea], { model }));
    const textarea = document.querySelector('textarea')!;
    expect(textarea.value).toBe('Hi');
    type(textarea, 'Hello');
    await app.whenStable();
    expect(model()).toBe('Hello');
    expect(document.querySelector('.sp-ui-count')!.textContent).toBe('5 / 10');
    model.set('Bye');
    await app.whenStable();
    expect(textarea.value).toBe('Bye');
  });

  test('REQ-488 · sp-textarea and sp-input-number are ControlValueAccessors: a FormControl reads, writes and disables them', async () => {
    const notes = new FormControl('a');
    const qty = new FormControl<number | null>(2);
    const app = await mount(
      host('<sp-textarea label="Notes" [formControl]="notes" /><sp-input-number label="Qty" [max]="5" [formControl]="qty" />', [SpTextarea, SpInputNumber, ReactiveFormsModule], { notes, qty }),
    );
    type(document.querySelector('textarea')!, 'abc');
    document.querySelector<HTMLButtonElement>('button[data-step="1"]')!.click();
    await app.whenStable();
    expect(notes.value).toBe('abc');
    expect(qty.value).toBe(3);
    qty.setValue(5);
    notes.disable();
    await app.whenStable();
    expect(document.querySelector('input')!.value).toBe('5');
    expect(document.querySelector<HTMLButtonElement>('button[data-step="1"]')!.disabled).toBe(true);
    expect(document.querySelector('textarea')!.disabled).toBe(true);
  });

  test('REQ-488 · a form\'s null empties sp-input-number; it does not fall back to defaultValue', async () => {
    const qty = new FormControl<number | null>(2);
    const app = await mount(host('<sp-input-number label="Qty" [defaultValue]="4" [formControl]="qty" />', [SpInputNumber, ReactiveFormsModule], { qty }));
    expect(document.querySelector('input')!.value).toBe('2');
    qty.setValue(null);
    await app.whenStable();
    expect(document.querySelector('input')!.value).toBe('');
  });

  test('REQ-485 · typing is held until committed; the committed value is clamped, an emptied one is null', async () => {
    const seen: (number | null)[] = [];
    const app = await mount(host('<sp-input-number label="Qty" [defaultValue]="3" [min]="5" [max]="20" (valueChange)="seen.push($event)" />', [SpInputNumber], { seen }));
    const input = document.querySelector('input')!;
    type(input, '1');
    await app.whenStable();
    expect(input.value).toBe('1');
    expect(seen).toEqual([]);
    type(input, '99');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await app.whenStable();
    expect(seen).toEqual([20]);
    expect(input.value).toBe('20');
    type(input, '99');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await app.whenStable();
    expect(input.value).toBe('20');
    type(input, '');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await app.whenStable();
    expect(seen.at(-1)).toBeNull();
    expect(input.value).toBe('');
  });
});
