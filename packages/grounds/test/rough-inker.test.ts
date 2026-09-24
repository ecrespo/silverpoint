import type { Geometry, InkOptions, Stroke } from '@silverpoint/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { RoughInker, silverpoint } from '../src';

afterEach(() => vi.restoreAllMocks());

const options = (overrides: Partial<InkOptions> = {}): InkOptions => ({
  seed: 1234,
  ...silverpoint.inkOptions,
  nodeBudget: 40_000,
  hatchFill: 'tile',
  tonalRamp: silverpoint.tonalRamp,
  scope: 'sp-test-a',
  ...overrides,
});

const box = { x: 0, y: 0, width: 200, height: 100 };

function geometry(strokes: Stroke[]): Geometry {
  return { viewBox: box, plot: box, strokes, labels: [], hitAreas: [], defs: [] };
}

const frame: Stroke = { d: 'M0.5,0.5H199.5V99.5H0.5Z', role: 'ornament', part: 'rule' };
const grid: Stroke = { d: 'M10,40H190', role: 'ornament', part: 'grid' };
const line: Stroke = { d: 'M10,80C40,60,80,20,190,10', role: 'encoding', part: 'ink' };
const bar = (x: number, tone: 1 | 2 | 3 | 4): Stroke => ({
  d: `M${x},90V40H${x + 20}V90Z`,
  role: 'encoding',
  part: 'ink',
  tone,
});

/** First and last coordinate pair of every subpath. */
function endpoints(d: string): string[] {
  return d
    .split(/(?=M)/)
    .filter((sub) => sub.trim().length > 0)
    .map((sub) => {
      const numbers = sub.match(/-?\d+(?:\.\d+)?/g) ?? [];
      return `${numbers[0]},${numbers[1]}→${numbers.at(-2)},${numbers.at(-1)}`;
    });
}

describe('RoughInker', () => {
  test('REQ-022 · strokes that encode data are returned untouched', () => {
    const inked = RoughInker.ink(geometry([frame, line]), options());
    expect(inked.strokes).toContainEqual(line);
  });

  test('REQ-022 · ornament strokes are inked with preserveVertices: their endpoints do not move', () => {
    const inked = RoughInker.ink(geometry([grid]), options());
    const [stroke] = inked.strokes;
    expect(stroke?.d).not.toBe(grid.d);
    expect(stroke?.role).toBe('ornament');
    for (const subpath of endpoints(stroke?.d ?? '')) expect(subpath).toBe('10,40→190,40');
  });

  test('API §3.2 · the inker never emits a part different from the one it received', () => {
    const input = [frame, grid, line, bar(20, 2)];
    const inked = RoughInker.ink(geometry(input), options());
    const parts = new Set(input.map((stroke) => stroke.part));
    for (const stroke of inked.strokes) expect(parts).toContain(stroke.part);
  });

  test('REQ-005 · the same input and seed ink identically', () => {
    const g = geometry([frame, grid, bar(20, 4)]);
    expect(RoughInker.ink(g, options())).toEqual(RoughInker.ink(g, options()));
  });

  test('REQ-003 · a different seed draws a different hand', () => {
    const g = geometry([grid]);
    expect(RoughInker.ink(g, options({ seed: 1 })).strokes[0]?.d).not.toBe(
      RoughInker.ink(g, options({ seed: 2 })).strokes[0]?.d,
    );
  });

  test.each([0, 1, 2 ** 31 - 1, 2 ** 32 - 1, 2 ** 32 - 2])(
    'REQ-004 · seed %i never lets roughjs fall back to Math.random',
    (seed) => {
      const random = vi.spyOn(Math, 'random');
      const g = geometry([frame, grid, bar(20, 4)]);
      RoughInker.ink(g, options({ seed }));
      RoughInker.ink(g, options({ seed, hatchFill: 'per-shape' }));
      expect(random).not.toHaveBeenCalled();
    },
  );

  test('REQ-002 · every inked coordinate carries at most 2 decimals', () => {
    const inked = RoughInker.ink(geometry([frame, grid, bar(20, 3)]), options());
    const all = [...inked.strokes, ...inked.defs.flatMap((tile) => tile.strokes)].map((s) => s.d).join(' ');
    expect(all).not.toMatch(/\d\.\d{3}/);
  });
});

