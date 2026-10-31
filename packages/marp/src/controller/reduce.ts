/**
 * The deck controller's state machine (DD-057, API delta §7.2, Data Model §2.35): a pure
 * `reduce(machine, action) → { machine, events, clamped }`. It touches no DOM and raises no
 * diagnostic: `clamped` reports an out-of-range page, and the controller turns it into SP028.
 */

export interface DeckState {
  /** 1..total. */
  readonly page: number;
  /** 0..steps[page-1]: how many fragments of the current slide are revealed. */
  readonly step: number;
  readonly total: number;
  /** Fragments per slide, length `total`. */
  readonly steps: readonly number[];
  readonly overview: boolean;
  readonly notes: boolean;
  readonly fullscreen: boolean;
  readonly controlled: boolean;
}

export interface DeckEvents {
  /** The current page changed, by the reader or by a re-render that clamped it. */
  pageChange: { readonly page: number; readonly total: number };
  /** A fragment of the current slide was revealed or hidden: `step` of `steps`. */
  fragmentChange: { readonly page: number; readonly step: number; readonly steps: number };
  /** The deck rendered with a new slide count. */
  ready: { readonly total: number };
  /** Internal: the adapters' subscription. */
  state: DeckState;
}

export type DeckAction =
  | { readonly type: 'next' }
  | { readonly type: 'prev' }
  | { readonly type: 'first' }
  | { readonly type: 'last' }
  | { readonly type: 'goTo'; readonly page: number; readonly step?: number | 'all' }
  | { readonly type: 'setTotal'; readonly total: number; readonly steps: readonly number[] }
  | { readonly type: 'setControlledPage'; readonly page: number }
  | { readonly type: 'toggle'; readonly what: 'overview' | 'notes' | 'fullscreen'; readonly force?: boolean };

/** A public event the reducer asks the controller to emit, in order. */
export type DeckEvent = { [E in Exclude<keyof DeckEvents, 'state'>]: { readonly type: E; readonly payload: DeckEvents[E] } }[Exclude<keyof DeckEvents, 'state'>];

/** The state plus, in controlled mode, the position a page move asked for and the parent has not confirmed. */
export interface Machine {
  readonly state: DeckState;
  readonly pending: { readonly page: number; readonly step: number } | null;
}

/** A page outside `1..total` that was clamped (REQ-599). */
export interface Clamped {
  readonly requested: number;
  readonly page: number;
}

export interface Reduction {
  readonly machine: Machine;
  readonly events: readonly DeckEvent[];
  readonly clamped?: Clamped;
}

export interface MachineOptions {
  readonly total: number;
  readonly steps: readonly number[];
  /** Controlled mode: the parent owns the page. */
  readonly page?: number;
  /** Uncontrolled mode: the first page, default 1. */
  readonly defaultPage?: number;
}

const count = (n: number | undefined) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

function normaliseSteps(total: number, steps: readonly number[]): number[] {
  return Array.from({ length: total }, (_, i) => count(steps[i]));
}

/** The page clamped to `1..total`; `NaN` and non-numbers are page 1. */
function clampPage(page: number, total: number): number {
  if (typeof page !== 'number' || Number.isNaN(page)) return 1;
  return Math.min(total, Math.max(1, Math.round(page)));
}

function clampReport(requested: number, page: number): Clamped | undefined {
  return requested === page ? undefined : { requested, page };
}

export function initialMachine(options: MachineOptions): { machine: Machine; clamped?: Clamped } {
  const total = Math.max(1, count(options.total));
  const controlled = options.page !== undefined;
  const requested = (controlled ? options.page : options.defaultPage) ?? 1;
  const page = clampPage(requested, total);
  const state: DeckState = {
    page,
    step: 0,
    total,
    steps: normaliseSteps(total, options.steps),
    overview: false,
    notes: false,
    fullscreen: false,
    controlled,
  };
  const clamped = clampReport(requested, page);
  return clamped ? { machine: { state, pending: null }, clamped } : { machine: { state, pending: null } };
}

const stepsOf = (state: DeckState, page: number) => state.steps[page - 1] ?? 0;

