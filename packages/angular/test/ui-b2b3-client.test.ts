// @vitest-environment happy-dom
import { ApplicationRef, Component, provideZonelessChangeDetection, signal, type Type } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { SpAlert, SpRadioGroup, SpRate, SpSegmented, SpSlider, SpTabPanel, SpTabs, SpTag } from '@silverpoint/angular/ui';
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

const grounds = [
  { key: 'silverpoint', label: 'silverpoint' },
  { key: 'cyanotype', label: 'cyanotype', disabled: true },
  { key: 'burin', label: 'burin' },
];
const radios = () => [...document.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
const key = (target: Element, name: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));

describe('Angular B2 behaviour (T-149)', () => {
  test('REQ-322 · [(value)] on sp-radio-group follows the click, and the parent can set it', async () => {
    const model = signal<string | null>(null);
    const app = await mount(host('<sp-radio-group name="g" label="Ground" [items]="grounds" [(value)]="model" />', [SpRadioGroup], { model, grounds }));
    radios()[2]!.click();
    await app.whenStable();
    expect(model()).toBe('burin');
    model.set('silverpoint');
    await app.whenStable();
    expect(radios().map((r) => r.checked)).toEqual([true, false, false]);
  });

  test('REQ-323 · sp-segmented is a ControlValueAccessor: a FormControl reads, writes and disables it', async () => {
    const control = new FormControl('day');
    const items = ['day', 'week'].map((k) => ({ key: k, label: k }));
    const app = await mount(host('<sp-segmented label="Period" [items]="items" [formControl]="control" />', [SpSegmented, ReactiveFormsModule], { control, items }));
    radios()[1]!.click();
    await app.whenStable();
    expect(control.value).toBe('week');
    control.setValue('day');
    await app.whenStable();
    expect(radios().map((r) => r.checked)).toEqual([true, false]);
    control.disable();
    await app.whenStable();
    expect(radios().every((r) => r.disabled)).toBe(true);
  });

  test('REQ-315 · REQ-326 · arrows move and select through the core, skipping a disabled item', async () => {
    const seen: string[] = [];
    const app = await mount(host('<sp-radio-group name="g" label="Ground" [items]="grounds" value="silverpoint" (valueChange)="seen.push($event)" />', [SpRadioGroup], { grounds, seen }));
    radios()[0]!.focus();
    key(radios()[0]!, 'ArrowDown');
    await app.whenStable();
    expect(document.activeElement).toBe(radios()[2]);
    expect(seen).toEqual(['burin']);
  });

  test('REQ-315 · sp-tabs: automatic activation selects on arrow; panels follow', async () => {
    const seen: string[] = [];
    const items = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }];
    const app = await mount(
      host('<sp-tabs id="t" [items]="items" (valueChange)="seen.push($event)"><sp-tab-panel value="a">first</sp-tab-panel><sp-tab-panel value="b">second</sp-tab-panel></sp-tabs>', [SpTabs, SpTabPanel], { items, seen }),
    );
    const tabs = () => [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = () => [...document.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    expect(panels().map((p) => p.hasAttribute('hidden'))).toEqual([false, true]);
    tabs()[0]!.focus();
    key(tabs()[0]!, 'ArrowRight');
    await app.whenStable();
    expect(seen).toEqual(['b']);
    expect(tabs().map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'true']);
    expect(panels().map((p) => p.hasAttribute('hidden'))).toEqual([true, false]);
  });

  test('REQ-321 · a dir="rtl" on the component\'s .sp-ui root, inside the host, mirrors the arrows', async () => {
    const seen: string[] = [];
    const items = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }, { key: 'c', label: 'C' }];
    const app = await mount(host('<sp-tabs [items]="items" value="b" (valueChange)="seen.push($event)" />', [SpTabs], { items, seen }));
    document.querySelector('sp-tabs .sp-ui')!.setAttribute('dir', 'rtl');
    const tabs = [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    tabs[1]!.focus();
    key(tabs[1]!, 'ArrowLeft');
    await app.whenStable();
    expect(seen).toEqual(['c']);
  });

  test('REQ-315 · sp-tabs manual activation moves focus only; a click selects', async () => {
    const seen: string[] = [];
    const items = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }];
    const app = await mount(host('<sp-tabs [items]="items" activation="manual" (valueChange)="seen.push($event)" />', [SpTabs], { items, seen }));
    const tabs = [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    tabs[0]!.focus();
    key(tabs[0]!, 'ArrowRight');
    await app.whenStable();
    expect(document.activeElement).toBe(tabs[1]);
    expect(seen).toEqual([]);
    tabs[1]!.click();
    await app.whenStable();
    expect(seen).toEqual(['b']);
  });

  test('REQ-322 · sp-slider emits numbers; its fraction follows', async () => {
    const model = signal(30);
    const app = await mount(host('<sp-slider label="Volume" [(value)]="model" />', [SpSlider], { model }));
    const input = document.querySelector<HTMLInputElement>('input[type="range"]')!;
    input.value = '55';
    input.dispatchEvent(new Event('input'));
    await app.whenStable();
    expect(model()).toBe(55);
    expect(document.querySelector<HTMLElement>('.sp-slider')!.getAttribute('style')).toContain('--sp-ui-fraction: 0.55');
  });

  test('REQ-322 · sp-rate emits the number clicked; read-only emits nothing and keeps its value', async () => {
    const seen: number[] = [];
    const app = await mount(host('<sp-rate label="Q" [value]="2" (valueChange)="seen.push($event)" />', [SpRate], { seen }));
    radios()[3]!.click();
    await app.whenStable();
    expect(seen).toEqual([4]);
    expect(document.querySelectorAll('[data-filled="true"]')).toHaveLength(4);
    apps.pop()!.destroy();
    const frozen: number[] = [];
    const readOnly = await mount(host('<sp-rate label="Q" [value]="3" [readOnly]="true" (valueChange)="frozen.push($event)" />', [SpRate], { frozen }));
    radios()[0]!.click();
    await readOnly.whenStable();
    expect(frozen).toEqual([]);
    expect(radios().map((r) => r.checked)).toEqual([false, false, true, false, false]);
  });
});

describe('Angular B3 behaviour (T-152)', () => {
  test('a closable sp-tag and sp-alert emit (close) from their close button', async () => {
    const seen: string[] = [];
    const app = await mount(
      host('<sp-tag [closable]="true" (close)="seen.push(\'tag\')">review</sp-tag><sp-alert [closable]="true" (close)="seen.push(\'alert\')">done</sp-alert>', [SpTag, SpAlert], { seen }),
    );
    for (const button of document.querySelectorAll<HTMLButtonElement>('.sp-ui-close')) button.click();
    await app.whenStable();
    expect(seen).toEqual(['tag', 'alert']);
  });
});
