import { uiListKey, uiTypeahead, type UiItem } from '@silverpoint/core/ui';
import { computed, onBeforeUnmount, ref, watch, type ComputedRef } from 'vue';

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
  readonly activeKey: ComputedRef<string | null>;
  /** One key through `uiListKey`, or a character through `uiTypeahead`; `undefined` when the list does not answer it. */
  key(event: KeyboardEvent): ListStep | undefined;
  /** Cancels a Space's keyup, so no click follows the key that already acted. */
  keyUp(event: KeyboardEvent): void;
}

/**
 * The keyboard of a Select or a Menu (REQ-494, REQ-495, DD-039): the active item and the typeahead
 * buffer; every transition is the core's. The list opens on `from` (the chosen option) or its first
 * enabled item, as `uiListKey` says, and forgets its active item when it closes.
 */
export function useListKeys(items: () => readonly UiItem[], kind: 'listbox' | 'menu', open: () => boolean, from: () => number): ListKeys {
  const active = ref<number | null>(null);
  // A key that opens the list has just set its active item; a close forgets it.
  watch(open, (now) => {
    if (!now) active.value = null;
  });
  let buffer = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  onBeforeUnmount(() => clearTimeout(timer));
  const disabled = () => items().map((item) => item.disabled === true);
  const shown = computed(() => {
    if (!open()) return -1;
    return active.value ?? uiListKey({ active: from(), count: items().length, disabled: disabled(), open: false }, 'Enter', kind).active;
  });

  const step = (index: number, intent?: ListStep['intent']): ListStep => {
    active.value = index;
    return { intent, key: items()[index]?.key };
  };
  return {
    activeKey: computed(() => items()[shown.value]?.key ?? null),
    key(event) {
      const isOpen = open();
      const current = isOpen ? shown.value : from();
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