const pageChange = (page: number, total: number): DeckEvent => ({ type: 'pageChange', payload: { page, total } });
const fragmentChange = (state: DeckState): DeckEvent => ({
  type: 'fragmentChange',
  payload: { page: state.page, step: state.step, steps: stepsOf(state, state.page) },
});

/** Where a navigation action leads, before controlled mode decides whether to wait for the parent. */
function target(state: DeckState, action: DeckAction): { page: number; step: number } | null {
  const { page, step, total } = state;
  switch (action.type) {
    case 'next':
      if (step < stepsOf(state, page)) return { page, step: step + 1 };
      return page < total ? { page: page + 1, step: 0 } : null;
    case 'prev':
      if (step > 0) return { page, step: step - 1 };
      return page > 1 ? { page: page - 1, step: stepsOf(state, page - 1) } : null;
    case 'first':
      return { page: 1, step: 0 };
    case 'last':
      return { page: total, step: 0 };
    case 'goTo': {
      const q = clampPage(action.page, total);
      const max = stepsOf(state, q);
      const s = action.step === 'all' ? max : Math.min(max, count(action.step));
      return { page: q, step: s };
    }
    default:
      return null;
  }
}

function move(machine: Machine, to: { page: number; step: number }): Reduction {
  const { state } = machine;
  if (to.page === state.page && to.step === state.step) return { machine, events: [] };
  if (to.page === state.page) {
    const next = { ...state, step: to.step };
    return { machine: { state: next, pending: null }, events: [fragmentChange(next)] };
  }
  if (state.controlled) {
    return { machine: { state, pending: to }, events: [pageChange(to.page, state.total)] };
  }
  const next = { ...state, page: to.page, step: to.step };
  return { machine: { state: next, pending: null }, events: [pageChange(next.page, next.total), fragmentChange(next)] };
}

export function reduce(machine: Machine, action: DeckAction): Reduction {
  const { state } = machine;
  switch (action.type) {
    case 'toggle': {
      const value = action.force ?? !state[action.what];
      if (value === state[action.what]) return { machine, events: [] };
      return { machine: { ...machine, state: { ...state, [action.what]: value } }, events: [] };
    }

    case 'setControlledPage': {
      if (!state.controlled) return { machine, events: [] };
      const page = clampPage(action.page, state.total);
      const clamped = clampReport(action.page, page);
      const pending = machine.pending?.page === page ? machine.pending : null;
      const step = pending ? pending.step : page === state.page ? state.step : 0;
      if (page === state.page && step === state.step) {
        const same = machine.pending ? { state, pending: null } : machine;
        return clamped ? { machine: same, events: [], clamped } : { machine: same, events: [] };
      }
      // The parent already knows the page: no pageChange echo, only the fragment position.
      const next = { ...state, page, step };
      const out = { machine: { state: next, pending: null }, events: [fragmentChange(next)] };
      return clamped ? { ...out, clamped } : out;
    }

    case 'setTotal': {
      const total = Math.max(1, count(action.total));
      const steps = normaliseSteps(total, action.steps);
      const page = clampPage(state.page, total);
      const step = Math.min(state.step, steps[page - 1] ?? 0);
      const next: DeckState = { ...state, total, steps, page, step };
      const events: DeckEvent[] = [];
      if (total !== state.total) events.push({ type: 'ready', payload: { total } });
      if (page !== state.page) events.push(pageChange(page, total));
      if (page !== state.page || step !== state.step) events.push(fragmentChange(next));
      const unchanged = total === state.total && page === state.page && step === state.step && steps.every((s, i) => s === state.steps[i]);
      const pending = machine.pending && machine.pending.page <= total ? { page: machine.pending.page, step: Math.min(machine.pending.step, steps[machine.pending.page - 1] ?? 0) } : null;
      const out: Reduction = { machine: unchanged && pending === machine.pending ? machine : { state: unchanged ? state : next, pending }, events };
      const clamped = clampReport(state.page, page);
      return clamped ? { ...out, clamped } : out;
    }

    default: {
      const to = target(state, action);
      return to ? move(machine, to) : { machine, events: [] };
    }
  }
}
