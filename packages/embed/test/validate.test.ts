/** T-292 · `validateSpec` (REQ-630, REQ-631; I-54). */
import { createPrng } from '@silverpoint/core';
import { describe, expect, test } from 'vitest';
import { validateSpec } from '../src/index';

const error = (input: unknown) => {
  const result = validateSpec(input);
  return result.ok ? null : result.error;
};

describe('validateSpec', () => {
  test('REQ-630 · a spec with every field is accepted and returned as given', () => {
    const spec = { chart: 'bar-chart', data: [{ x: 'A', value: 1 }], props: { title: 'T', orientation: 'rows' }, width: 480, height: 240, id: 'a', ground: 'silverpoint', substrate: 'cream', mode: 'ink', palette: 'sepia' };
    expect(validateSpec(spec)).toEqual({ ok: true, value: spec, diagnostics: [] });
  });

  test('REQ-630 · a JSON string and the parsed value give the same result', () => {
    const spec = { chart: 'line-chart', props: { title: 'Hits' } };
    expect(validateSpec(JSON.stringify(spec))).toEqual(validateSpec(spec));
  });

  test('REQ-631 · kind json: text that does not parse', () => {
    expect(error('{"chart": ')).toMatchObject({ kind: 'json' });
  });

  test.each([
    ['an array', [1]],
    ['a number', 3],
    ['null', null],
    ['no chart', {}],
    ['an unknown field', { chart: 'bar-chart', colour: 'red' }],
    ['props not an object', { chart: 'bar-chart', props: [] }],
    ['a field repeated in props', { chart: 'bar-chart', props: { width: 400 } }],
    ['a bad id', { chart: 'bar-chart', id: 'a b' }],
    ['a bad mode', { chart: 'bar-chart', mode: 'pencil' }],
    ['an unknown palette preset', { chart: 'bar-chart', palette: 'neon' }],
    ['width not a number', { chart: 'bar-chart', width: '480' }],
  ])('REQ-631 · kind shape: %s', (_name, input) => {
    expect(error(input)).toMatchObject({ kind: 'shape' });
  });

  test('REQ-631 · kind chart: an unknown slug, with the closest slugs', () => {
    expect(error({ chart: 'bar-chrt' })).toEqual({ kind: 'chart', chart: 'bar-chrt', suggestions: ['bar-chart'] });
  });

  test('REQ-631 · kind prop: the undeclared props', () => {
    expect(error({ chart: 'bar-chart', props: { xKey: 'x', colour: 'red', size: 2 } })).toEqual({ kind: 'prop', props: ['colour', 'size'] });
  });

  test('REQ-631 · common chart props, seed and hatchFill included, are declared for every chart', () => {
    expect(validateSpec({ chart: 'donut-chart', props: { title: 'x', seed: 4, hatchFill: 'tile', dataTable: 'visible' } }).ok).toBe(true);
  });

  test.each([
    [159, undefined, { kind: 'size', width: 159 }],
    [1601, undefined, { kind: 'size', width: 1601 }],
    [undefined, 89, { kind: 'size', height: 89 }],
    [undefined, 1201, { kind: 'size', height: 1201 }],
    [100, 2000, { kind: 'size', width: 100, height: 2000 }],
  ])('REQ-631 · kind size: width %s, height %s (160..1600 × 90..1200)', (width, height, expected) => {
    expect(error({ chart: 'bar-chart', width, height })).toEqual(expected);
  });

  test('REQ-631 · the bounds themselves are accepted', () => {
    expect(validateSpec({ chart: 'bar-chart', width: 160, height: 90 }).ok).toBe(true);
    expect(validateSpec({ chart: 'bar-chart', width: 1600, height: 1200 }).ok).toBe(true);
  });

  test('REQ-631 · a palette object is accepted', () => {
    expect(validateSpec({ chart: 'bar-chart', palette: { ink: '#222222' } }).ok).toBe(true);
  });

  test('I-54 · total: 10 000 seeded arbitrary JSON values never throw and always answer', () => {
    const random = createPrng(20261120);
    const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
    const keys = ['chart', 'data', 'props', 'width', 'height', 'id', 'ground', 'substrate', 'mode', 'palette', 'x', '__proto__', 'constructor'];
    const value = (depth: number): unknown => {
      const kind = Math.floor(random() * (depth > 3 ? 5 : 8));
      switch (kind) {
        case 0: return null;
        case 1: return random() < 0.5;
        case 2: return pick([0, -1, 1e9, 159, 480, 1601, Number.NaN, 0.5]);
        case 3: return pick(['', 'bar-chart', 'ink', 'sepia', 'a b', '{', '</script>', '\u2028']);
        case 4: return pick(['bar-chart', 'line-chart', 'nope']);
        case 5: return Array.from({ length: Math.floor(random() * 4) }, () => value(depth + 1));
        default: return Object.fromEntries(Array.from({ length: Math.floor(random() * 5) }, () => [pick(keys), value(depth + 1)]));
      }
    };
    for (let i = 0; i < 10_000; i++) {
      const input = value(0);
      const asText = random() < 0.3 ? JSON.stringify(input) ?? 'undefined' : input;
      let result;
      expect(() => (result = validateSpec(asText))).not.toThrow();
      expect(result).toHaveProperty('ok');
      expect(result).toHaveProperty('diagnostics');
    }
  });
});
