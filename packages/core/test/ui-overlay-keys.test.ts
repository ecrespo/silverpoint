import { describe, expect, test } from 'vitest';
import { uiListKey, uiPlace, uiTypeahead, type UiPlaceInput } from '../src/ui';

const four = (active: number, open = true) => ({ active, count: 4, disabled: [false, false, true, false], open });

describe('uiListKey — APG select-only combobox and menu button (T-204)', () => {
  test('REQ-494 · open listbox: arrows skip disabled options and do not wrap', () => {
    expect(uiListKey(four(1), 'ArrowDown', 'listbox')).toEqual({ active: 3 });
    expect(uiListKey(four(3), 'ArrowDown', 'listbox')).toEqual({ active: 3 });
    expect(uiListKey(four(3), 'ArrowUp', 'listbox')).toEqual({ active: 1 });
    expect(uiListKey(four(0), 'ArrowUp', 'listbox')).toEqual({ active: 0 });
  });

  test('REQ-495 · open menu: arrows skip disabled items and wrap', () => {
    expect(uiListKey(four(3), 'ArrowDown', 'menu')).toEqual({ active: 0 });
    expect(uiListKey(four(0), 'ArrowUp', 'menu')).toEqual({ active: 3 });
    expect(uiListKey(four(1), 'ArrowDown', 'menu')).toEqual({ active: 3 });
  });

  test('REQ-494 · REQ-495 · Home and End go to the first and last enabled item', () => {
    for (const kind of ['listbox', 'menu'] as const) {
      expect(uiListKey(four(3), 'Home', kind)).toEqual({ active: 0 });
      expect(uiListKey(four(0), 'End', kind)).toEqual({ active: 3 });
      expect(uiListKey({ active: 3, count: 3, disabled: [true, false, true], open: true }, 'Home', kind)).toEqual({ active: 1 });
    }
  });

  test('REQ-494 · from no active option the first move lands on the first (or last) enabled one', () => {
    expect(uiListKey(four(-1), 'ArrowDown', 'listbox')).toEqual({ active: 0 });
    expect(uiListKey(four(-1), 'ArrowUp', 'listbox')).toEqual({ active: 3 });
  });

  test('REQ-494 · PageDown and PageUp move ten options, held to the enabled ends', () => {
    const twenty = { active: 0, count: 20, disabled: Array.from({ length: 20 }, (_, i) => i === 10 || i === 19), open: true };
    expect(uiListKey(twenty, 'PageDown', 'listbox')).toEqual({ active: 11 });
    expect(uiListKey({ ...twenty, active: 15 }, 'PageDown', 'listbox')).toEqual({ active: 18 });
    expect(uiListKey({ ...twenty, active: 4 }, 'PageUp', 'listbox')).toEqual({ active: 0 });
  });

  test('REQ-494 · open listbox: Enter and Space select the active option, Escape closes, Tab selects', () => {
    expect(uiListKey(four(1), 'Enter', 'listbox')).toEqual({ active: 1, intent: 'select' });
    expect(uiListKey(four(1), ' ', 'listbox')).toEqual({ active: 1, intent: 'select' });
    expect(uiListKey(four(1), 'Escape', 'listbox')).toEqual({ active: 1, intent: 'close' });
    expect(uiListKey(four(1), 'Tab', 'listbox')).toEqual({ active: 1, intent: 'select' });
  });

  test('REQ-326 · nothing is selected without an enabled active option: it only closes', () => {
    expect(uiListKey(four(-1), 'Enter', 'listbox')).toEqual({ active: -1, intent: 'close' });
    expect(uiListKey(four(2), 'Enter', 'listbox')).toEqual({ active: 2, intent: 'close' });
    expect(uiListKey(four(2), 'Tab', 'listbox')).toEqual({ active: 2, intent: 'close' });
  });

  test('REQ-495 · open menu: Enter and Space activate, Escape and Tab close', () => {
    expect(uiListKey(four(3), 'Enter', 'menu')).toEqual({ active: 3, intent: 'select' });
    expect(uiListKey(four(3), ' ', 'menu')).toEqual({ active: 3, intent: 'select' });
    expect(uiListKey(four(3), 'Escape', 'menu')).toEqual({ active: 3, intent: 'close' });
    expect(uiListKey(four(3), 'Tab', 'menu')).toEqual({ active: 3, intent: 'close' });
  });

  test('REQ-494 · closed listbox: arrows, Enter and Space open on the selected option, else the first enabled', () => {
    for (const key of ['ArrowDown', 'ArrowUp', 'Enter', ' ']) {
      expect(uiListKey(four(3, false), key, 'listbox')).toEqual({ active: 3, intent: 'open' });
      expect(uiListKey(four(-1, false), key, 'listbox')).toEqual({ active: 0, intent: 'open' });
    }
    expect(uiListKey(four(1, false), 'Home', 'listbox')).toEqual({ active: 0, intent: 'open' });
    expect(uiListKey(four(1, false), 'End', 'listbox')).toEqual({ active: 3, intent: 'open' });
  });

  test('REQ-495 · closed menu: ArrowDown, Enter and Space open on the first item, ArrowUp on the last', () => {
    for (const key of ['ArrowDown', 'Enter', ' ']) expect(uiListKey(four(-1, false), key, 'menu')).toEqual({ active: 0, intent: 'open' });
    expect(uiListKey(four(-1, false), 'ArrowUp', 'menu')).toEqual({ active: 3, intent: 'open' });
  });

  test('REQ-494 · other keys, and moves with every item disabled, keep the state', () => {
    expect(uiListKey(four(1), 'a', 'listbox')).toEqual({ active: 1 });
    expect(uiListKey(four(1, false), 'Escape', 'listbox')).toEqual({ active: 1 });
    const none = { active: -1, count: 3, disabled: [true, true, true], open: true };
    expect(uiListKey(none, 'ArrowDown', 'menu')).toEqual({ active: -1 });
    expect(uiListKey(none, 'End', 'listbox')).toEqual({ active: -1 });
  });
});

