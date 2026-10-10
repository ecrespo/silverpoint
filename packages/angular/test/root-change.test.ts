// @vitest-environment happy-dom
/**
 * T-187 · `(rootChange)` of the two drillable charts (REQ-439, REQ-108): activating a node emits its
 * id, the drawn root emits its parent, and the component keeps no root of its own (I-30).
 */
import { Component, provideZonelessChangeDetection, signal, type ApplicationRef, type Type } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SpSquarifiedTreemap } from '@silverpoint/angular/squarified-treemap';
import { SpSunburstChart } from '@silverpoint/angular/sunburst-chart';
import { afterEach, describe, expect, test } from 'vitest';

let apps: ApplicationRef[] = [];
afterEach(() => {
  for (const app of apps) app.destroy();
  apps = [];
  document.body.innerHTML = '';
});

async function mount(chart: Type<unknown>, selector: string, rootId: string | null | undefined) {
  const recorder = { emitted: [] as (string | null)[], selected: [] as unknown[] };
  const root = signal(rootId);
  const Host = Component({
    selector: 'app-root',
    imports: [chart],
    template: `<${selector} id="sp-drill" [width]="420" [height]="240" chrome="bare" [rootId]="root()"
      (rootChange)="recorder.emitted.push($event)" (select)="recorder.selected.push($event)" />`,
  })(
    class Host {
      recorder = recorder;
      root = root;
    },
  );
  document.body.innerHTML = '<app-root></app-root>';
  const app = await bootstrapApplication(Host, { providers: [provideZonelessChangeDetection()] });
  apps.push(app);
  await app.whenStable();
  return { app, chartRoot: document.querySelector<HTMLElement>('.sp-root') as HTMLElement, recorder, root };
}

async function keys(app: ApplicationRef, chartRoot: HTMLElement, ...names: string[]) {
  chartRoot.dispatchEvent(new FocusEvent('focus'));
  for (const key of names) {
    chartRoot.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    await app.whenStable();
  }
}

const paths = () => [...document.querySelectorAll('svg.sp-chart path')].map((p) => p.getAttribute('d'));

describe.each([
  ['sp-squarified-treemap', SpSquarifiedTreemap],
  ['sp-sunburst-chart', SpSunburstChart],
] as const)('%s · (rootChange) (T-187)', (selector, chart) => {
  test('REQ-439 · Enter on a node emits its id, alongside select', async () => {
    const { app, chartRoot, recorder } = await mount(chart, selector, undefined);
    await keys(app, chartRoot, 'Home', 'ArrowDown', 'Enter');
    expect(recorder.selected).toHaveLength(1);
    expect(recorder.emitted).toEqual([(recorder.selected[0] as { datum: { id: string } }).datum.id]);
  });

  test('REQ-439 · REQ-108 · the drawn root emits its parent; the chart redraws only when rootId changes', async () => {
    const { app, chartRoot, recorder, root } = await mount(chart, selector, 'works-01');
    const before = paths();
    await keys(app, chartRoot, 'Home', 'Enter');
    expect(recorder.emitted).toEqual(['works']);
    expect(paths()).toEqual(before);
    root.set('works');
    await app.whenStable();
    expect(paths()).not.toEqual(before);
    await keys(app, chartRoot, 'Home', 'Enter');
    expect(recorder.emitted).toEqual(['works', null]);
  });
});
