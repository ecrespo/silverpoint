/**
 * Outer test of step 11c (tdd-plan §2): over the PR matrix, the nodes `mount` builds serialise,
 * normalised, to the canonical chart root for the same spec (I-56, REQ-636).
 */
import { toChartRootString } from '@silverpoint/grounds';
import { describe, expect, test } from 'vitest';
import { join } from 'node:path';
import { compareChartRoot } from '../../../../tools/svg-normalizer/normalize';
import { mount } from '../../src/client/index';
import { renderSpec } from '../../src/index';
import { host } from './helpers';

describe('client tree parity (I-56)', () => {
  test('REQ-636 · every PR fixture mounted equals its canonical chart root', { timeout: 120_000 }, async () => {
    const { chartFixtures, specOfFixture } = await import('../../../../tools/visual-gate/embed-fixtures');
    const dir = join(process.cwd(), 'fixtures');
    const fixtures = chartFixtures(dir, 'pr');
    expect(fixtures.length).toBeGreaterThan(300);
    const differ: string[] = [];
    for (const fixture of fixtures) {
      const spec = specOfFixture(fixture, dir)!;
      const target = host();
      const handle = mount(target, spec, { styles: 'none' });
      const reference = renderSpec(spec);
      if (!reference.ok) throw new Error(fixture.id);
      const comparison = compareChartRoot(target.innerHTML, toChartRootString(reference.value));
      if (!comparison.equal) differ.push(`${fixture.id}: ${comparison.difference}`);
      handle.destroy();
    }
    expect(differ.slice(0, 5)).toEqual([]);
  });
});
