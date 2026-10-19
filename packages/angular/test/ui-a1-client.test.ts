// @vitest-environment happy-dom
import { ApplicationRef, Component, provideZonelessChangeDetection, type Type } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SpSurface, SpTable } from '@silverpoint/angular/ui';
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

describe('Angular A1 behaviour (T-213)', () => {
  test('REQ-474 · a sortable header emits (sort) with its key; the consumer sorts', async () => {
    const sorted: string[] = [];
    const columns = [{ key: 'order', title: 'Order' }, { key: 'amount', title: 'Amount', sortable: true }];
    await mount(host('<sp-table caption="Orders" [columns]="columns" [data]="data" (sort)="sorted.push($event)" />', [SpTable], { columns, data: [{ order: 'A', amount: 2 }], sorted }));
    const buttons = document.querySelectorAll<HTMLButtonElement>('button.sp-ui-sort');
    expect(buttons).toHaveLength(1);
    buttons[0]!.click();
    expect(sorted).toEqual(['amount']);
  });

  test('REQ-472 · [spSurface] follows its inputs: a frame drawn, then removed', async () => {
    const state = { frame: 'card' as string | undefined };
    const app = await mount(host('<div spSurface [frame]="state.frame">Text</div>', [SpSurface], { state }));
    const root = document.querySelector('div.sp-surface')!;
    expect(root.querySelector('[part="sp-frame"]')).not.toBeNull();
    state.frame = undefined;
    // A plain object is not a signal: tell the view it changed.
    (app.components[0]!.changeDetectorRef as { markForCheck(): void }).markForCheck();
    app.tick();
    await app.whenStable();
    expect(root.querySelector('[part="sp-frame"]')).toBeNull();
    expect(root.getAttribute('data-frame')).toBe('0');
  });
});
