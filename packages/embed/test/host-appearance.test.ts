/** T-307 · `hostAppearance` selects among declared grounds; it never tints (REQ-648, DD-071). */
import { listGrounds } from '@silverpoint/grounds';
import { describe, expect, test } from 'vitest';
import { hostAppearance } from '../src/client/appearance';

describe('hostAppearance', () => {
  test.each([
    [{ background: '#ffffff' }, { ground: 'silverpoint', substrate: 'cream', mode: 'ink' }],
    [{ background: '#EDE7DA', foreground: '#333333' }, { ground: 'silverpoint', substrate: 'cream', mode: 'ink' }],
    [{ background: '#0b1f3a' }, { ground: 'cyanotype', substrate: 'prussian', mode: 'ink' }],
    [{ background: 'rgb(20, 20, 20)' }, { ground: 'cyanotype', substrate: 'prussian', mode: 'ink' }],
    [{ background: '#ffffff', highContrast: true }, { ground: 'silverpoint', substrate: 'cream', mode: 'precision' }],
  ])('REQ-648 · %o → %o', (input, expected) => {
    expect(hostAppearance(input)).toEqual(expected);
  });

  test('DD-071 · whatever the colours, the answer is a declared ground and one of its substrates', () => {
    const declared = new Map(listGrounds().map((g) => [g.name, Object.keys(g.substrates)]));
    for (let v = 0; v < 256; v += 17) {
      const hex = `#${v.toString(16).padStart(2, '0').repeat(3)}`;
      const answer = hostAppearance({ background: hex });
      expect(declared.get(answer.ground)).toContain(answer.substrate);
    }
  });

  test('an unreadable colour falls back to the default ground', () => {
    expect(hostAppearance({ background: 'not-a-colour' })).toEqual({ ground: 'silverpoint', substrate: 'cream', mode: 'ink' });
  });
});
