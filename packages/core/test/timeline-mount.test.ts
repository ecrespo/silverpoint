// @vitest-environment happy-dom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { __setDiagnosticSink } from '../src';
import { TIMELINE_DEMO } from '../src/ui-demos';
import { TIMELINE_EVENTS, timelineMount, timelineOptions, timelineView, type TimelineJsModule } from '../src/timeline';
import { resolveUi } from '../src/ui';

afterEach(() => {
  document.body.innerHTML = '';
});

/** The surface as `timelineView` draws it: the host, its probes and the empty mount. */
function surface() {
  const host = document.createElement('section');
  host.setAttribute('data-mode', 'ink');
  host.innerHTML = '<span class="sp-kl-probe" aria-hidden="true"></span><div class="sp-kl-mount"></div>';
  document.body.append(host);
  return { host, mount: host.querySelector('.sp-kl-mount')! };
}

/** A TimelineJS stand-in: records its construction and lets a test fire its events. */
function fakeTimelineJs() {
  const built: { element: unknown; data: unknown; options: Record<string, unknown> }[] = [];
  const handlers = new Map<string, (payload: unknown) => void>();
  class Timeline {
    constructor(element: unknown, data: unknown, options: Record<string, unknown>) {
      built.push({ element, data, options });
      (element as HTMLElement).append(document.createElement('div'));
    }
    on(event: string, handler: (payload: unknown) => void) {
      handlers.set(event, handler);
      return this;
    }
  }
  const fire = (event: string, payload?: unknown) => handlers.get(event)?.(payload);
  return { module: { Timeline } as unknown as TimelineJsModule, built, handlers, fire };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('the timeline client half (T-221, REQ-512..REQ-515)', () => {
  test('REQ-514 · TimelineJS’s seven events, each with the name every framework forwards it under', () => {
    expect(TIMELINE_EVENTS).toEqual([
      ['change', 'change'],
      ['loaded', 'loaded'],
      ['nav_next', 'navNext'],
      ['nav_previous', 'navPrevious'],
      ['zoom_in', 'zoomIn'],
      ['zoom_out', 'zoomOut'],
      ['back_to_start', 'backToStart'],
    ]);
    expect(Object.isFrozen(TIMELINE_EVENTS)).toBe(true);
  });

  test('REQ-514 · the options lose `font` and `theme`, which the skin owns; the rest pass, the input untouched', () => {
    const given = Object.freeze({ font: 'amatic-andika', theme: 'dark', start_at_slide: 2, hash_bookmark: false });
    expect(timelineOptions(given)).toEqual({ start_at_slide: 2, hash_bookmark: false });
    expect(given).toHaveProperty('font');
    expect(timelineOptions()).toEqual({});
  });

  test('REQ-513 · REQ-514 · loads TimelineJS, builds it in the mount with the data and the options, and forwards its events', async () => {
    const { host, mount } = surface();
    const fake = fakeTimelineJs();
    const emit = vi.fn();
    const load = vi.fn(() => Promise.resolve(fake.module));
    timelineMount(host, { load, data: TIMELINE_DEMO, options: { theme: 'x', start_at_end: true }, emit, failed: vi.fn() });
    // The probes are read at once, before TimelineJS arrives.
    expect(host.getAttribute('data-kl-inked')).toBe('false');
    await settle();
    expect(load).toHaveBeenCalledTimes(1);
    expect(fake.built).toEqual([{ element: mount, data: TIMELINE_DEMO, options: { start_at_end: true } }]);
    expect([...fake.handlers.keys()]).toEqual(TIMELINE_EVENTS.map(([name]) => name));
    fake.fire('change', { unique_id: 'leonardo' });
    fake.fire('loaded', { scale: 'human' });
    fake.fire('nav_next', { unique_id: 'x' });
    fake.fire('back_to_start', { unique_id: 'title' });
    expect(emit.mock.calls).toEqual([['change', 'leonardo'], ['loaded', { scale: 'human' }], ['navNext'], ['backToStart']]);
  });

  test('REQ-515 · a load that fails warns SP025, calls `failed` and throws nothing', async () => {
    const warnings: string[] = [];
    const restore = __setDiagnosticSink((code) => warnings.push(code));
    try {
      const { host } = surface();
      const failed = vi.fn();
      timelineMount(host, { load: () => Promise.reject(new Error('chunk failed')), data: TIMELINE_DEMO, emit: vi.fn(), failed });
      await settle();
      expect(failed).toHaveBeenCalledTimes(1);
      expect(warnings).toEqual(['SP025']);
    } finally {
      restore();
    }
  });

  test('REQ-513 · the cleanup stops a load still in flight and empties the mount of a built timeline', async () => {
    const early = surface();
    const late = fakeTimelineJs();
    timelineMount(early.host, { load: () => Promise.resolve(late.module), data: TIMELINE_DEMO, emit: vi.fn(), failed: vi.fn() })();
    await settle();
    expect(late.built).toEqual([]);

    const built = surface();
    const fake = fakeTimelineJs();
    const stop = timelineMount(built.host, { load: () => Promise.resolve(fake.module), data: TIMELINE_DEMO, emit: vi.fn(), failed: vi.fn() });
    await settle();
    expect(built.mount.childElementCount).toBe(1);
    stop();
    expect(built.mount.childElementCount).toBe(0);
  });

  test('REQ-515 · after a failed load, the cleanup leaves the mount alone: the fallback there is the framework’s', async () => {
    const restore = __setDiagnosticSink(() => {});
    try {
      const { host, mount } = surface();
      const stop = timelineMount(host, { load: () => Promise.reject(new Error('chunk failed')), data: TIMELINE_DEMO, emit: vi.fn(), failed: () => mount.append(document.createElement('p')) });
      await settle();
      stop();
      expect(mount.childElementCount).toBe(1);
    } finally {
      restore();
    }
  });

  test('REQ-515 · once the load has failed, the mount holds the `fallback` slot; the server markup never does', () => {
    const props = { data: TIMELINE_DEMO };
    const mount = (failed?: boolean) => timelineView(props, resolveUi(props, {}), { failed }).children.at(-1) as { children: readonly unknown[] };
    expect(mount(false).children).toEqual([]);
    expect(mount().children).toEqual([]);
    expect(mount(true).children).toEqual([{ slot: 'fallback' }]);
  });
});
