import { describe, expect, test } from 'vitest';
import { uiToneTile } from '../src/ui';

const RAD = Math.PI / 180;
const numbers = (d: string) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);

/** Every segment's endpoints, from `M x,y L x,y` path data. */
const ends = (d: string) => {
  const [x1, y1, x2, y2] = numbers(d);
  return [
    { x: x1!, y: y1! },
    { x: x2!, y: y2! },
  ];
};

describe('uiToneTile (T-140)', () => {
  const hachure = { style: 'hachure', gap: 5.5, angle: -41 } as const;

  test('REQ-308 · a hachure step is one layer whose size is the line family\'s period, so it repeats without a seam', () => {
    const layers = uiToneTile(hachure);
    expect(layers).toHaveLength(1);
    const { width, height } = layers[0]!;
    // Shifting by the tile moves a line of the family onto another one: a whole number of gaps.
    const perpendicular = (dx: number, dy: number) => Math.abs(-Math.sin(-41 * RAD) * dx + Math.cos(-41 * RAD) * dy) / 5.5;
    expect(perpendicular(width, 0)).toBeCloseTo(Math.round(perpendicular(width, 0)), 1);
    expect(perpendicular(0, height)).toBeCloseTo(Math.round(perpendicular(0, height)), 1);
    expect(width).toBeGreaterThan(20);
  });

  test('REQ-308 · the lines are ornament strokes (a tone carries no value), each an exact segment from edge to edge', () => {
    const [layer] = uiToneTile(hachure);
    expect(layer!.strokes.length).toBeGreaterThan(4);
    for (const stroke of layer!.strokes) {
      expect(stroke).toMatchObject({ role: 'ornament', part: 'ink' });
      expect(stroke.d).toMatch(/^M-?[\d.]+,-?[\d.]+L-?[\d.]+,-?[\d.]+$/);
      for (const p of ends(stroke.d)) {
        const onEdge = [p.x, p.y].some((v) => v === 0) || p.x === layer!.width || p.y === layer!.height;
        expect(onEdge).toBe(true);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(layer!.width);
      }
    }
  });

  test('REQ-308 · every line runs at the ramp\'s angle, and neighbours sit one gap apart', () => {
    const [layer] = uiToneTile(hachure);
    const offsets = layer!.strokes.map((s) => {
      const [a, b] = ends(s.d);
      expect(Math.atan2(b!.y - a!.y, b!.x - a!.x) / RAD).toBeCloseTo(-41, 0);
      return -Math.sin(-41 * RAD) * a!.x + Math.cos(-41 * RAD) * a!.y;
    });
    const sorted = [...offsets].sort((x, y) => x - y);
    for (let i = 1; i < sorted.length; i++) expect(sorted[i]! - sorted[i - 1]!).toBeCloseTo(5.5, 1);
  });

  test('REQ-308 · a cross-hatch step adds a perpendicular layer with its own period', () => {
    const layers = uiToneTile({ style: 'cross-hatch', gap: 5.5, angle: -41 });
    expect(layers).toHaveLength(2);
    const [, cross] = layers;
    const [a, b] = ends(cross!.strokes[0]!.d);
    expect(Math.abs(Math.atan2(b!.y - a!.y, b!.x - a!.x) / RAD)).toBeCloseTo(49, 0);
  });

  test('REQ-302 · pure and at 2 decimals; a weight step has no tile (tone is its line weight)', () => {
    expect(uiToneTile(hachure)).toEqual(uiToneTile(hachure));
    for (const stroke of uiToneTile(hachure)[0]!.strokes) for (const n of numbers(stroke.d)) expect(String(n)).toMatch(/^-?\d+(?:\.\d{1,2})?$/);
    expect(uiToneTile({ style: 'weight', weight: 3 })).toEqual([]);
  });
});
