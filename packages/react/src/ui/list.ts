import { uiListKey, uiTypeahead, type UiItem } from '@silverpoint/core/ui';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

/** Keys a list overlay answers; their default (scrolling, a button's click) is cancelled. */
const HANDLED: ReadonlySet<string> = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp', 'Enter', ' ', 'Escape']);
/** The typeahead buffer clears this long after the last key, ms (DD-039). */
const TYPEAHEAD_RESET = 500;

export interface ListStep {
  readonly intent?: 'open' | 'close' | 'select';
  /** The active item's key after the step. */
  readonly key?: string;
}

export interface ListKeys {
  /** The active item of the open list; `null` when it is closed. */
  readonly activeKey: string | null;
  /** One key through `uiListKey`, or a character through `uiTypeahead`; `undefined` when the list does not answer it. */
  key(event: KeyboardEvent): ListStep | undefined;
  /** Cancels a Space's keyup, so no click follows the key that already acted. */
  keyUp(event: KeyboardEvent): void;
  /** Makes an item active: a list opened by a click starts on its first. */
  activate(index: number): void;
}

/**
 * The keyboard of a Select or a Menu (REQ-494, REQ-495, DD-039): the active item and the typeahead
 * buffer; every transition is the core's. The list opens on `from` (the chosen option) or its first
 * enabled item, as `uiListKey` says, and forgets its active item when it closes.
 */
export function useListKeys(items: readonly UiItem[], kind: 'listbox' | 'menu', open: boolean, from: number): ListKeys {
  const [active, setActive] = useState<number | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    // A key that opens the list has just set its active item; a close forgets it.
    if (!open) setActive(null);
  }
  const buffer = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const disabled = items.map((item) => item.disabled === true);
  const count = items.length;
  const opening = uiListKey({ active: from, count, disabled, open: false }, 'Enter', kind).active;
  const shown = open ? (active ?? opening) : -1;

  const step = (index: number, intent?: ListStep['intent']): ListStep => {
    setActive(index);
    return { intent, key: items[index]?.key };
  };
  return {
    activeKey: items[shown]?.key ?? null,
    key(event) {
      const current = open ? shown : from;
      const typed = event.key;
      if (typed.length === 1 && (typed !== ' ' || buffer.current !== '')) {
        event.preventDefault();
        buffer.current += typed;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => (buffer.current = ''), TYPEAHEAD_RESET);
        const found = uiTypeahead(
          items.map((item) => item.label),
          disabled,
          buffer.current,
          current,
        );
        return found < 0 ? {} : step(found, open ? undefined : 'open');
      }
      if (HANDLED.has(typed)) event.preventDefault();
      const result = uiListKey({ active: current, count, disabled, open }, typed, kind);
      if (result.intent === undefined && result.active === current) return HANDLED.has(typed) ? {} : undefined;
      return step(result.active, result.intent);
    },
    keyUp(event) {
      if (event.key === ' ') event.preventDefault();
    },
    activate: setActive,
  };
}
