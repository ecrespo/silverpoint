import type { Geometry, InkOptions, Stroke, TonalRamp } from '@silverpoint/core';
import { describe, expect, test } from 'vitest';
import { WeightInker } from '../src';

/** The weight ramp of Data Model §3.7. */
const ramp: TonalRamp = {
  1: { style: 'weight', weight: 1.5 },
  2: { style: 'weight', weight: 2.25 },
  3: { style: 'weight', weight: 3 },
  4: { style: 'weight', weight: 4 },
};

const options = (overrides: Partial<InkOptions> = {}): InkOptions => ({
  seed: 1234,
  roughness: 0,
  bowing: 0,
  hatchAngle: 0,
  hatchGap: 0,
  fillWeight: 0,
  nodeBudget: 40_000,
  hatchFill: 'tile',
  tonalRamp: ramp,
  scope: 'sp-test-w',
  ...overrides,
});

const box = { x: 0, y: 0, width: 200, height: 100 };
const geometry = (strokes: Stroke[]): Geometry => ({ viewBox: box, plot: box, strokes, labels: [], hitAreas: [], defs: [] });

const frame: Stroke = { d: 'M0.5,0.5H199.5V99.5H0.5Z', role: 'ornament', part: 'rule' };
const line: Stroke = { d: 'M10,80C40,60,80,20,190,10', role: 'encoding', part: 'ink' };
const bar = (x: number, tone: 1 | 2 | 3 | 4, extra: Partial<Stroke> = {}): Stroke => ({ d: `M${x},90V40H${x + 20}V90Z`, role: 'encoding', part: 'ink', tone, ...extra });

describe('WeightInker', () => {
  test('REQ-028 · is registered under the name the cyanotype ground declares', () => {
    expect(WeightInker.name).toBe('weight');
  });

  test('REQ-028 · a toned shape becomes its own outline, weighted by its tonal level', () => {
    const inked = WeightInker.ink(geometry([bar(10, 1), bar(40, 4), bar(70, 2, { paint: 'none', part: 'ink-secondary' })]), options());
    expect(inked.strokes).toEqual([
      { d: 'M10,90V40H30V90Z', role: 'encoding', part: 'ink', paint: 'stroke', weight: 1 },
      { d: 'M40,90V40H60V90Z', role: 'encoding', part: 'ink', paint: 'stroke', weight: 4 },
      { d: 'M70,90V40H90V90Z', role: 'encoding', part: 'ink-secondary', paint: 'stroke', weight: 2 },
    ]);
  });

  test('REQ-028 · emits no hatching: no hatch role, no tile, no pattern', () => {
    const inked = WeightInker.ink(geometry([frame, bar(10, 3), bar(40, 4)]), options({ hatchFill: 'per-shape' }));
    expect(inked.strokes.some((s) => s.role === 'hatch' || s.paint === 'tile' || s.tile !== undefined)).toBe(false);
    expect(inked.defs).toEqual([]);
  });

  test('REQ-022 · REQ-006 · Art. 1 · every vertex stays exact, and untoned strokes are returned as given', () => {
    const input = geometry([frame, line, bar(10, 2)]);
    const inked = WeightInker.ink(input, options());
    expect(inked.strokes.map((s) => s.d)).toEqual(input.strokes.map((s) => s.d));
    expect(inked.strokes[0]).toBe(frame);
    expect(inked.strokes[1]).toBe(line);
    expect(inked.labels).toBe(input.labels);
    expect(inked.hitAreas).toBe(input.hitAreas);
  });

  test('REQ-005 · Art. 4 · the seed changes nothing: the same geometry inks the same', () => {
    const input = geometry([frame, bar(10, 2)]);
    expect(WeightInker.ink(input, options({ seed: 1 }))).toEqual(WeightInker.ink(input, options({ seed: 99 })));
  });

  test('REQ-028 · a tone outside the ramp leaves the shape untouched, as the rough inker does', () => {
    const toned = bar(10, 3);
    const inked = WeightInker.ink(geometry([toned]), options({ tonalRamp: undefined }));
    expect(inked.strokes).toEqual([toned]);
  });
});
