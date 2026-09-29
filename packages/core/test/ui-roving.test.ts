import { describe, expect, test } from 'vitest';
import { uiRovingFocus } from '../src/ui';

/** A stand-in for the DOM: items that record focus and clicks, a root that finds them. */
function fixture(disabled: boolean[], focused: number, dir: string | null = null) {
  const log: string[] = [];
  const items = disabled.map((d, i) => ({ disabled: d, focus: () => log.push(`focus ${i}`), click: () => log.push(`click ${i}`) }));
  const doc = { activeElement: focused >= 0 ? items[focused] : null as unknown };
  const root = {
    ownerDocument: doc,
    querySelectorAll: (selector: string) => (selector === '.item' ? items : []),
    closest: (selector: string) => (selector === '[dir]' && dir ? { getAttribute: () => dir } : null),
  };
  let prevented = false;
  const event = (key: string) => ({ key, preventDefault: () => (prevented = true) });
  return { root, log, event, prevented: () => prevented };
}

describe('uiRovingFocus (T-147)', () => {
  test('REQ-315 · an arrow moves focus to the next enabled item and, activating, selects it', () => {
    const f = fixture([false, true, false], 0);
    uiRovingFocus(f.event('ArrowRight'), f.root, '.item', 'horizontal', true);
    expect(f.log).toEqual(['focus 2', 'click 2']);
    expect(f.prevented()).toBe(true);
  });

  test('REQ-315 · manual activation only moves focus', () => {
    const f = fixture([false, false], 0);
    uiRovingFocus(f.event('End'), f.root, '.item', 'horizontal', false);
    expect(f.log).toEqual(['focus 1']);
  });

  test('REQ-315 · `both` reads the axis from the key, as radios do: Up and Left go back, Down and Right forward', () => {
    const f = fixture([false, false, false], 1);
    uiRovingFocus(f.event('ArrowUp'), f.root, '.item', 'both', true);
    uiRovingFocus(f.event('ArrowRight'), f.root, '.item', 'both', true);
    expect(f.log).toEqual(['focus 0', 'click 0', 'focus 2', 'click 2']);
  });

  test('REQ-321 · an ancestor with dir="rtl" mirrors the horizontal arrows', () => {
    const f = fixture([false, false, false], 1, 'rtl');
    uiRovingFocus(f.event('ArrowRight'), f.root, '.item', 'horizontal', false);
    expect(f.log).toEqual(['focus 0']);
  });

  test('other keys, cross-axis arrows and focus outside the items are left to the browser', () => {
    const tab = fixture([false, false], 0);
    uiRovingFocus(tab.event('Tab'), tab.root, '.item', 'horizontal', true);
    expect(tab.prevented()).toBe(false);
    const outside = fixture([false, false], -1);
    uiRovingFocus(outside.event('ArrowRight'), outside.root, '.item', 'horizontal', true);
    expect(outside.log).toEqual([]);
    expect(outside.prevented()).toBe(false);
    const cross = fixture([false, false], 0);
    uiRovingFocus(cross.event('ArrowDown'), cross.root, '.item', 'horizontal', true);
    expect(cross.log).toEqual([]);
  });
});
