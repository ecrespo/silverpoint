/** The state an open or closed list overlay keeps: its active (highlighted) item and which are disabled. */
export interface UiListState {
  /** The active item; `-1` when none is. */
  readonly active: number;
  readonly count: number;
  readonly disabled: readonly boolean[];
  readonly open: boolean;
}

/** The next active item, and what the adapter does: open the list, close it, or select the active item and close. */
export interface UiListResult {
  readonly active: number;
  readonly intent?: 'open' | 'close' | 'select';
}

/** The first enabled index from `from` in steps of `step`, `-1` if none (no wrap). */
function seek(state: UiListState, from: number, step: 1 | -1): number {
  for (let i = from; i >= 0 && i < state.count; i += step) if (state.disabled[i] !== true) return i;
  return -1;
}

const first = (s: UiListState) => seek(s, 0, 1);
const last = (s: UiListState) => seek(s, s.count - 1, -1);
const enabled = (s: UiListState, i: number) => i >= 0 && i < s.count && s.disabled[i] !== true;

/** One arrow step: the next enabled item, wrapping in a menu and stopping at the ends in a listbox. */
function arrow(state: UiListState, step: 1 | -1, wrap: boolean): number {
  const { active, count } = state;
  if (active < 0 || active >= count) return step > 0 ? first(state) : last(state);
  const next = seek(state, active + step, step);
  if (next >= 0) return next;
  return wrap ? (step > 0 ? first(state) : last(state)) : active;
}

/** Ten items on, held to the enabled ends (APG listbox, PageUp / PageDown). */
function page(state: UiListState, step: 1 | -1): number {
  const target = Math.min(Math.max((state.active < 0 ? 0 : state.active) + 10 * step, 0), state.count - 1);
  const found = seek(state, target, step);
  return found >= 0 ? found : seek(state, target, step > 0 ? -1 : 1);
}

/**
 * The WAI-ARIA APG transitions of a select-only combobox (`listbox`, REQ-494) and a menu button
 * (`menu`, REQ-495), as a pure function of state and key (DD-039). Disabled items are skipped and
 * never selected (REQ-326); a move with no enabled item to go to keeps the active one.
 */
export function uiListKey(state: UiListState, key: string, kind: 'listbox' | 'menu'): UiListResult {
  const { active } = state;
  const keep = (i: number) => (i < 0 ? active : i);
  if (!state.open) {
    if (key === 'Home') return { active: keep(first(state)), intent: 'open' };
    if (key === 'End') return { active: keep(last(state)), intent: 'open' };
    if (kind === 'menu' && key === 'ArrowUp') return { active: keep(last(state)), intent: 'open' };
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
      const start = kind === 'listbox' && enabled(state, active) ? active : first(state);
      return { active: keep(start), intent: 'open' };
    }
    return { active };
  }
  switch (key) {
    case 'ArrowDown':
      return { active: keep(arrow(state, 1, kind === 'menu')) };
    case 'ArrowUp':
      return { active: keep(arrow(state, -1, kind === 'menu')) };
    case 'Home':
      return { active: keep(first(state)) };
    case 'End':
      return { active: keep(last(state)) };
    case 'PageDown':
    case 'PageUp':
      return kind === 'listbox' ? { active: keep(page(state, key === 'PageDown' ? 1 : -1)) } : { active };
    case 'Enter':
    case ' ':
      return { active, intent: enabled(state, active) ? 'select' : 'close' };
    case 'Tab':
      return { active, intent: kind === 'listbox' && enabled(state, active) ? 'select' : 'close' };
    case 'Escape':
      return { active, intent: 'close' };
    default:
      return { active };
  }
}

/**
 * Typeahead (REQ-494): the first enabled label that starts with `buffer`, searching from the item
 * after `from` for one character (so repeating it cycles) and from `from` itself for several (so
 * typing on stays put), wrapping; case-insensitive; `-1` when none matches. Pure.
 */
export function uiTypeahead(labels: readonly string[], disabled: readonly boolean[], buffer: string, from: number): number {
  const typed = buffer.toLowerCase();
  if (!typed) return -1;
  const single = [...typed].every((c) => c === typed[0]);
  const prefix = single ? typed[0]! : typed;
  const count = labels.length;
  const start = single ? from + 1 : Math.max(from, 0);
  for (let n = 0; n < count; n++) {
    const i = (((start + n) % count) + count) % count;
    if (disabled[i] !== true && labels[i]!.trim().toLowerCase().startsWith(prefix)) return i;
  }
  return -1;
}
