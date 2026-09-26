// @vitest-environment happy-dom
import { Component, provideZonelessChangeDetection, type ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SpDashboard, SpDashboardCell } from '@silverpoint/angular/dashboard';
import { SpLineChart } from '@silverpoint/angular/line-chart';
import { __setDiagnosticSink } from '@silverpoint/core';
import { afterEach, describe, expect, test, vi } from 'vitest';

let apps: ApplicationRef[] = [];
let restore: () => void = () => {};
afterEach(() => {
  for (const app of apps) app.destroy();
  apps = [];
  restore();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('sp-dashboard in the browser (T-113)', () => {
  test('REQ-207 · renders at the nominal width, then at the measured width', async () => {
    restore = __setDiagnosticSink(() => {});
    const observers: ((width: number) => void)[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: (entries: { contentRect: { width: number } }[]) => void) {
          observers.push((width) => callback([{ contentRect: { width } }]));
        }
        observe() {}
        disconnect() {}
      },
    );
    const Page = Component({
      selector: 'app-root',
      imports: [SpDashboard, SpDashboardCell, SpLineChart],
      template: `<sp-dashboard id="ops" title="Ops"><sp-dashboard-cell><sp-line-chart title="Traffic" /></sp-dashboard-cell></sp-dashboard>`,
    })(class Page {});
    document.body.innerHTML = '<app-root></app-root>';
    const app = await bootstrapApplication(Page, { providers: [provideZonelessChangeDetection()] });
    apps.push(app);
    await app.whenStable();
    const box = () => document.querySelector('svg.sp-chart')?.getAttribute('viewBox');
    expect(box()).toBe('0 0 288 240');
    observers.forEach((notify) => notify(300));
    await app.whenStable();
    expect(box()).toBe('0 0 300 240');
  });
});
