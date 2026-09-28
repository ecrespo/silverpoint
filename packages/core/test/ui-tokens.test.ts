import { describe, expect, test } from 'vitest';
import type { Ground } from '../src';
import { resolveUiTokens, UI_TOKEN_DEFAULTS } from '../src/ui';

/** A consumer's ground, registered before `ui` tokens existed: it has no `ui` section. */
const consumer = {
  name: 'burin',
  tonalMechanism: 'hatch',
  inker: 'rough',
  substrates: { paper: '#F2EFE8' },
  ink: { primary: '#333333', secondary: '#444444', heighten: '#FFFFFF', rule: '#555555', grid: '#555555', text: '#222222', textMuted: '#333333' },
  inkOptions: { roughness: 0.4, bowing: 0.5, hatchAngle: -45, hatchGap: 6, fillWeight: 0.5 },
  maxHatchDensity: 4,
  tonalRamp: {
    1: { style: 'hachure', gap: 10, angle: -45 },
    2: { style: 'hachure', gap: 8, angle: -45 },
    3: { style: 'hachure', gap: 6, angle: -45 },
    4: { style: 'cross-hatch', gap: 6, angle: -45 },
  },
  typography: { display: 'serif', scale: 1 },
  emptyState: { text: 'No data', rule: true },
  domainPadding: 0.1,
} satisfies Ground;

describe('resolveUiTokens (T-139)', () => {
  test('REQ-312 · a ground without a `ui` section takes the defaults of Data Model §3.8', () => {
    expect(resolveUiTokens(consumer)).toEqual({
      frame: 'css',
      frameVariants: 1,
      controlHeight: { sm: 24, md: 32, lg: 40 },
      radius: 2,
      focusWidth: 2,
      tone: { selected: 3, primary: 2, danger: 4, disabled: 1, alertError: 1 },
    });
    expect(resolveUiTokens(consumer)).toEqual(UI_TOKEN_DEFAULTS);
    expect(Object.isFrozen(UI_TOKEN_DEFAULTS)).toBe(true);
  });

  test('REQ-312 · a ground\'s own `ui` section is taken as given when it is within its domain', () => {
    const ui = { ...UI_TOKEN_DEFAULTS, frame: 'inked', frameVariants: 4, controlHeight: { sm: 28, md: 36, lg: 44 } } as const;
    expect(resolveUiTokens({ ...consumer, ui })).toEqual(ui);
  });

  test('REQ-317 · REQ-316 · heights under 24 px, a focus under 2 px and variants outside 1..6 are held to their domain', () => {
    const ui = { ...UI_TOKEN_DEFAULTS, frame: 'inked', frameVariants: 9, focusWidth: 1, controlHeight: { sm: 18, md: 32, lg: 40 } };
    expect(resolveUiTokens({ ...consumer, ui })).toMatchObject({ frameVariants: 6, focusWidth: 2, controlHeight: { sm: 24, md: 32, lg: 40 } });
    expect(resolveUiTokens({ ...consumer, ui: { ...UI_TOKEN_DEFAULTS, frame: 'inked', frameVariants: 0 } }).frameVariants).toBe(1);
  });

  test('REQ-312 · a weight ground cannot ink a frame: it always gets the exact css frame', () => {
    const weight = { ...consumer, tonalMechanism: 'weight', ui: { ...UI_TOKEN_DEFAULTS, frame: 'inked', frameVariants: 4 } } as const;
    expect(resolveUiTokens(weight)).toMatchObject({ frame: 'css', frameVariants: 1 });
  });
});
