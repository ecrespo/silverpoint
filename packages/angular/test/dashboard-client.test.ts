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

describe('sp-dashboard linked interaction (T-121)', () => {
  test('REQ-216 · REQ-218 · the source’s active item marks the same hour in the other chart; it clears with the source', async () => {
    restore = __setDiagnosticSink(() => {});
    const changes: unknown[] = [];
    const Page = Component({
      selector: 'app-root',
      imports: [SpDashboard, SpDashboardCell, SpLineChart],
      template: `<sp-dashboard id="lk" title="Linked" [link]="{ key: 'hour' }" (linkChange)="changes.push($event)">
        <sp-dashboard-cell cell="a"><sp-line-chart title="Source" [data]="a" xKey="hour" valueKey="hits" /></sp-dashboard-cell>
        <sp-dashboard-cell cell="b"><sp-line-chart title="Follower" [data]="b" xKey="hour" valueKey="hits" /></sp-dashboard-cell>
      </sp-dashboard>`,
    })(
      class Page {
        changes = changes;
        a = ['10', '11', '12'].map((hour, i) => ({ hour, hits: i + 1 }));
        b = ['10', '11', '12'].map((hour, i) => ({ hour, hits: i + 5 }));
      },
    );
    document.body.innerHTML = '<app-root></app-root>';
    const app = await bootstrapApplication(Page, { providers: [provideZonelessChangeDetection()] });
    apps.push(app);
    await app.whenStable();
    const [source, other] = document.querySelectorAll<HTMLElement>('.sp-root');
    source!.dispatchEvent(new FocusEvent('focus'));
    await app.whenStable();
    expect(other!.querySelectorAll('svg[part="linked"] path')).toHaveLength(1);
    expect(other!.querySelector('svg[part="linked"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(source!.querySelector('svg[part="linked"]')).toBeNull();
    expect(changes).toEqual([{ key: 'hour', value: '10' }]);
    source!.dispatchEvent(new FocusEvent('blur'));
    await app.whenStable();
    expect(document.querySelectorAll('svg[part="linked"]')).toHaveLength(0);
    expect(changes).toEqual([{ key: 'hour', value: '10' }, null]);
  });
});
