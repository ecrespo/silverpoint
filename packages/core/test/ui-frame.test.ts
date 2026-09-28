import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, fnv1a32, type SpCode } from '../src';
import {
  UI_COMPONENTS,
  UI_FRAME_KINDS,
  uiFrameOutline,
  uiFrameVariant,
  uiItems,
  uiRateCount,
  uiRequireName,
  uiSteps,
  uiValue,
  type UiFrameKind,
} from '../src/ui';
import { UI_DEMOS } from '../src/ui-demos';

let restore: () => void = () => {};
afterEach(() => restore());

function capture(): Array<{ code: SpCode; message: string }> {
  const seen: Array<{ code: SpCode; message: string }> = [];
  restore = __setDiagnosticSink((code, message) => seen.push({ code, message }));
  return seen;
}

describe('uiFrameVariant (T-138)', () => {
  test('REQ-307 · I-21 · without seed and id the variant is 0', () => {
    expect(uiFrameVariant(undefined, undefined, 4)).toBe(0);
    expect(uiFrameVariant(undefined, '', 4)).toBe(0);
  });

  test('REQ-307 · from the id by the chart seed rule (FNV-1a), and the seed overrides the id', () => {
    expect(uiFrameVariant(undefined, 'revenue', 4)).toBe(fnv1a32('revenue') % 4);
    expect(uiFrameVariant('paper', 'revenue', 4)).toBe(fnv1a32('paper') % 4);
    expect(uiFrameVariant(7, 'revenue', 4)).toBe(3);
  });

  test('REQ-307 · I-21 · pure, an integer in 0..variants-1, and every variant is reachable', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const id = `button-${i}`;
      const v = uiFrameVariant(undefined, id, 4);
      expect(uiFrameVariant(undefined, id, 4)).toBe(v);
      expect(Number.isInteger(v) && v >= 0 && v < 4).toBe(true);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });

  test('REQ-307 · a variant count below 1 or not an integer is read as 1..6, so the result stays in range', () => {
    expect(uiFrameVariant(undefined, 'revenue', 1)).toBe(0);
    expect(uiFrameVariant(undefined, 'revenue', 0)).toBe(0);
    expect(uiFrameVariant(undefined, 'revenue', Number.NaN)).toBe(0);
    expect(uiFrameVariant(5, undefined, 40)).toBe(5 % 6);
  });
});

describe('uiFrameOutline (T-138)', () => {
  const kinds = Object.keys(UI_FRAME_KINDS) as UiFrameKind[];

  test('REQ-305 · five frame kinds, each a square box cut into slices that meet or leave a centre', () => {
    expect(kinds).toEqual(['control', 'pill', 'box', 'card', 'round']);
    for (const kind of kinds) {
      const { size, slice, radius } = UI_FRAME_KINDS[kind];
      expect(size).toBeGreaterThanOrEqual(2 * slice);
      expect(radius).toBeLessThanOrEqual(slice);
    }
  });

  test('REQ-304 · the outline is one closed ornament stroke — the only kind of stroke an inker may touch', () => {
    for (const kind of kinds) {
      const geometry = uiFrameOutline(kind);
      const { size } = UI_FRAME_KINDS[kind];
      expect(geometry.viewBox).toEqual({ x: 0, y: 0, width: size, height: size });
      expect(geometry.strokes).toHaveLength(1);
      expect(geometry.strokes[0]).toMatchObject({ role: 'ornament', part: 'ink' });
      expect(geometry.strokes[0]?.d.endsWith('Z')).toBe(true);
      expect(geometry.hitAreas).toEqual([]);
    }
  });

  test('REQ-304 · the control outline is the exact rounded rectangle inset by half a hairline', () => {
    expect(uiFrameOutline('control').strokes[0]?.d).toBe(
      'M2.5,0.5H21.5A2,2,0,0,1,23.5,2.5V21.5A2,2,0,0,1,21.5,23.5H2.5A2,2,0,0,1,0.5,21.5V2.5A2,2,0,0,1,2.5,0.5Z',
    );
  });

  test('REQ-302 · every vertex carries at most 2 decimals and lies inside the box', () => {
    for (const kind of kinds) {
      const { size } = UI_FRAME_KINDS[kind];
      const d = uiFrameOutline(kind).strokes[0]?.d ?? '';
      for (const n of d.match(/-?\d+(?:\.\d+)?/g) ?? []) {
        expect(n).toMatch(/^-?\d+(?:\.\d{1,2})?$/);
        expect(Number(n)).toBeGreaterThanOrEqual(0);
        expect(Number(n)).toBeLessThanOrEqual(size);
      }
    }
  });

  test('REQ-305 · round is a circle; pill has semicircular ends', () => {
    expect(uiFrameOutline('round').strokes[0]?.d).toBe('M12,0.5H12A11.5,11.5,0,0,1,23.5,12V12A11.5,11.5,0,0,1,12,23.5H12A11.5,11.5,0,0,1,0.5,12V12A11.5,11.5,0,0,1,12,0.5Z');
    expect(uiFrameOutline('pill').strokes[0]?.d).toContain('A12,12,0,0,1');
  });
});

