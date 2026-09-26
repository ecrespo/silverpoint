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

describe('the harness’s dashboards (T-117, T-118)', () => {
  test('REQ-211 · the apps open the same 24 dashboard fixtures the tree gate compares', async () => {
    const harness = await import('../../examples/harness/index.js');
    const { dashboardMatrix, dashboardFixtureProps } = await import('./dashboard-fixtures');
    expect(harness.DASHBOARD_FIXTURES.map((f: { id: string }) => f.id)).toEqual(dashboardMatrix().map((f) => f.id));
    for (const fixture of dashboardMatrix()) {
      const embedded = harness.dashboardFixtureById(fixture.id);
      expect(harness.dashboardFixtureProps(embedded), fixture.id).toEqual(dashboardFixtureProps(fixture));
    }
    expect(harness.dashboardFixtureById('nope')).toBeUndefined();
  });

  test('REQ-221 · the reference dashboard page shows ops, at the library’s default nominal width', async () => {
    const harness = await import('../../examples/harness/index.js');
    const { DASHBOARD_DEMOS } = await import('@silverpoint/core/dashboard-demos');
    expect(harness.REFERENCE_DASHBOARD).toEqual({ props: DASHBOARD_DEMOS.ops.props, children: DASHBOARD_DEMOS.ops.children });
  });

  test('REQ-211 · the three breakpoint widths of the pixel gate', async () => {
    const harness = await import('../../examples/harness/index.js');
    expect(harness.DASHBOARD_WIDTHS).toEqual([375, 800, 1280]);
  });
});
