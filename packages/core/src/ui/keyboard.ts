import type { UiOrientation } from './types';

export type UiRovingKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End';

export interface UiRovingState {
  /** The focused item; `-1` when none is yet. */
  readonly index: number;
  readonly count: number;
  readonly disabled: readonly boolean[];
}

/** +1, -1, or 0 for a key that does not move along this orientation. */
function direction(key: UiRovingKey, orientation: UiOrientation, dir: 'ltr' | 'rtl'): number {
  if (orientation === 'vertical') return key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0;
  const forward = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
  return dir === 'rtl' ? -forward : forward;
}

/**
 * The WAI-ARIA APG roving-focus transition of a tab list or radio-like group (REQ-315): arrows
 * along the orientation move to the next enabled item and wrap at the ends, `rtl` mirrors the
 * horizontal arrows (REQ-321), Home and End go to the first and last enabled item, and disabled
 * items are skipped (REQ-326). Cross-axis arrows, and any key with no enabled item to go to, keep
 * the index. Pure.
 */
export function uiRovingKey(state: UiRovingState, key: UiRovingKey, orientation: UiOrientation, dir: 'ltr' | 'rtl'): number {
  const { index, count, disabled } = state;
  const enabled = (i: number) => disabled[i] !== true;
  if (key === 'Home' || key === 'End') {
    const step = key === 'Home' ? 1 : -1;
    for (let n = 0, i = key === 'Home' ? 0 : count - 1; n < count; n++, i += step) if (enabled(i)) return i;
    return index;
  }
  const step = direction(key, orientation, dir);
  if (step === 0) return index;
  // From no current item, the first move lands on the first (or last) enabled item.
  let i = index < 0 || index >= count ? (step > 0 ? -1 : count) : index;
  for (let n = 0; n < count; n++) {
    i = (((i + step) % count) + count) % count;
    if (enabled(i)) return i;
  }
  return index;
}

const ROVING: ReadonlySet<string> = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

/** Whether a `KeyboardEvent.key` moves a roving focus: the arrows, Home and End (REQ-315). */
export const uiIsRovingKey = (key: string): key is UiRovingKey => ROVING.has(key);
