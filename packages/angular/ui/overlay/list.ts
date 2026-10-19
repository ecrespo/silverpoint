import { computed, DestroyRef, inject, linkedSignal, type Signal } from '@angular/core';
import { uiListKey, uiTypeahead, type UiItem } from '@silverpoint/core/ui';

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
  readonly activeKey: Signal<string | null>;
  /** One key through `uiListKey`, or a character through `uiTypeahead`; `undefined` when the list does not answer it. */
  key(event: KeyboardEvent): ListStep | undefined;
  /** Cancels a Space's keyup, so no click follows the key that already acted. */
  keyUp(event: KeyboardEvent): void;
}

/**
 * The keyboard of a Select or a Menu (REQ-494, REQ-495, DD-039): the active item and the typeahead
 * buffer; every transition is the core's. The list opens on `from` (the chosen option) or its first
 * enabled item, as `uiListKey` says, and forgets its active item when it closes. In an injection context.
 */
export function uiListKeys(items: Signal<readonly UiItem[]>, kind: 'listbox' | 'menu', open: Signal<boolean>, from: Signal<number>): ListKeys {
  // A key that opens the list has just set its active item; a close forgets it.
  const active = linkedSignal<boolean, number | null>({ source: open, computation: (isOpen, previous) => (isOpen ? (previous?.value ?? null) : null) });
  let buffer = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  inject(DestroyRef).onDestroy(() => clearTimeout(timer));
  const disabled = computed(() => items().map((item) => item.disabled === true));
  const shown = computed(() => {
    // Read even while closed: a linked signal is lazy, and the render of the closed list is what
    // makes it forget its active item.
    const current = active();
    if (!open()) return -1;
    return current ?? uiListKey({ active: from(), count: items().length, disabled: disabled(), open: false }, 'Enter', kind).active;
  });

  const step = (index: number, intent?: ListStep['intent']): ListStep => {
    active.set(index);
    return { intent, key: items()[index]?.key };
  };
  return {
    activeKey: computed(() => items()[shown()]?.key ?? null),
    key(event) {
      const isOpen = open();
      const current = isOpen ? shown() : from();
      const typed = event.key;
      if (typed.length === 1 && (typed !== ' ' || buffer !== '')) {
        event.preventDefault();
        buffer += typed;
        clearTimeout(timer);
        timer = setTimeout(() => (buffer = ''), TYPEAHEAD_RESET);
        const found = uiTypeahead(
          items().map((item) => item.label),
          disabled(),
          buffer,
          current,
        );
        return found < 0 ? {} : step(found, isOpen ? undefined : 'open');
      }
      if (HANDLED.has(typed)) event.preventDefault();
      const result = uiListKey({ active: current, count: items().length, disabled: disabled(), open: isOpen }, typed, kind);
      if (result.intent === undefined && result.active === current) return HANDLED.has(typed) ? {} : undefined;
      return step(result.active, result.intent);
    },
    keyUp(event) {
      if (event.key === ' ') event.preventDefault();
    },
  };
}
