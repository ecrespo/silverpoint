// @vitest-environment happy-dom
import { Component, provideZonelessChangeDetection, type ApplicationRef, type Type } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SpDashboard } from '@silverpoint/angular/dashboard';
import { SpLineChart } from '@silverpoint/angular/line-chart';
import { SpAlert, SpCard, SpCollapse, SpCollapseItem, SpDescriptions, SpDrawer, SpModal, SpPopover, SpResult, SpStatistic, SpToast } from '@silverpoint/angular/ui';
import { afterEach, describe, expect, test } from 'vitest';

let apps: ApplicationRef[] = [];
afterEach(() => {
  for (const app of apps) app.destroy();
  apps = [];
  document.body.innerHTML = '';
});

async function mount(imports: readonly Type<unknown>[], template: string): Promise<void> {
  document.body.innerHTML = '<app-root></app-root>';
  const Host = Component({ selector: 'app-root', imports: [...imports], template })(
    class Host {
      items = [{ key: 'a', label: 'Ground', value: 'silverpoint' }];
    },
  );
  const app = await bootstrapApplication(Host, { providers: [provideZonelessChangeDetection()] });
  apps.push(app);
  await app.whenStable();
}

/** The library's own hosts: every `sp-*` element under the app root. */
const hosts = () => [...document.querySelectorAll('app-root *')].filter((element) => element.tagName.toLowerCase().startsWith('sp-'));

/*
 * #18: Angular leaves a literal `title="…"` on the host element as well as binding the input, and
 * the browser then shows its native tooltip over the whole chart or component. The host drops the
 * attribute; the input keeps the value.
 */
describe('a literal title="…" (#18)', () => {
  test('API §8.2 · #18 · a chart takes the title as its input and leaves no title attribute on its host', async () => {
    await mount([SpLineChart], `<sp-line-chart id="sp-titled" [width]="320" [height]="160" title="Hits per hour" />`);
    expect(document.querySelector('sp-line-chart')?.hasAttribute('title')).toBe(false);
    expect(document.querySelector('.sp-root')?.textContent).toContain('Hits per hour');
  });

  test('API §8.2 · #18 · a title bound as an expression is unchanged', async () => {
    await mount([SpLineChart], `<sp-line-chart id="sp-titled" [width]="320" [height]="160" [title]="'Hits per hour'" />`);
    expect(document.querySelector('sp-line-chart')?.hasAttribute('title')).toBe(false);
    expect(document.querySelector('.sp-root')?.textContent).toContain('Hits per hour');
  });

  test.each([
    ['sp-card', [SpCard], `<sp-card title="Orders">Body</sp-card>`],
    ['sp-alert', [SpAlert], `<sp-alert title="Orders">Body</sp-alert>`],
    ['sp-statistic', [SpStatistic], `<sp-statistic title="Orders" [value]="12" />`],
    ['sp-descriptions', [SpDescriptions], `<sp-descriptions title="Orders" [items]="items" />`],
    ['sp-result', [SpResult], `<sp-result title="Orders" />`],
    ['sp-collapse-item', [SpCollapse, SpCollapseItem], `<sp-collapse><sp-collapse-item value="a" title="Orders">Body</sp-collapse-item></sp-collapse>`],
    ['sp-modal', [SpModal], `<sp-modal title="Orders" [open]="true">Body</sp-modal>`],
    ['sp-drawer', [SpDrawer], `<sp-drawer title="Orders" [open]="true">Body</sp-drawer>`],
    ['sp-popover', [SpPopover], `<sp-popover title="Orders" [open]="true">Body</sp-popover>`],
    ['sp-toast', [SpToast], `<sp-toast title="Orders" [open]="true" />`],
    ['sp-dashboard', [SpDashboard], `<sp-dashboard id="ops" title="Orders" />`],
  ] as const)('API §8.2 · #18 · %s takes the title as its input and leaves no title attribute on its host', async (selector, imports, template) => {
    await mount(imports, template);
    expect(document.querySelector(selector)).not.toBeNull();
    expect(hosts().filter((element) => element.hasAttribute('title')).map((element) => element.tagName.toLowerCase())).toEqual([]);
    expect(document.querySelector('app-root')?.textContent).toContain('Orders');
  });
});
