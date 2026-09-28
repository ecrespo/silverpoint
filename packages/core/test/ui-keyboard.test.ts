import { describe, expect, test } from 'vitest';
import { uiRovingKey, type UiRovingKey } from '../src/ui';

const none = (count: number) => Array.from({ length: count }, () => false);
const state = (index: number, disabled: readonly boolean[]) => ({ index, count: disabled.length, disabled });

describe('uiRovingKey (T-137)', () => {
  test('REQ-315 · horizontal: Right moves forward and Left back, wrapping at both ends', () => {
    const d = none(4);
    expect(uiRovingKey(state(1, d), 'ArrowRight', 'horizontal', 'ltr')).toBe(2);
    expect(uiRovingKey(state(1, d), 'ArrowLeft', 'horizontal', 'ltr')).toBe(0);
    expect(uiRovingKey(state(3, d), 'ArrowRight', 'horizontal', 'ltr')).toBe(0);
    expect(uiRovingKey(state(0, d), 'ArrowLeft', 'horizontal', 'ltr')).toBe(3);
  });

  test('REQ-315 · vertical: Down moves forward and Up back, wrapping at both ends', () => {
    const d = none(3);
    expect(uiRovingKey(state(0, d), 'ArrowDown', 'vertical', 'ltr')).toBe(1);
    expect(uiRovingKey(state(0, d), 'ArrowUp', 'vertical', 'ltr')).toBe(2);
    expect(uiRovingKey(state(2, d), 'ArrowDown', 'vertical', 'ltr')).toBe(0);
  });

  test('REQ-315 · the cross-axis arrows do nothing (APG tabs): the index is kept', () => {
    const d = none(3);
    for (const key of ['ArrowUp', 'ArrowDown'] as const) expect(uiRovingKey(state(1, d), key, 'horizontal', 'ltr')).toBe(1);
    for (const key of ['ArrowLeft', 'ArrowRight'] as const) expect(uiRovingKey(state(1, d), key, 'vertical', 'rtl')).toBe(1);
  });

  test('REQ-315 · Home and End go to the first and the last item, whatever the orientation', () => {
    const d = none(5);
    for (const orientation of ['horizontal', 'vertical'] as const) {
      expect(uiRovingKey(state(2, d), 'Home', orientation, 'ltr')).toBe(0);
      expect(uiRovingKey(state(2, d), 'End', orientation, 'ltr')).toBe(4);
    }
  });

  test('REQ-321 · rtl mirrors the horizontal arrows only; Home and End keep their meaning', () => {
    const d = none(4);
    expect(uiRovingKey(state(1, d), 'ArrowRight', 'horizontal', 'rtl')).toBe(0);
    expect(uiRovingKey(state(1, d), 'ArrowLeft', 'horizontal', 'rtl')).toBe(2);
    expect(uiRovingKey(state(0, d), 'ArrowRight', 'horizontal', 'rtl')).toBe(3);
    expect(uiRovingKey(state(1, d), 'ArrowDown', 'vertical', 'rtl')).toBe(2);
    expect(uiRovingKey(state(1, d), 'Home', 'horizontal', 'rtl')).toBe(0);
    expect(uiRovingKey(state(1, d), 'End', 'horizontal', 'rtl')).toBe(3);
  });

  test('REQ-326 · arrows skip disabled items, across the wrap', () => {
    const d = [false, true, false, true, true];
    expect(uiRovingKey(state(0, d), 'ArrowRight', 'horizontal', 'ltr')).toBe(2);
    expect(uiRovingKey(state(2, d), 'ArrowRight', 'horizontal', 'ltr')).toBe(0);
    expect(uiRovingKey(state(0, d), 'ArrowLeft', 'horizontal', 'ltr')).toBe(2);
  });

  test('REQ-326 · Home and End skip disabled items at the ends', () => {
    const d = [true, false, false, true];
    expect(uiRovingKey(state(2, d), 'Home', 'horizontal', 'ltr')).toBe(1);
    expect(uiRovingKey(state(1, d), 'End', 'horizontal', 'ltr')).toBe(2);
  });

  test('REQ-326 · with a single enabled item every key stays on it', () => {
    const d = [true, false, true];
    for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End'] as const) {
      expect(uiRovingKey(state(1, d), key, 'horizontal', 'ltr')).toBe(1);
    }
  });

  test('REQ-326 · with every item disabled, or none at all, the index is kept', () => {
    const d = [true, true, true];
    for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End'] as const) {
      expect(uiRovingKey(state(1, d), key, 'horizontal', 'ltr')).toBe(1);
    }
    expect(uiRovingKey(state(-1, []), 'ArrowRight', 'horizontal', 'ltr')).toBe(-1);
  });

  test('REQ-315 · from no current item (-1) the arrows start at the ends, as a fresh tab stop does', () => {
    const d = none(3);
    expect(uiRovingKey(state(-1, d), 'ArrowRight', 'horizontal', 'ltr')).toBe(0);
    expect(uiRovingKey(state(-1, d), 'ArrowLeft', 'horizontal', 'ltr')).toBe(2);
  });

  test('REQ-315 · pure: the same state and key always give the same index, and the input is not changed', () => {
    const disabled = Object.freeze([false, true, false, false]);
    const input = Object.freeze({ index: 0, count: 4, disabled });
    const keys: UiRovingKey[] = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    for (const key of keys) {
      for (const orientation of ['horizontal', 'vertical'] as const) {
        for (const dir of ['ltr', 'rtl'] as const) {
          const first = uiRovingKey(input, key, orientation, dir);
          expect(uiRovingKey(input, key, orientation, dir)).toBe(first);
          expect(first === input.index || !disabled[first]).toBe(true);
        }
      }
    }
  });

  test('REQ-326 · exhaustive: over every disabled pattern of 4 items, a move never lands on a disabled item', () => {
    const keys: UiRovingKey[] = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    for (let mask = 0; mask < 16; mask++) {
      const disabled = [0, 1, 2, 3].map((bit) => (mask & (1 << bit)) !== 0);
      for (let index = 0; index < 4; index++) {
        for (const key of keys) {
          for (const orientation of ['horizontal', 'vertical'] as const) {
            for (const dir of ['ltr', 'rtl'] as const) {
              const next = uiRovingKey(state(index, disabled), key, orientation, dir);
              expect(next === index || disabled[next] === false).toBe(true);
              expect(next).toBeGreaterThanOrEqual(0);
              expect(next).toBeLessThan(4);
            }
          }
        }
      }
    }
  });
});