describe('uiTypeahead (T-204)', () => {
  const labels = ['Silverpoint', 'Sanguine', 'Sepia', 'Iron gall', 'Verdigris', 'Indigo'];
  const disabled = [false, false, true, false, false, false];

  test('REQ-494 · one character moves to the next enabled label starting with it, wrapping', () => {
    expect(uiTypeahead(labels, disabled, 's', 0)).toBe(1);
    expect(uiTypeahead(labels, disabled, 's', 1)).toBe(0);
    expect(uiTypeahead(labels, disabled, 'i', -1)).toBe(3);
  });

  test('REQ-494 · several characters match from the current item on, so typing on stays put', () => {
    expect(uiTypeahead(labels, disabled, 've', 4)).toBe(4);
    expect(uiTypeahead(labels, disabled, 've', 0)).toBe(4);
    // "v" lands on Vellum; typing on to "ve" keeps it, where a fresh search would move to Verdigris.
    const media = ['Vellum', 'Verdigris', 'Vermilion'];
    expect(uiTypeahead(media, [false, false, false], 'v', -1)).toBe(0);
    expect(uiTypeahead(media, [false, false, false], 've', 0)).toBe(0);
    expect(uiTypeahead(media, [false, false, false], 'ver', 0)).toBe(1);
  });

  test('REQ-494 · a repeated character cycles as the single character does; case-insensitive', () => {
    expect(uiTypeahead(labels, disabled, 'sss', 0)).toBe(1);
    expect(uiTypeahead(labels, disabled, 'IN', 0)).toBe(5);
  });

  test('REQ-326 · no enabled match gives -1', () => {
    expect(uiTypeahead(labels, disabled, 'x', 0)).toBe(-1);
    expect(uiTypeahead(labels, disabled, 'se', 0)).toBe(-1);
    expect(uiTypeahead(labels, disabled, '', 0)).toBe(-1);
  });
});