describe('tile fill', () => {
  test('REQ-029 · shapes of one tonal level share a single tile', () => {
    const inked = RoughInker.ink(geometry([bar(20, 2), bar(60, 2)]), options());
    expect(inked.defs).toHaveLength(1);
    const hatches = inked.strokes.filter((s) => s.role === 'hatch');
    expect(hatches).toHaveLength(2);
    for (const hatch of hatches) {
      expect(hatch).toMatchObject({ paint: 'tile', tile: inked.defs[0]?.id });
    }
  });

  test('REQ-029 · the hatch is laid under the exact outline of its shape', () => {
    const shape = bar(20, 2);
    const inked = RoughInker.ink(geometry([shape]), options());
    const index = inked.strokes.findIndex((s) => s.role === 'hatch');
    expect(inked.strokes[index]?.d).toBe(shape.d);
    expect(inked.strokes[index + 1]).toEqual(shape);
  });

  test('REQ-023 · one tile per tonal level used, built from the ramp gap and angle', () => {
    const inked = RoughInker.ink(geometry([bar(20, 1), bar(60, 3), bar(100, 3)]), options());
    expect(inked.defs.map((tile) => tile.id)).toEqual(['sp-test-a-tone-1', 'sp-test-a-tone-3']);
    for (const tile of inked.defs) {
      const level = Number(tile.id.at(-1)) as 1 | 3;
      const spec = silverpoint.tonalRamp[level];
      expect(tile.angle).toBe(spec.angle);
      expect(tile.height % spec.gap).toBe(0);
      expect(tile.strokes.every((s) => s.role === 'hatch')).toBe(true);
    }
  });

  test('REQ-023 · denser levels carry more lines per tile area', () => {
    const inked = RoughInker.ink(geometry([bar(20, 1), bar(60, 3)]), options());
    const density = inked.defs.map((tile) => tile.strokes.length / tile.height);
    expect(density[1]).toBeGreaterThan(density[0] ?? Number.POSITIVE_INFINITY);
  });

  test('REQ-023 · level 4 crosses a second layer of lines', () => {
    const inked = RoughInker.ink(geometry([bar(20, 3), bar(60, 4)]), options());
    const [three, four] = inked.defs;
    expect(four?.strokes.length).toBe(2 * (three?.strokes.length ?? 0));
    const vertical = four?.strokes.filter((s) => /^M[\d.]+,0/.test(s.d.replace(/ /g, ',')));
    expect(vertical?.length).toBeGreaterThan(0);
  });

  test('REQ-023 · tone is never built with opacity', () => {
    const inked = RoughInker.ink(geometry([bar(20, 4)]), options());
    expect(JSON.stringify(inked)).not.toMatch(/opacity/i);
  });

  test('REQ-030 · two chart instances never share a tile id', () => {
    const g = geometry([bar(20, 2)]);
    const a = RoughInker.ink(g, options({ scope: 'sp-line-chart-a' }));
    const b = RoughInker.ink(g, options({ scope: 'sp-line-chart-b' }));
    expect(a.defs[0]?.id).toMatch(/^sp-line-chart-a-/);
    expect(a.defs[0]?.id).not.toBe(b.defs[0]?.id);
  });

  test("REQ-029 · hatchFill: 'per-shape' hatches each shape on its own, with no tiles", () => {
    const inked = RoughInker.ink(geometry([bar(20, 2), bar(60, 2)]), options({ hatchFill: 'per-shape' }));
    expect(inked.defs).toEqual([]);
    const hatches = inked.strokes.filter((s) => s.role === 'hatch');
    expect(hatches).toHaveLength(2);
    expect(hatches[0]?.d).not.toBe(hatches[1]?.d);
    for (const hatch of hatches) expect(hatch.paint ?? 'stroke').toBe('stroke');
  });

  test('REQ-029 · a shape without a tone is not hatched', () => {
    const inked = RoughInker.ink(geometry([{ ...bar(20, 2), tone: 0 }]), options());
    expect(inked.strokes.filter((s) => s.role === 'hatch')).toEqual([]);
    expect(inked.defs).toEqual([]);
  });
});
