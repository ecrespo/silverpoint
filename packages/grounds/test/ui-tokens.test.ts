import { resolveUiTokens } from '@silverpoint/core/ui';
import { describe, expect, test } from 'vitest';
import { cyanotype, silverpoint } from '../src';

describe('ui tokens of the built-in grounds (T-139)', () => {
  test('REQ-312 · silverpoint declares the ui tokens of Data Model §3.8, its 0.3.0 section unchanged', () => {
    expect(silverpoint.ui).toEqual({
      frame: 'inked',
      frameVariants: 4,
      controlHeight: { sm: 24, md: 32, lg: 40 },
      radius: 2,
      focusWidth: 2,
      tone: { selected: 3, primary: 2, danger: 4, disabled: 1, alertError: 1 },
    });
  });

  test('REQ-312 · cyanotype declares an exact css frame and one variant: a contact print is not inked', () => {
    expect(cyanotype.ui).toMatchObject({ frame: 'css', frameVariants: 1, focusWidth: 2, radius: 2 });
    expect(cyanotype.ui?.tone).toEqual(silverpoint.ui?.tone);
  });

  test('REQ-044 · REQ-312 · neither declares feature-004\'s backdrop and row tone: both take the core\'s levels 2 and 1, unchanged', () => {
    // Data Model delta §3.8 (T-209, REQ-499, REQ-475): a ground written before feature-004 needs no change.
    for (const ground of [silverpoint, cyanotype]) {
      expect(ground.ui).not.toHaveProperty('backdrop');
      expect(ground.ui).not.toHaveProperty('rowTone');
      expect(resolveUiTokens(ground)).toEqual({ ...ground.ui, backdrop: 2, rowTone: 1 });
    }
  });

  test('REQ-312 · the tokens are frozen with the ground (Art. 7)', () => {
    expect(Object.isFrozen(silverpoint.ui)).toBe(true);
    expect(Object.isFrozen(silverpoint.ui?.controlHeight)).toBe(true);
  });
});
