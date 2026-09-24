import { describe, expect, test } from 'vitest';
import { DEMO_PROPS, FIXTURES, fixtureById, fixtureProps as harnessProps } from '../../examples/harness/index.js';
import { fixtureProps, loadFixtures } from './fixtures';

describe('example harness', () => {
  test('REQ-182 · the harness carries exactly the declared fixture matrix', () => {
    expect(FIXTURES.map((f: { id: string }) => f.id)).toEqual(loadFixtures().map((f) => f.id));
  });

  test('REQ-100 · every app receives the same props the string gate renders', () => {
    for (const fixture of loadFixtures()) {
      expect(harnessProps(fixtureById(fixture.id)), fixture.id).toEqual(fixtureProps(fixture));
    }
  });

  test('REQ-093 · the default page shows the demo chart with a pinned id and size', () => {
    expect(DEMO_PROPS).toMatchObject({ id: 'sp-demo', width: 320 });
    expect(DEMO_PROPS.data).toBeUndefined();
  });
});
