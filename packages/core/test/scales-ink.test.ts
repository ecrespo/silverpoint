import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, test } from 'vitest';
import {
  __setDiagnosticSink,
  bandScale,
  enforceHeightening,
  extent,
  linearScale,
  max,
  min,
  NullInker,
  resolveConfig,
  resolveInker,
  SilverpointError,
  type Geometry,
  type Inker,
  type InkOptions,
  type SpCode,
} from '../src';

let restore: () => void = () => {};
afterEach(() => restore());

function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

const options: InkOptions = {
  seed: 1,
  roughness: 0.45,
  bowing: 0.6,
  hatchAngle: -41,
  hatchGap: 7,
  fillWeight: 0.55,
  nodeBudget: 1000,
};

const box = { x: 0, y: 0, width: 10, height: 10 };
const geometry: Geometry = {
  viewBox: box,
  plot: box,
  strokes: [{ d: 'M0,0L10,10', role: 'encoding', part: 'ink' }],
  labels: [],
  hitAreas: [],
  defs: [],
};

describe('scale engine', () => {
  test('REQ-001 · the core imports and runs under Node with no DOM', () => {
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
    expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined');
    const scale = linearScale([0, 10], [0, 100], { chart: 'Test', property: 'v', padding: 0.1 });
    expect(scale(5)).toBe(50);
  });

  test('REQ-001 · own extent, min and max ignore non-finite values', () => {
    expect(extent([3, Number.NaN, 1, 7])).toEqual([1, 7]);
    expect(min([Number.POSITIVE_INFINITY, 2])).toBe(2);
    expect(max([])).toBeUndefined();
  });

  test('REQ-001 · band scale centres values in their band', () => {
    const band = bandScale(['a', 'b'], [0, 100]);
    expect(band.bandwidth).toBe(50);
    expect(band.center('b')).toBe(75);
    expect(band('z')).toBeUndefined();
  });

  test('REQ-010 · a [5,5] domain yields a usable range and emits SP004', () => {
    const seen = capture();
    const scale = linearScale([5, 5], [100, 0], { chart: 'Test', property: 'v', padding: 0.1 });
    expect(scale.domain).toEqual([4.5, 5.5]);
    expect(Number.isFinite(scale(5))).toBe(true);
    expect(scale(5)).toBe(50);
    expect(seen).toEqual(['SP004']);
  });

  test('REQ-010 · a [0,0] domain expands around zero', () => {
    capture();
    const scale = linearScale([0, 0], [0, 1], { chart: 'Test', property: 'v', padding: 0.1 });
    expect(scale.domain).toEqual([-0.1, 0.1]);
  });
});

describe('Inker', () => {
  test('REQ-020 · an Inker takes geometry and returns geometry', () => {
    const inker: Inker = { name: 'identity', ink: (g) => g };
    expect(inker.ink(geometry, options)).toBe(geometry);
  });

  test('REQ-021 · NullInker returns the geometry unaltered and uncopied', () => {
    const inked = NullInker.ink(geometry, options);
    expect(inked).toBe(geometry);
    expect(inked).toEqual(geometry);
  });

  test('REQ-026 · an unregistered inker name falls back to NullInker and emits SP006', () => {
    const seen = capture();
    expect(resolveInker('nonexistent', 'LineChart')).toBe(NullInker);
    expect(seen).toEqual(['SP006']);
  });

  test('REQ-026 · builtin inkers resolve without warnings', () => {
    const seen = capture();
    const rough: Inker = { name: 'rough', ink: (g) => g };
    expect(resolveInker('rough', 'LineChart', [rough])).toBe(rough);
    expect(seen).toEqual([]);
  });

  test('REQ-162 · packages/core declares only allowlisted runtime dependencies', () => {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    const allowlist = ['d3-scale', 'd3-shape', 'd3-chord'];
    for (const name of Object.keys(manifest.dependencies ?? {})) expect(allowlist).toContain(name);
    expect(manifest.dependencies ?? {}).not.toHaveProperty('roughjs');
  });
});

describe('heightening', () => {
  const circle = 'M0,5A5,5,0,1,0,10,5A5,5,0,1,0,0,5Z';
  const other = 'M20,5A5,5,0,1,0,30,5A5,5,0,1,0,20,5Z';

  test('REQ-031 · a heightened element without an outline receives one in the main ink', () => {
    const result = enforceHeightening(
      { ...geometry, strokes: [{ d: circle, role: 'encoding', part: 'heighten', paint: 'fill' }] },
      'Test',
    );
    expect(result.strokes).toEqual([
      { d: circle, role: 'encoding', part: 'heighten', paint: 'fill' },
      { d: circle, role: 'encoding', part: 'ink', paint: 'stroke' },
    ]);
  });

  test('REQ-025 · two heightened elements throw in development', () => {
    capture();
    const doubled: Geometry = {
      ...geometry,
      strokes: [
        { d: circle, role: 'encoding', part: 'heighten', paint: 'fill' },
        { d: other, role: 'encoding', part: 'heighten', paint: 'fill' },
      ],
    };
    expect(() => enforceHeightening(doubled, 'Test')).toThrow(SilverpointError);
    expect(() => enforceHeightening(doubled, 'Test')).toThrow(/SP005/);
  });

  test('REQ-024 · in production only the first heightened element is applied', () => {
    const doubled: Geometry = {
      ...geometry,
      strokes: [
        { d: circle, role: 'encoding', part: 'heighten', paint: 'fill' },
        { d: other, role: 'encoding', part: 'heighten', paint: 'fill' },
      ],
    };
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const result = enforceHeightening(doubled, 'Test');
      expect(result.strokes.filter((s) => s.part === 'heighten').map((s) => s.d)).toEqual([circle]);
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});

describe('configuration', () => {
  test('REQ-123 · a media query forcing precision wins over the prop', () => {
    expect(resolveConfig({ mode: 'ink' }, { mode: 'ink' }, { forcedPrecision: true }).mode).toBe('precision');
    expect(resolveConfig({ mode: 'precision' }, { mode: 'ink' }).mode).toBe('precision');
    expect(resolveConfig({}, { mode: 'precision' }).mode).toBe('precision');
    expect(resolveConfig({}).mode).toBe('ink');
  });

  test('REQ-094 · defaults follow API Spec §5.1', () => {
    expect(resolveConfig({})).toEqual({
      ground: 'silverpoint',
      substrate: 'cream',
      mode: 'ink',
      chrome: 'card',
      hatchFill: 'tile',
      height: 160,
      dataTable: 'hidden',
      locale: 'en',
    });
  });
});
