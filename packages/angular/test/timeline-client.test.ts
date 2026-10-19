// @vitest-environment happy-dom
import { ApplicationRef, Component, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { TIMELINE_DEMO } from '@silverpoint/core/ui-demos';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/*
 * Angular `<sp-timeline>` in the browser (T-221; REQ-513..REQ-515): TimelineJS imported after render,
 * built in the mount without `font` or `theme`, its events as outputs; a failed import renders the
 * `spFallback` template and warns SP025.
 */

const TIMELINEJS = '@knight-lab/timelinejs/src/js/timeline/Timeline.js';

let built: { element: unknown; options: unknown }[];
let handlers: Map<string, (payload?: unknown) => void>;
let imported: number;
let warnings: string[];
let cleanup: (() => void)[];

function mockTimelineJs(fail = false) {
  vi.doMock(TIMELINEJS, () => {
    imported += 1;
    if (fail) throw new Error('not installed');
    return {
      Timeline: class {
        constructor(element: HTMLElement, _data: unknown, options: unknown) {
          built.push({ element, options });
          element.append(document.createElement('div'));
        }
        on(event: string, handler: (payload?: unknown) => void) {
          handlers.set(event, handler);
        }
      },
    };
  });
}

beforeEach(async () => {
  built = [];
  handlers = new Map();
  imported = 0;
  warnings = [];
  vi.resetModules();
  // A fresh registry: the sink goes on the diagnostics module the fresh component imports.
  const { __setDiagnosticSink } = await import('@silverpoint/core');
  cleanup = [__setDiagnosticSink((code) => warnings.push(code))];
});
afterEach(() => {
  for (const undo of cleanup.reverse()) undo();
  vi.doUnmock(TIMELINEJS);
  document.body.innerHTML = '';
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

async function mount(template: string, members: object = {}): Promise<ApplicationRef> {
  const { SpTimeline, SpTimelineFallback } = await import('@silverpoint/angular/timeline');
  document.body.innerHTML = '<app-root></app-root>';
  const root = Component({ selector: 'app-root', imports: [SpTimeline, SpTimelineFallback], template })(
    class {
      readonly data = TIMELINE_DEMO;
      constructor() {
        Object.assign(this, members);
      }
    },
  );
  const app = await bootstrapApplication(root, { providers: [provideZonelessChangeDetection()] });
  cleanup.push(() => app.destroy());
  await app.whenStable();
  await settle();
  await app.whenStable();
  return app;
}

describe('<sp-timeline> in the browser (Angular)', () => {
  test('REQ-513 · REQ-514 · TimelineJS is built in the mount, without `font` or `theme`, and its events are outputs', async () => {
    mockTimelineJs();
    const onChange = vi.fn();
    const onNavNext = vi.fn();
    const onLoaded = vi.fn();
    await mount(
      `<sp-timeline [data]="data" [options]="{ font: 'x', theme: 'y', start_at_slide: 1 }" (change)="onChange($event)" (navNext)="onNavNext()" (loaded)="onLoaded($event)" />`,
      { onChange, onNavNext, onLoaded },
    );
    expect(imported).toBe(1);
    expect(built).toEqual([{ element: document.querySelector('.sp-kl-mount'), options: { start_at_slide: 1 } }]);
    handlers.get('change')?.({ unique_id: 'leonardo' });
    handlers.get('nav_next')?.({ unique_id: 'x' });
    handlers.get('loaded')?.({ scale: 'human' });
    expect(onChange).toHaveBeenCalledWith('leonardo');
    expect(onNavNext).toHaveBeenCalledTimes(1);
    expect(onLoaded).toHaveBeenCalledWith({ scale: 'human' });
    expect(warnings).toEqual([]);
  });

  test('REQ-515 · a failed import keeps the surface, renders the fallback template, warns SP025 and throws nothing', async () => {
    mockTimelineJs(true);
    await mount('<sp-timeline [data]="data"><ng-template spFallback><p>offline</p></ng-template></sp-timeline>');
    expect(document.querySelector('section.sp-timeline .sp-kl-mount')?.innerHTML.replace(/<!--[^]*?-->/g, '')).toBe('<p>offline</p>');
    expect(warnings).toEqual(['SP025']);
  });
});
