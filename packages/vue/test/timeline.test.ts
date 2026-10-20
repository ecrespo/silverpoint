import { timelineView } from '@silverpoint/core/timeline';
import { resolveUi } from '@silverpoint/core/ui';
import { TIMELINE_DEMO } from '@silverpoint/core/ui-demos';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp, createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { timelineCanonicalMarkup, timelineFixtureProps, timelineMatrix } from '../../../tools/visual-gate/timeline-fixtures';
import { renderUi } from '../src/ui/render';

/*
 * Vue `SpTimeline` (T-221; REQ-510, REQ-512..REQ-515): the server markup is the core's surface and
 * never imports TimelineJS; the client imports it once mounted, builds it in the mount and emits its
 * events; a failed import renders the `fallback` slot and warns SP025.
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

function mount(render: () => ReturnType<typeof h>): HTMLElement {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp({ render });
  app.mount(host);
  cleanup.push(() => app.unmount());
  return host;
}

describe('SpTimeline (Vue)', () => {
  test('REQ-510 · REQ-513 · the server markup is the core’s surface, and rendering it imports nothing', async () => {
    mockTimelineJs();
    const { SpTimeline } = await import('../src/timeline');
    const props = { data: TIMELINE_DEMO, height: '480px' };
    const markup = await renderToString(createSSRApp({ render: () => h(SpTimeline, props, { fallback: () => h('p', 'offline') }) }));
    const core = await renderToString(createSSRApp({ render: () => renderUi(timelineView(props, resolveUi({}, {})), {}) }));
    expect(compareUi(markup, core)).toEqual({ equal: true });
    expect(markup).not.toContain('offline');
    expect(imported).toBe(0);
  });

  test('REQ-516 · the 10 surface fixtures: the server markup is the canonical', async () => {
    mockTimelineJs();
    const { SpTimeline } = await import('../src/timeline');
    for (const fixture of timelineMatrix()) {
      const markup = await renderToString(createSSRApp({ render: () => h(SpTimeline, timelineFixtureProps(fixture)) }));
      expect(compareUi(markup, timelineCanonicalMarkup(fixture)), fixture.id).toEqual({ equal: true });
    }
  });

  test('REQ-513 · REQ-514 · the client builds TimelineJS in the mount, without `font` or `theme`, and emits its events', async () => {
    mockTimelineJs();
    const { SpTimeline } = await import('../src/timeline');
    const onChange = vi.fn();
    const onNavNext = vi.fn();
    const onLoaded = vi.fn();
    const host = mount(() => h(SpTimeline, { data: TIMELINE_DEMO, options: { font: 'x', theme: 'y', start_at_slide: 1 }, onChange, onNavNext, onLoaded }));
    await settle();
    expect(imported).toBe(1);
    expect(built).toEqual([{ element: host.querySelector('.sp-kl-mount')?.firstElementChild, options: { start_at_slide: 1 } }]);
    handlers.get('change')?.({ unique_id: 'leonardo' });
    handlers.get('nav_next')?.({ unique_id: 'x' });
    handlers.get('loaded')?.({ scale: 'human' });
    expect(onChange).toHaveBeenCalledWith('leonardo');
    expect(onNavNext).toHaveBeenCalledWith();
    expect(onLoaded).toHaveBeenCalledWith({ scale: 'human' });
    expect(warnings).toEqual([]);
  });

  test('REQ-515 · a failed import keeps the surface, renders the fallback slot, warns SP025 and throws nothing', async () => {
    mockTimelineJs(true);
    const { SpTimeline } = await import('../src/timeline');
    const host = mount(() => h(SpTimeline, { data: TIMELINE_DEMO }, { fallback: () => h('p', 'offline') }));
    await settle();
    await settle();
    expect(host.querySelector('section.sp-timeline .sp-kl-mount')?.innerHTML).toBe('<p>offline</p>');
    expect(warnings).toEqual(['SP025']);
  });
});
