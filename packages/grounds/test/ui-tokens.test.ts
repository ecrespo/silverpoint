import { resolveUiTokens } from '@silverpoint/core/ui';
import { describe, expect, test } from 'vitest';
import { cyanotype, silverpoint } from '../src';

describe('ui tokens of the built-in grounds (T-139)', () => {
  test('REQ-312 · silverpoint declares the ui tokens of Data Model §3.8', () => {
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

  test('REQ-312 · both are in their domain, so resolving them changes nothing', () => {
    expect(resolveUiTokens(silverpoint)).toEqual(silverpoint.ui);
    expect(resolveUiTokens(cyanotype)).toEqual(cyanotype.ui);
  });

  test('REQ-312 · the tokens are frozen with the ground (Art. 7)', () => {
    expect(Object.isFrozen(silverpoint.ui)).toBe(true);
    expect(Object.isFrozen(silverpoint.ui?.controlHeight)).toBe(true);
  });
});
