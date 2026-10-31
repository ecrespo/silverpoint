import { __setDiagnosticSink } from '@silverpoint/core';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createDeckController, type DeckController, type DeckEvents } from '../src/controller';

/* The controller: the reducer wrapped in an emitter (T-268, REQ-595, REQ-606, I-51). */

let sunk: string[] = [];
let restore: () => void;
beforeEach(() => {
  sunk = [];
  restore = __setDiagnosticSink((code, message) => sunk.push(`${code} ${message}`));
});
afterEach(() => restore());

type Log = [keyof DeckEvents, unknown][];
function record(controller: DeckController, events: (keyof DeckEvents)[] = ['pageChange', 'fragmentChange', 'ready']): Log {
  const log: Log = [];
  for (const e of events) controller.on(e, (p) => log.push([e, p]));
  return log;
}
const tick = () => new Promise<void>((r) => queueMicrotask(r));

describe('createDeckController (T-268)', () => {
  test('REQ-606 · ready { total } once after creation, for listeners attached in the same task', async () => {
    const c = createDeckController({ total: 3, steps: [0, 1, 0] });
    const log = record(c);
    expect(log).toEqual([]);
    await tick();
    expect(log).toEqual([['ready', { total: 3 }]]);
    await tick();
    expect(log).toHaveLength(1);
  });

  test('REQ-606 · the operations emit pageChange and fragmentChange in order; state follows', () => {
    const c = createDeckController({ total: 3, steps: [0, 1, 0] });
    const log = record(c, ['pageChange', 'fragmentChange']);
    c.next();
    c.next();
    c.prev();
    c.last();
    c.first();
    c.goTo(2, 'all');
    expect(log).toEqual([
      ['pageChange', { page: 2, total: 3 }], ['fragmentChange', { page: 2, step: 0, steps: 1 }],
      ['fragmentChange', { page: 2, step: 1, steps: 1 }],
      ['fragmentChange', { page: 2, step: 0, steps: 1 }],
      ['pageChange', { page: 3, total: 3 }], ['fragmentChange', { page: 3, step: 0, steps: 0 }],
      ['pageChange', { page: 1, total: 3 }], ['fragmentChange', { page: 1, step: 0, steps: 0 }],
      ['pageChange', { page: 2, total: 3 }], ['fragmentChange', { page: 2, step: 1, steps: 1 }],
    ]);
    expect(c.state).toMatchObject({ page: 2, step: 1 });
  });

  test('REQ-595 · the internal state event fires on every change, toggles included, and not otherwise', () => {
    const c = createDeckController({ total: 2, steps: [0, 0] });
    const states: unknown[] = [];
    c.on('state', (s) => states.push(s));
    c.prev();
    c.toggleOverview();
    c.toggleOverview(true);
    c.toggleNotes();
    c.toggleFullscreen(true);
    c.next();
    expect(states).toHaveLength(4);
    expect(states.at(-1)).toBe(c.state);
    expect(c.state).toMatchObject({ page: 2, overview: true, notes: true, fullscreen: true });
  });

  test('REQ-606 · setTotal emits ready only for a new total', async () => {
    const c = createDeckController({ total: 3, steps: [0, 0, 0] });
    await tick();
    const log = record(c, ['ready']);
    c.setTotal(3, [0, 1, 0]);
    c.setTotal(5, [0, 0, 0, 0, 0]);
    expect(log).toEqual([['ready', { total: 5 }]]);
  });

  test('REQ-599 · SP028 when defaultPage is out of range, when setTotal shrinks under the page, when the parent’s page is out', () => {
    createDeckController({ total: 3, steps: [], defaultPage: 7 });
    expect(sunk.filter((s) => s.startsWith('SP028'))).toHaveLength(1);
    expect(sunk[0]).toMatch(/7.*3|page 7/);
    const c = createDeckController({ total: 4, steps: [], defaultPage: 4 });
    c.setTotal(2, [0, 0]);
    const d = createDeckController({ total: 4, steps: [], page: 1 });
    d.setControlledPage(0);
    expect(sunk.filter((s) => s.startsWith('SP028'))).toHaveLength(3);
  });

  test('REQ-598 · controlled: pageChange asks, setControlledPage lands', () => {
    const c = createDeckController({ total: 3, steps: [0, 2, 0], page: 3 });
    const log = record(c, ['pageChange', 'fragmentChange']);
    c.prev();
    expect(c.state.page).toBe(3);
    c.setControlledPage(2);
    expect(c.state).toMatchObject({ page: 2, step: 2 });
    expect(log).toEqual([['pageChange', { page: 2, total: 3 }], ['fragmentChange', { page: 2, step: 2, steps: 2 }]]);
  });

  test('on returns an unsubscribe; a listener that throws does not stop the others', () => {
    const c = createDeckController({ total: 3, steps: [] });
    const seen: number[] = [];
    const off = c.on('pageChange', () => seen.push(1));
    c.on('pageChange', () => {
      throw new Error('listener');
    });
    c.on('pageChange', () => seen.push(3));
    expect(() => c.next()).not.toThrow();
    off();
    c.next();
    expect(seen).toEqual([1, 3, 3]);
  });

  test('destroy drops every listener and the pending ready; the controller then ignores operations', async () => {
    const c = createDeckController({ total: 3, steps: [] });
    const log = record(c);
    c.destroy();
    c.next();
    await tick();
    expect(log).toEqual([]);
    expect(c.state.page).toBe(1);
  });

  test('I-51 · every payload is plain JSON, and not the controller’s own objects', async () => {
    const c = createDeckController({ total: 4, steps: [1, 0, 2, 0] });
    const payloads: unknown[] = [];
    for (const e of ['pageChange', 'fragmentChange', 'ready'] as const) c.on(e, (p) => payloads.push(p));
    await tick();
    for (const op of [() => c.next(), () => c.next(), () => c.goTo(3, 'all'), () => c.prev(), () => c.setTotal(2, [0, 3])]) op();
    expect(payloads.length).toBeGreaterThan(6);
    for (const p of payloads) {
      expect(JSON.parse(JSON.stringify(p))).toEqual(p);
      expect(Object.getPrototypeOf(p)).toBe(Object.prototype);
      expect(Object.isFrozen(p)).toBe(true);
    }
  });
});
