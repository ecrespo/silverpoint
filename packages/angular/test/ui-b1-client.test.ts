// @vitest-environment happy-dom
import { ApplicationRef, Component, provideZonelessChangeDetection, signal, type Type } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { SpButton, SpCheckbox, SpInput, SpSwitch } from '@silverpoint/angular/ui';
import { afterEach, describe, expect, test, vi } from 'vitest';

let apps: ApplicationRef[] = [];
afterEach(() => {
  for (const app of apps) app.destroy();
  apps = [];
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
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

describe('Angular B1 behaviour (T-146)', () => {
  test('REQ-322 · [(value)] on sp-input follows what is typed, and the parent can set it', async () => {
    const model = signal('Car');
    const app = await mount(host('<sp-input label="City" [(value)]="model" />', [SpInput], { model }));
    const input = document.querySelector('input')!;
    input.value = 'Caracas';
    input.dispatchEvent(new Event('input'));
    await app.whenStable();
    expect(model()).toBe('Caracas');
    model.set('Mérida');
    await app.whenStable();
    expect(input.value).toBe('Mérida');
  });

  test('REQ-323 · sp-checkbox is a ControlValueAccessor: a FormControl reads and writes it', async () => {
    const control = new FormControl(false);
    const app = await mount(host('<sp-checkbox label="Baseline" [formControl]="control" />', [SpCheckbox, ReactiveFormsModule], { control }));
    document.querySelector('input')!.click();
    await app.whenStable();
    expect(control.value).toBe(true);
    control.setValue(false);
    await app.whenStable();
    expect(document.querySelector('input')!.checked).toBe(false);
    control.disable();
    await app.whenStable();
    expect(document.querySelector('input')!.disabled).toBe(true);
  });

  test('REQ-322 · an uncontrolled sp-switch holds its state and emits valueChange', async () => {
    const seen: boolean[] = [];
    const app = await mount(host('<sp-switch label="Precision" (valueChange)="seen.push($event)" />', [SpSwitch], { seen }));
    document.querySelector('input')!.click();
    await app.whenStable();
    expect(document.querySelector('input')!.checked).toBe(true);
    expect(seen).toEqual([true]);
  });

  test('REQ-326 · a disabled control emits nothing; a disabled link emits no click', async () => {
    const seen: unknown[] = [];
    const app = await mount(
      host('<sp-switch label="P" [disabled]="true" (valueChange)="seen.push($event)" /><a spButton href="/docs" [disabled]="true" (click)="seen.push(\'click\')">Docs</a>', [SpSwitch, SpButton], { seen }),
    );
    document.querySelector('input')!.click();
    document.querySelector('a')!.click();
    await app.whenStable();
    expect(seen).toEqual([]);
    expect(document.querySelector('a')!.hasAttribute('href')).toBe(false);
  });

  test('REQ-322 · sp-checkbox sets the native indeterminate property after render', async () => {
    await mount(host('<sp-checkbox label="All" [indeterminate]="true" />', [SpCheckbox]));
    expect(document.querySelector('input')!.indeterminate).toBe(true);
  });

  test('REQ-323 · the native inputs submit with a native form', async () => {
    await mount(
      host('<form><sp-input name="city" defaultValue="Caracas" label="City" /><sp-checkbox name="baseline" label="Baseline" [defaultValue]="true" /><sp-switch name="precision" label="P" /></form>', [SpInput, SpCheckbox, SpSwitch]),
    );
    expect(Object.fromEntries(new FormData(document.querySelector('form')!))).toEqual({ city: 'Caracas', baseline: 'on' });
  });

  test('REQ-123 · a forced precision applies after render, over the input', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }));
    await mount(host('<button spButton mode="ink">Save</button>', [SpButton]));
    expect(document.querySelector('button')!.getAttribute('data-mode')).toBe('precision');
  });
});
