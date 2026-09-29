import { uiIsRovingKey, uiRovingKey } from './keyboard';
import type { UiOrientation } from './types';

/** An item of a composite: a native radio or tab button. */
interface RovingItem {
  readonly disabled?: boolean;
  focus(): void;
  click(): void;
}

/** The composite's root element, as much of the DOM as this reads; the core has no DOM types. */
export interface UiRovingRoot {
  querySelectorAll(selector: string): ArrayLike<unknown>;
  closest(selector: string): { getAttribute(name: string): string | null } | null;
  readonly ownerDocument: { readonly activeElement: unknown } | null;
}

/**
 * The keyboard of a composite (REQ-315), for a `keydown` on its root: the transition is
 * `uiRovingKey`; this finds the items, reads the direction from the nearest `dir` (REQ-321), and
 * moves focus —and, when `activate`, selects by clicking the item, so the adapter's own click or
 * change handler runs. `both` takes the axis from the key, as a radio group does. A key it does
 * not use is left to the browser.
 */
export function uiRovingFocus(
  event: { readonly key: string; preventDefault(): void },
  root: UiRovingRoot,
  selector: string,
  orientation: UiOrientation | 'both',
  activate: boolean,
): void {
  const { key } = event;
  if (!uiIsRovingKey(key)) return;
  const items = Array.from(root.querySelectorAll(selector)) as RovingItem[];
  const index = items.indexOf(root.ownerDocument?.activeElement as RovingItem);
  if (index < 0) return;
  const axis = orientation !== 'both' ? orientation : key === 'ArrowUp' || key === 'ArrowDown' ? 'vertical' : 'horizontal';
  const dir = root.closest('[dir]')?.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr';
  const next = uiRovingKey({ index, count: items.length, disabled: items.map((item) => item.disabled === true) }, key, axis, dir);
  if (next === index) return;
  event.preventDefault();
  items[next]!.focus();
  if (activate) items[next]!.click();
}