describe('uiItems (T-138)', () => {
  test('REQ-325 · items sharing a key keep the first, skip the later ones, and warn SP019 without throwing', () => {
    const seen = capture();
    const items = [
      { key: 'day', label: 'Day' },
      { key: 'week', label: 'Week' },
      { key: 'day', label: 'Day again' },
    ];
    expect(uiItems(items, 'Segmented')).toEqual(items.slice(0, 2));
    expect(seen.map((s) => s.code)).toEqual(['SP019']);
    expect(seen[0]?.message).toMatch(/^\[SP019\] Segmented: .*`items`.*"day".*\(REQ-325\)$/);
  });

  test('REQ-325 · an empty key is skipped and warned as well', () => {
    const seen = capture();
    expect(uiItems([{ key: '', label: 'Nameless' }, { key: 'a', label: 'A' }], 'Tabs')).toEqual([{ key: 'a', label: 'A' }]);
    expect(seen.map((s) => s.code)).toEqual(['SP019']);
  });

  test('REQ-325 · unique keys pass through untouched and silent', () => {
    const seen = capture();
    const items = [{ key: 'a', label: 'A' }];
    expect(uiItems(items, 'Tabs')).toEqual(items);
    expect(seen).toEqual([]);
  });
});

describe('uiRequireName (T-138)', () => {
  test('REQ-319 · no text and no label warns SP018', () => {
    const seen = capture();
    uiRequireName('SpButton', undefined, undefined);
    uiRequireName('SpBadge', '   ', '');
    expect(seen.map((s) => s.code)).toEqual(['SP018', 'SP018']);
    expect(seen[0]?.message).toMatch(/^\[SP018\] SpButton: .*`label`.*\(REQ-319\)$/);
  });

  test('REQ-319 · text content or a label is a name, and is silent', () => {
    const seen = capture();
    uiRequireName('SpButton', 'Delete', undefined);
    uiRequireName('SpButton', undefined, 'Close');
    expect(seen).toEqual([]);
  });
});

describe('UI_DEMOS (T-138)', () => {
  test('REQ-300 · one entry per catalog component, one per declared state: 45', () => {
    expect(Object.keys(UI_DEMOS)).toEqual(UI_COMPONENTS.map((c) => c.slug));
    for (const c of UI_COMPONENTS) expect(Object.keys(UI_DEMOS[c.slug] ?? {})).toEqual(c.states);
    expect(Object.values(UI_DEMOS).flatMap((states) => Object.keys(states))).toHaveLength(45);
  });

  test('REQ-329 · every demo state carries its own stable id, `<slug>--<state>`', () => {
    for (const [slug, states] of Object.entries(UI_DEMOS)) {
      for (const [state, props] of Object.entries(states)) expect(props.id).toBe(`${slug}--${state}`);
    }
  });

  test('REQ-300 · the demos are plain data, deep-frozen (I-9 extended)', () => {
    const walk = (value: unknown): void => {
      if (value === null || typeof value !== 'object') {
        expect(typeof value).not.toBe('function');
        return;
      }
      expect(Object.isFrozen(value)).toBe(true);
      Object.values(value).forEach(walk);
    };
    walk(UI_DEMOS);
    expect(JSON.parse(JSON.stringify(UI_DEMOS))).toEqual(UI_DEMOS);
  });

  test('REQ-324 · REQ-325 · REQ-319 · every demo is valid as given: no value corrected, no key repeated, every name present', () => {
    const seen = capture();
    for (const [slug, states] of Object.entries(UI_DEMOS)) {
      for (const props of Object.values(states)) {
        const p = props as Record<string, unknown>;
        if (Array.isArray(p.items)) uiItems(p.items as { key: string }[], slug);
        if (slug === 'slider') expect(uiValue(p.value as number, { min: 0, max: 100, step: 1 }, slug).corrected).toBe(false);
        if (slug === 'rate') expect(p.value as number).toBeLessThanOrEqual(uiRateCount(p.count as number | undefined, slug));
        if (slug === 'progress' && p.value !== undefined) expect(uiValue(p.value as number, { min: 0, max: 100 }, slug).corrected).toBe(false);
        if (slug === 'steps') uiSteps(p.items as never, p.current as number, slug);
        if (slug === 'button' || slug === 'badge') uiRequireName(slug, p.content as string | undefined, p.label as string | undefined);
      }
    }
    expect(seen).toEqual([]);
  });

  test('C-1 · C-5 · the concept states are demoed: an invalid Input with its message, text-only Cards', () => {
    expect(UI_DEMOS.input?.invalid).toMatchObject({ invalid: true, message: 'Required: pick a city' });
    for (const props of Object.values(UI_DEMOS.card ?? {})) expect(JSON.stringify(props)).not.toMatch(/Chart/);
    expect(UI_DEMOS.button?.danger).toMatchObject({ variant: 'danger' });
  });
});
