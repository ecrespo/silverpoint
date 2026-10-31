/**
 * The framework-free deck controller (REQ-595, DD-057, API delta §7.1): the pure reducer of
 * `reduce.ts` behind a tiny emitter. Adapters subscribe to `state` and copy it into their own
 * reactivity; hosts listen to `pageChange`, `fragmentChange` and `ready`.
 */
import { diagnose } from '@silverpoint/core';
import { initialMachine, reduce, type Clamped, type DeckAction, type DeckEvents, type Machine, type MachineOptions, type Reduction } from './reduce';

export type { DeckAction, DeckEvents, DeckState } from './reduce';

export type DeckControllerOptions = MachineOptions;

export interface DeckController {
  readonly state: DeckEvents['state'];
  next(): void;
  prev(): void;
  first(): void;
  last(): void;
  goTo(page: number, step?: number | 'all'): void;
  toggleOverview(force?: boolean): void;
  toggleNotes(force?: boolean): void;
  toggleFullscreen(force?: boolean): void;
  /** After a re-render: clamps the page (SP028) and emits `ready` for a new total. */
  setTotal(total: number, steps: readonly number[]): void;
  /** Controlled mode: the parent's page. */
  setControlledPage(page: number): void;
  on<E extends keyof DeckEvents>(event: E, fn: (payload: DeckEvents[E]) => void): () => void;
  destroy(): void;
}

type Listener = (payload: never) => void;

function warnClamped(clamped: Clamped | undefined, total: number): void {
  if (!clamped) return;
  diagnose('SP028', 'SpDeck', {
    property: 'page',
    message: `page ${clamped.requested} is outside 1..${total}; showing page ${clamped.page}.`,
  });
}

export function createDeckController(options: DeckControllerOptions): DeckController {
  const initial = initialMachine(options);
  let machine: Machine = initial.machine;
  let alive = true;
  const listeners = new Map<keyof DeckEvents, Set<Listener>>();
  warnClamped(initial.clamped, machine.state.total);

  function emit<E extends keyof DeckEvents>(event: E, payload: DeckEvents[E]): void {
    for (const fn of [...(listeners.get(event) ?? [])]) {
      try {
        (fn as (p: DeckEvents[E]) => void)(payload);
      } catch (error) {
        // A host's listener must not break navigation or the other listeners.
        // `reportError` is the browser's; the pure entry names no DOM global (REQ-570).
        const report = (globalThis as { reportError?: (error: unknown) => void }).reportError;
        if (typeof report === 'function') report(error);
        else console.error(error);
      }
    }
  }

  function apply(action: DeckAction): void {
    if (!alive) return;
    const before = machine;
    const result: Reduction = reduce(machine, action);
    machine = result.machine;
    warnClamped(result.clamped, machine.state.total);
    if (machine.state !== before.state) emit('state', machine.state);
    // Payloads are fresh frozen plain objects (I-51): a host can keep or forward them as they are.
    for (const event of result.events) emit(event.type, Object.freeze({ ...event.payload }) as never);
  }

  // `ready` for the first render, once the creator has attached its listeners.
  queueMicrotask(() => {
    if (alive) emit('ready', Object.freeze({ total: machine.state.total }));
  });

  return {
    get state() {
      return machine.state;
    },
    next: () => apply({ type: 'next' }),
    prev: () => apply({ type: 'prev' }),
    first: () => apply({ type: 'first' }),
    last: () => apply({ type: 'last' }),
    goTo: (page, step) => apply(step === undefined ? { type: 'goTo', page } : { type: 'goTo', page, step }),
    toggleOverview: (force) => apply(force === undefined ? { type: 'toggle', what: 'overview' } : { type: 'toggle', what: 'overview', force }),
    toggleNotes: (force) => apply(force === undefined ? { type: 'toggle', what: 'notes' } : { type: 'toggle', what: 'notes', force }),
    toggleFullscreen: (force) => apply(force === undefined ? { type: 'toggle', what: 'fullscreen' } : { type: 'toggle', what: 'fullscreen', force }),
    setTotal: (total, steps) => apply({ type: 'setTotal', total, steps }),
    setControlledPage: (page) => apply({ type: 'setControlledPage', page }),
    on(event, fn) {
      if (!alive) return () => {};
      let set = listeners.get(event);
      if (!set) listeners.set(event, (set = new Set()));
      set.add(fn as Listener);
      return () => void set.delete(fn as Listener);
    },
    destroy() {
      alive = false;
      listeners.clear();
    },
  };
}
