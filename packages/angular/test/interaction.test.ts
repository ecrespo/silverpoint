// @vitest-environment happy-dom
import { Component, provideZonelessChangeDetection, type ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SpTooltip } from '@silverpoint/angular';
import { SpLineChart } from '@silverpoint/angular/line-chart';
import type { ActiveItem } from '@silverpoint/core';
import { afterEach, describe, expect, test } from 'vitest';

let apps: ApplicationRef[] = [];
afterEach(() => {
  for (const app of apps) app.destroy();
  apps = [];
  document.body.innerHTML = '';
});

interface Recorder {
  changes: (ActiveItem | null)[];
  selected: ActiveItem[];
}

async function mount(content = ''): Promise<{ app: ApplicationRef; chartRoot: HTMLElement; recorder: Recorder }> {
  const recorder: Recorder = { changes: [], selected: [] };
  const Host = Component({
    selector: 'app-root',
    imports: [SpLineChart, SpTooltip],
    template: `<sp-line-chart id="sp-interactive" [width]="320" [height]="160" chrome="bare"
      (activeChange)="recorder.changes.push($event)" (select)="recorder.selected.push($event)">${content}</sp-line-chart>`,
  })(
    class Host {
      recorder = recorder;
    },
  );
  document.body.innerHTML = '<app-root></app-root>';
  const app = await bootstrapApplication(Host, { providers: [provideZonelessChangeDetection()] });
  apps.push(app);
  await app.whenStable();
  const chartRoot = document.querySelector<HTMLElement>('.sp-root') as HTMLElement;
  const svg = document.querySelector('svg.sp-chart') as SVGSVGElement;
  const [, , width, height] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width, height, x: 0, y: 0, right: width, bottom: height, toJSON() {} }) as DOMRect;
  return { app, chartRoot, recorder };
}

async function fire(app: ApplicationRef, target: HTMLElement, event: Event) {
  target.dispatchEvent(event);
  await app.whenStable();
}

const move = (x: number, y: number) => new PointerEvent('pointermove', { clientX: x, clientY: y, pointerType: 'mouse', bubbles: true });
const keydown = (key: string) => new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });

function livePoint(): { x: number; y: number } {
  const d = document.querySelector('[part="sp-heighten"]')?.getAttribute('d') ?? '';
  const [mx, my] = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  return { x: (mx ?? 0) + 3.5, y: my ?? 0 };
}

describe('sp-line-chart readout', () => {
  test('REQ-141 · hovering a point shows the readout and emits the active item', async () => {
    const { app, chartRoot, recorder } = await mount();
    const { x, y } = livePoint();
    await fire(app, chartRoot, move(x, y));
    expect(recorder.changes.at(-1)).toMatchObject({ seriesKey: 'hits', index: 11, value: 41 });
    expect(document.querySelector('.sp-readout')?.textContent?.trim()).toBe('22hits: 41');
    expect(document.querySelector('svg.sp-marker path')).not.toBeNull();
  });

  test('REQ-141 · keyboard focus and arrows surface the same readout as hover', async () => {
    const { app, chartRoot } = await mount();
    expect(chartRoot.tabIndex).toBe(0);
    await fire(app, chartRoot, new FocusEvent('focus'));
    await fire(app, chartRoot, keydown('End'));
    const viaKeyboard = document.querySelector('.sp-readout')?.textContent;
    await fire(app, chartRoot, new FocusEvent('blur'));
    const { x, y } = livePoint();
    await fire(app, chartRoot, move(x, y));
    expect(document.querySelector('.sp-readout')?.textContent).toBe(viaKeyboard);
  });

  test('REQ-122 · the active point is announced through a polite live region', async () => {
    const { app, chartRoot } = await mount();
    await fire(app, chartRoot, new FocusEvent('focus'));
    expect(document.querySelector('.sp-live')?.getAttribute('aria-live')).toBe('polite');
    expect(document.querySelector('.sp-live')?.textContent?.trim()).toBe('hour 00, hits 18');
  });

  test('REQ-143 · leaving the drawing area emits null and leaves no residual state', async () => {
    const { app, chartRoot, recorder } = await mount();
    const { x, y } = livePoint();
    await fire(app, chartRoot, move(x, y));
    await fire(app, chartRoot, new PointerEvent('pointerleave'));
    expect(recorder.changes.at(-1)).toBeNull();
    expect(document.querySelector('.sp-readout')).toBeNull();
    expect(document.querySelector('svg.sp-marker')).toBeNull();
    expect(document.querySelector('.sp-live')?.textContent?.trim()).toBe('');
  });

  test('REQ-143 · losing focus emits null', async () => {
    const { app, chartRoot, recorder } = await mount();
    await fire(app, chartRoot, new FocusEvent('focus'));
    await fire(app, chartRoot, new FocusEvent('blur'));
    expect(recorder.changes.at(-1)).toBeNull();
  });

  test('API §9 · Enter selects the active item', async () => {
    const { app, chartRoot, recorder } = await mount();
    await fire(app, chartRoot, new FocusEvent('focus'));
    await fire(app, chartRoot, keydown('Enter'));
    expect(recorder.selected[0]).toMatchObject({ index: 0 });
  });

  test('REQ-142 · an spTooltip template replaces the built-in readout', async () => {
    const { app, chartRoot } = await mount('<ng-template spTooltip let-active><strong class="mine">#{{ active.index }}</strong></ng-template>');
    await fire(app, chartRoot, new FocusEvent('focus'));
    expect(document.querySelector('.mine')?.textContent).toBe('#0');
    expect(document.querySelector('.sp-readout-heading')).toBeNull();
  });
});
