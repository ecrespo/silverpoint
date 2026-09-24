import { describe, expect, test } from 'vitest';
import {
  lineChart,
  readout,
  resolveActive,
  stepActive,
  toSvgPoint,
  type Geometry,
  type HitArea,
  type RecipeContext,
} from '../src';

const context: RecipeContext = {
  id: 'sp-line-chart-demo',
  width: 320,
  locale: 'en',
  emptyState: { text: 'No data', rule: true },
  domainPadding: 0.1,
};

const model = lineChart.build({ chrome: 'bare' }, context);
const { geometry } = model;
const hits = geometry.hitAreas.filter((h) => h.seriesKey === 'hits');

describe('hit-testing engine', () => {
  test('REQ-140 · resolves the active item from a coordinate and the geometry, with no DOM', () => {
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
    const target = hits[4] as HitArea;
    const active = resolveActive(geometry, { x: target.x + 1, y: target.y });
    expect(active).toEqual({
      seriesKey: 'hits',
      index: 4,
      datum: target.datum,
      value: target.value,
      point: { x: target.x, y: target.y },
    });
  });

  test('REQ-140 · the nearer series wins at a shared x', () => {
    const baseline = geometry.hitAreas.find((h) => h.seriesKey === 'baseline' && h.index === 9) as HitArea;
    expect(resolveActive(geometry, { x: baseline.x, y: baseline.y + 1 })?.seriesKey).toBe('baseline');
  });

  test('REQ-140 · a coordinate outside the plot area resolves to null', () => {
    expect(resolveActive(geometry, { x: -5, y: 40 })).toBeNull();
    expect(resolveActive(geometry, { x: 100, y: geometry.viewBox.height + 10 })).toBeNull();
    expect(resolveActive(geometry, { x: Number.NaN, y: 1 })).toBeNull();
  });

  test('REQ-140 · the resolution is pure: same input, same output, geometry untouched', () => {
    const before = JSON.stringify(geometry);
    const a = resolveActive(geometry, { x: 150, y: 60 });
    const b = resolveActive(geometry, { x: 150, y: 60 });
    expect(a).toEqual(b);
    expect(JSON.stringify(geometry)).toBe(before);
  });

  test('REQ-144 · touch resolves by proximity with at least a 24 px target', () => {
    const sparse: Geometry = {
      ...geometry,
      plot: { x: 0, y: 0, width: 400, height: 100 },
      hitAreas: [
        { seriesKey: 's', index: 0, datum: {}, value: 1, x: 10, y: 50 },
        { seriesKey: 's', index: 1, datum: {}, value: 2, x: 30, y: 50 },
        { seriesKey: 's', index: 2, datum: {}, value: 3, x: 300, y: 50 },
      ],
    };
    // 12 px away with 20 px spacing: inside the 24 px minimum target.
    expect(resolveActive(sparse, { x: 42, y: 50 }, 'touch')?.index).toBe(1);
    // 13 px away: outside it, while a mouse still resolves the nearest item.
    expect(resolveActive(sparse, { x: 43, y: 50 }, 'touch')).toBeNull();
    expect(resolveActive(sparse, { x: 43, y: 50 }, 'mouse')?.index).toBe(1);
  });

  test('REQ-140 · client coordinates convert to SVG space', () => {
    const point = toSvgPoint({ x: 110, y: 60 }, { left: 10, top: 10, width: 640, height: 300 }, geometry.viewBox);
    expect(point.x).toBeCloseTo(50);
    expect(point.y).toBeCloseTo(26.67);
    expect(Number.isNaN(toSvgPoint({ x: 1, y: 1 }, { left: 0, top: 0, width: 0, height: 0 }, geometry.viewBox).x)).toBe(true);
  });
});

describe('keyboard traversal', () => {
  test('REQ-122 · arrows, Home and End traverse the points of a series', () => {
    const first = stepActive(geometry, null, 'ArrowRight');
    expect(first?.index).toBe(0);
    const second = stepActive(geometry, first ?? null, 'ArrowRight');
    expect(second?.index).toBe(1);
    expect(stepActive(geometry, second ?? null, 'ArrowLeft')?.index).toBe(0);
    expect(stepActive(geometry, second ?? null, 'End')?.index).toBe(hits.length - 1);
    expect(stepActive(geometry, second ?? null, 'Home')?.index).toBe(0);
    expect(stepActive(geometry, second ?? null, 'Escape')).toBeNull();
    expect(stepActive(geometry, second ?? null, 'a')).toBeUndefined();
  });

  test('REQ-122 · each point announces series, category and value', () => {
    const active = stepActive(geometry, null, 'End');
    const r = readout(model, active!);
    expect(r.announcement).toBe('hour 22, hits 41');
    expect(r.heading).toBe('22');
    expect(r.text).toBe('hits: 41');
    expect(r.left).toMatch(/^\d+(\.\d{1,2})?%$/);
  });
});