describe('uiPlace (T-204)', () => {
  const base: UiPlaceInput = {
    anchor: { x: 100, y: 100, width: 80, height: 30 },
    floating: { width: 120, height: 40 },
    viewport: { width: 800, height: 600 },
    side: 'bottom',
    align: 'center',
    offset: 6,
    padding: 8,
    dir: 'ltr',
  };
  const place = (over: Partial<UiPlaceInput>) => uiPlace({ ...base, ...over });

  test('REQ-493 · bottom and top, aligned start, centre and end along the side', () => {
    expect(place({})).toEqual({ x: 80, y: 136, side: 'bottom', align: 'center' });
    expect(place({ align: 'start' })).toMatchObject({ x: 100 });
    expect(place({ align: 'end' })).toMatchObject({ x: 60 });
    expect(place({ side: 'top' })).toEqual({ x: 80, y: 54, side: 'top', align: 'center' });
  });

  test('REQ-523 · in rtl, start and end alignment mirror', () => {
    expect(place({ align: 'start', dir: 'rtl' })).toMatchObject({ x: 60 });
    expect(place({ align: 'end', dir: 'rtl' })).toMatchObject({ x: 100 });
  });

  test('REQ-493 · end and start sides are right and left in ltr, aligned top, centre and bottom', () => {
    expect(place({ side: 'end' })).toEqual({ x: 186, y: 95, side: 'end', align: 'center' });
    expect(place({ side: 'end', align: 'start' })).toMatchObject({ y: 100 });
    expect(place({ side: 'end', align: 'end' })).toMatchObject({ y: 90 });
    expect(place({ side: 'start', anchor: { x: 300, y: 100, width: 80, height: 30 } })).toMatchObject({ x: 174, side: 'start' });
  });

  test('REQ-493 · it flips to the opposite side when the preferred one does not fit and the other does', () => {
    expect(place({ anchor: { x: 100, y: 560, width: 80, height: 30 } })).toMatchObject({ y: 514, side: 'top' });
    expect(place({ side: 'start' })).toMatchObject({ x: 186, side: 'end' });
    expect(place({ side: 'top', anchor: { x: 100, y: 10, width: 80, height: 30 } })).toMatchObject({ y: 46, side: 'bottom' });
  });

  test('REQ-523 · in rtl, end is the left side and flips to start on the right', () => {
    expect(place({ side: 'end', dir: 'rtl' })).toMatchObject({ x: 186, side: 'start' });
    expect(place({ side: 'end', dir: 'rtl', anchor: { x: 300, y: 100, width: 80, height: 30 } })).toMatchObject({ x: 174, side: 'end' });
  });

  test('REQ-493 · when neither side fits it keeps the preferred one', () => {
    expect(place({ viewport: { width: 800, height: 100 }, anchor: { x: 100, y: 40, width: 80, height: 20 }, floating: { width: 120, height: 60 } })).toMatchObject({
      y: 66,
      side: 'bottom',
    });
  });

  test('I-35 · it shifts along the side into the viewport minus padding', () => {
    expect(place({ anchor: { x: 780, y: 100, width: 20, height: 30 } })).toMatchObject({ x: 672 });
    expect(place({ anchor: { x: 0, y: 100, width: 20, height: 30 } })).toMatchObject({ x: 8 });
    expect(place({ side: 'end', anchor: { x: 100, y: 590, width: 80, height: 10 } })).toMatchObject({ y: 552 });
  });

  test('I-35 · an overlay wider than the viewport starts at the padding; output has 2 decimals', () => {
    expect(place({ floating: { width: 900, height: 40 } })).toMatchObject({ x: 8 });
    expect(place({ anchor: { x: 100.333, y: 100.004, width: 80.111, height: 30 } })).toEqual({ x: 80.39, y: 136, side: 'bottom', align: 'center' });
  });
});
