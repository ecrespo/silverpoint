import { describe, expect, test } from 'vitest';
import { lineChart, reduceInteraction, type ActiveItem } from '../src';

const context = {
  id: 'sp-line-chart-reducer',
  width: 320,
  locale: 'en',
  emptyState: { text: 'No data', rule: true },
  domainPadding: 0.1,
};
const model = lineChart.build({ chrome: 'bare' }, context);
const { geometry } = model;
const first = geometry.hitAreas.find((hit) => hit.seriesKey === 'hits' && hit.index === 0);
const fourth = geometry.hitAreas.find((hit) => hit.seriesKey === 'hits' && hit.index === 3);

/** A bounding box drawn at twice the viewBox size, offset on the page. */
const box = { left: 100, top: 50, width: geometry.viewBox.width * 2, height: geometry.viewBox.height * 2 };
const client = (x: number, y: number) => ({ x: box.left + x * 2, y: box.top + y * 2 });

describe('reduceInteraction', () => {
  test('REQ-140 · a pointer over a point activates it, converting client to SVG space', () => {
    const result = reduceInteraction(geometry, null, { type: 'pointer', client: client(fourth?.x ?? 0, fourth?.y ?? 0), box, kind: 'mouse' });
    expect(result.active).toMatchObject({ seriesKey: 'hits', index: 3 });
    expect(result.changed).toBe(true);
  });

  test('REQ-141 · moving within the same item reports no change', () => {
    const at = client(fourth?.x ?? 0, fourth?.y ?? 0);
    const once = reduceInteraction(geometry, null, { type: 'pointer', client: at, box, kind: 'mouse' });
    const twice = reduceInteraction(geometry, once.active, { type: 'pointer', client: { x: at.x + 1, y: at.y }, box, kind: 'mouse' });
    expect(twice.changed).toBe(false);
  });

  test('REQ-143 · leaving the drawing area clears the item and reports the change', () => {
    const active = { seriesKey: 'hits', index: 3 } as ActiveItem;
    expect(reduceInteraction(geometry, active, { type: 'leave' })).toMatchObject({ active: null, changed: true });
    expect(reduceInteraction(geometry, null, { type: 'leave' })).toMatchObject({ active: null, changed: false });
  });

  test('REQ-143 · losing focus clears the item', () => {
    const active = { seriesKey: 'hits', index: 3 } as ActiveItem;
    expect(reduceInteraction(geometry, active, { type: 'blur' })).toMatchObject({ active: null, changed: true });
  });

  test('REQ-141 · keyboard focus activates the first point', () => {
    const result = reduceInteraction(geometry, null, { type: 'focus' });
    expect(result.active).toMatchObject({ seriesKey: first?.seriesKey, index: 0 });
  });

  test('REQ-122 · arrow keys traverse and are handled; other keys are not', () => {
    const start = reduceInteraction(geometry, null, { type: 'focus' }).active;
    const next = reduceInteraction(geometry, start, { type: 'key', key: 'ArrowRight' });
    expect(next).toMatchObject({ handled: true, changed: true });
    expect(next.active?.index).toBe(1);
    expect(reduceInteraction(geometry, next.active, { type: 'key', key: 'a' })).toMatchObject({ handled: false, changed: false });
  });

  test('API §9 · Enter and Space select the active item', () => {
    const active = reduceInteraction(geometry, null, { type: 'focus' }).active;
    expect(reduceInteraction(geometry, active, { type: 'key', key: 'Enter' })).toMatchObject({ handled: true, selected: active });
    expect(reduceInteraction(geometry, active, { type: 'key', key: ' ' })).toMatchObject({ handled: true, selected: active });
    expect(reduceInteraction(geometry, null, { type: 'key', key: 'Enter' }).selected).toBeUndefined();
  });

  test('API §9 · a click selects the item under the pointer', () => {
    const result = reduceInteraction(geometry, null, { type: 'click', client: client(fourth?.x ?? 0, fourth?.y ?? 0), box, kind: 'mouse' });
    expect(result.selected).toMatchObject({ seriesKey: 'hits', index: 3 });
  });

  test('REQ-140 · the reducer is pure: same input, same output', () => {
    const event = { type: 'pointer', client: client(fourth?.x ?? 0, fourth?.y ?? 0), box, kind: 'mouse' } as const;
    expect(reduceInteraction(geometry, null, event)).toEqual(reduceInteraction(geometry, null, event));
  });
});
