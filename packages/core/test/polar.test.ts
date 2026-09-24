import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, type SpCode } from '../src';
import { arcPath, checkSectors, pointAt, polarFrame, polarLabel, readSectors, sectorPath, SECTORS_PER_CHART } from '../src/charts/shared/polar';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): { code: SpCode; message: string }[] {
  const seen: { code: SpCode; message: string }[] = [];
  restore = __setDiagnosticSink((code, message) => seen.push({ code, message }));
  return seen;
}

const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1e-9);
const frame = polarFrame({ x: 0, y: 0, width: 200, height: 120 });

describe('polar frame (T-071)', () => {
  test('REQ-075 · the circle is centred in the area and fits its shorter side, inset', () => {
    expect(frame.cx).toBe(100);
    expect(frame.cy).toBe(60);
    expect(frame.radius).toBe(60 - 6);
  });

  test('REQ-075 · angles run clockwise from 12 o’clock, in radians', () => {
    const r = 10;
    const top = pointAt(frame, 0, r);
    close(top.x, 100);
    close(top.y, 50);
    const right = pointAt(frame, Math.PI / 2, r);
    close(right.x, 110);
    close(right.y, 60);
    const bottom = pointAt(frame, Math.PI, r);
    close(bottom.y, 70);
  });

  test('REQ-075 · a sector is a closed ring slice: outer arc out, inner arc back', () => {
    const d = sectorPath(frame, { inner: 20, outer: 40, start: 0, end: Math.PI / 2 });
    expect(d).toBe('M100,20A40,40,0,0,1,140,60L120,60A20,20,0,0,0,100,40Z');
  });

  test('REQ-075 · a sector with no hole is a wedge from the centre', () => {
    expect(sectorPath(frame, { inner: 0, outer: 40, start: 0, end: Math.PI / 2 })).toBe('M100,20A40,40,0,0,1,140,60L100,60Z');
  });

  test('REQ-075 · a sweep past 180° sets the large-arc flag', () => {
    expect(sectorPath(frame, { inner: 0, outer: 40, start: 0, end: (3 * Math.PI) / 2 })).toContain('A40,40,0,1,1');
  });

  test('REQ-079 · a full turn is drawn as two half arcs, never as a degenerate arc', () => {
    const d = sectorPath(frame, { inner: 20, outer: 40, start: 0, end: 2 * Math.PI });
    expect(d.match(/A40,40/g)).toHaveLength(2);
    expect(d.match(/A20,20/g)).toHaveLength(2);
    expect(d).not.toContain('NaN');
  });

  test('REQ-078 · an open arc runs along one radius', () => {
    expect(arcPath(frame, 40, -Math.PI / 2, Math.PI / 2)).toBe('M60,60A40,40,0,0,1,140,60');
  });

  test('REQ-075 · an empty sweep draws nothing', () => {
    expect(sectorPath(frame, { inner: 0, outer: 40, start: 1, end: 1 })).toBe('');
    expect(arcPath(frame, 40, 1, 1)).toBe('');
  });

  test('REQ-075 · a label is anchored away from the circle: start on the right, end on the left, middle at the poles', () => {
    expect(polarLabel(frame, Math.PI / 2, 50, 'E').anchor).toBe('start');
    expect(polarLabel(frame, -Math.PI / 2, 50, 'W').anchor).toBe('end');
    expect(polarLabel(frame, 0, 50, 'N').anchor).toBe('middle');
    expect(polarLabel(frame, Math.PI, 50, 'S').anchor).toBe('middle');
  });
});

describe('sector series (Data Model §2.2)', () => {
  test('REQ-008 · negative and non-finite values are warned SP002 and dropped', () => {
    const seen = capture();
    const data = [{ name: 'a', value: 3 }, { name: 'b', value: -1 }, { name: 'c', value: Number.NaN }, { name: 'd', value: 0 }];
    const sectors = readSectors(data, 'name', 'value', 'DonutChart', 'en');
    expect(sectors.map((s) => s.name)).toEqual(['a', 'd']);
    expect(sectors.map((s) => s.index)).toEqual([0, 3]);
    expect(seen.filter((d) => d.code === 'SP002')).toHaveLength(2);
  });

  test('REQ-075 · a numeric name reads in the chart’s locale, without grouping', () => {
    capture();
    expect(readSectors([{ name: 1234.5, value: 1 }], 'name', 'value', 'DonutChart', 'de')[0]?.name).toBe('1234,5');
  });

  test('REQ-008 · a repeated name is made unique and warned', () => {
    const seen = capture();
    const sectors = readSectors([{ name: 'a', value: 1 }, { name: 'a', value: 2 }], 'name', 'value', 'DonutChart', 'en');
    expect(sectors.map((s) => s.name)).toEqual(['a', 'a (2)']);
    expect(seen.map((d) => d.code)).toEqual(['SP002']);
  });

  test('REQ-096 · above 60 sectors SP008 is warned once; at 60 it is not', () => {
    const seen = capture();
    expect(SECTORS_PER_CHART).toBe(60);
    checkSectors('DonutChart', 'value', 60);
    expect(seen).toEqual([]);
    checkSectors('DonutChart', 'value', 61);
    expect(seen.map((d) => d.code)).toEqual(['SP008']);
  });
});
