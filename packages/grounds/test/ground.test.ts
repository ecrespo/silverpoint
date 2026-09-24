import { __setDiagnosticSink, type Ground, type SpCode } from '@silverpoint/core';
import { afterEach, describe, expect, test } from 'vitest';
import { registerGround, resolveGround, silverpoint } from '../src';

let restore: () => void = () => {};
afterEach(() => restore());

function capture(): SpCode[] {
  const seen: SpCode[] = [];
  restore = __setDiagnosticSink((code) => seen.push(code));
  return seen;
}

describe('the silverpoint ground', () => {
  test('REQ-040 · is a declarative token object that survives JSON', () => {
    expect(JSON.parse(JSON.stringify(silverpoint))).toEqual(silverpoint);
    expect(silverpoint.name).toBe('silverpoint');
    expect(silverpoint.tonalMechanism).toBe('hatch');
    expect(silverpoint.inker).toBe('rough');
  });

  test('REQ-046 · offers the four prepared substrates of Data Model §3.1', () => {
    expect(silverpoint.substrates).toEqual({
      cream: '#EDE7DA',
      green: '#D8DCD0',
      blue: '#D2D8DF',
      ochre: '#E7DABC',
    });
  });

  test('REQ-040 · carries the verified inks of Data Model §3.2, textMuted resolving to ink', () => {
    expect(silverpoint.ink).toEqual({
      primary: '#5A5E65',
      secondary: '#685C4D',
      heighten: '#FFFFFF',
      rule: '#737A82',
      grid: '#737A82',
      text: '#3F4348',
      textMuted: '#5A5E65',
    });
  });

  test('REQ-023 · builds tone with the hatch ramp of Data Model §3.4', () => {
    expect(silverpoint.tonalRamp).toEqual({
      1: { style: 'hachure', gap: 10, angle: -41 },
      2: { style: 'hachure', gap: 7.5, angle: -41 },
      3: { style: 'hachure', gap: 5.5, angle: -41 },
      4: { style: 'cross-hatch', gap: 5.5, angle: -41 },
    });
  });

  test('REQ-040 · inking parameters follow Data Model §3.5', () => {
    expect(silverpoint.inkOptions).toEqual({
      roughness: 0.45,
      bowing: 0.6,
      hatchAngle: -41,
      hatchGap: 7,
      fillWeight: 0.55,
    });
    expect(silverpoint.maxHatchDensity).toBe(4);
    expect(silverpoint.domainPadding).toBe(0.1);
    expect(silverpoint.typography).toEqual({
      display: "'EB Garamond', 'Iowan Old Style', Georgia, serif",
      scale: 1,
    });
  });

  test('I-9 · the ground is frozen at runtime', () => {
    expect(Object.isFrozen(silverpoint)).toBe(true);
    expect(Object.isFrozen(silverpoint.ink)).toBe(true);
    expect(Object.isFrozen(silverpoint.tonalRamp[4])).toBe(true);
  });
});

describe('ground registry', () => {
  test('REQ-045 · an unknown ground name falls back to silverpoint and emits SP007', () => {
    const seen = capture();
    expect(resolveGround('verdigris', 'LineChart')).toBe(silverpoint);
    expect(seen).toEqual(['SP007']);
  });

  test('REQ-040 · registerGround registers a declarative ground by name', () => {
    const seen = capture();
    const burin: Ground = { ...silverpoint, name: 'burin-test', substrates: { white: '#FFFFFF' } };
    registerGround(burin);
    expect(resolveGround('burin-test', 'LineChart')).toBe(burin);
    expect(seen).toEqual([]);
  });

  test('REQ-040 · a complete ground object is used as given', () => {
    const inline: Ground = { ...silverpoint, name: 'inline' };
    expect(resolveGround(inline, 'LineChart')).toBe(inline);
  });

  test('REQ-045 · silverpoint resolves without a warning', () => {
    const seen = capture();
    expect(resolveGround('silverpoint', 'LineChart')).toBe(silverpoint);
    expect(seen).toEqual([]);
  });
});
