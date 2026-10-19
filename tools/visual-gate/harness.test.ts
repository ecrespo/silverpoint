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
  test('REQ-211 · the apps open the same 30 dashboard fixtures the tree gate compares', async () => {
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

  test('REQ-328 · the apps render the UI fixtures the tree gate declares, with the same parts and the same views', async () => {
    const harness = await import('../../examples/harness/index.js');
    const { uiMatrix, uiFixtureParts } = await import('./ui-matrix');
    const { uiFixtureView, serializeUi, isComposedUi } = await import('./ui-canonical');
    expect(harness.UI_FIXTURES.map((f: { id: string }) => f.id)).toEqual(uiMatrix().map((f) => f.id));
    for (const fixture of uiMatrix()) {
      const embedded = harness.uiFixtureById(fixture.id);
      expect(embedded, fixture.id).toEqual(fixture);
      expect(harness.uiFixtureParts(embedded), fixture.id).toEqual(uiFixtureParts(fixture));
      // A composed fixture (Glyph `all`, Avatar `group`, Collapse) has no single view: each app composes it.
      if (isComposedUi(fixture)) continue;
      const { view, slots } = uiFixtureView(fixture);
      expect(serializeUi(harness.uiFixtureView(embedded).view, slots), fixture.id).toBe(serializeUi(view, slots));
    }
    expect(harness.UI_PR_FIXTURES).toHaveLength(320);
    expect(harness.uiFixtureById('nope')).toBeUndefined();
  });
});

describe('the canonical page of the UI pixel gate (T-219)', () => {
  test('REQ-516 · REQ-517 · the roots the canonical page writes are the canonical render, composed demos included', async () => {
    const harness = await import('../../examples/harness/index.js');
    const { uiMatrix } = await import('./ui-matrix');
    const { canonicalUiMarkup, serializeUi } = await import('./ui-canonical');
    const { compareUi } = await import('../svg-normalizer/normalize');
    for (const fixture of uiMatrix().filter((f) => f.scope === 'pr')) {
      const markup = harness.uiFixtureTree(harness.uiFixtureById(fixture.id)!).map((node) => serializeUi(node, {})).join('');
      expect(compareUi(markup, canonicalUiMarkup(fixture)), fixture.id).toEqual({ equal: true });
    }
  });

  test('REQ-517 · an overlay hangs from the trigger its consumer writes just before it, as in every app', async () => {
    const harness = await import('../../examples/harness/index.js');
    const { serializeUi } = await import('./ui-canonical');
    const first = (id: string) => serializeUi(harness.uiFixtureTree(harness.uiFixtureById(id)!)[0]!, {});
    expect(first('modal--open--silverpoint--cream--ink')).toBe('<button type="button">Edit order</button>');
    expect(first('drawer--end-open--silverpoint--cream--ink')).toBe('<button type="button">Filters</button>');
    expect(first('popover--open--silverpoint--cream--ink')).toBe('<button type="button">Details</button>');
    expect(first('tooltip--open--silverpoint--cream--ink')).toBe('<button type="button">Copy id</button>');
    // The menu draws its own button, the select its combobox: no trigger of the consumer's.
    expect(first('dropdown-menu--open--silverpoint--cream--ink')).toMatch(/^<span class="sp-ui sp-dropdown-menu/);
    expect(first('select--open-selected--silverpoint--cream--ink')).toMatch(/^<span class="sp-ui sp-select/);
    expect(harness.uiFixtureTree(harness.uiFixtureById('modal--open--silverpoint--cream--ink')!)).toHaveLength(2);
  });

  test('REQ-517 · DD-043 · the canonical page opens each overlay as its adapter does, and places the anchored ones alike', async () => {
    const harness = await import('../../examples/harness/index.js');
    const overlay = (id: string) => harness.uiFixtureOverlay(harness.uiFixtureById(id)!);
    expect(overlay('modal--open--silverpoint--cream--ink')).toEqual({ kind: 'modal' });
    expect(overlay('drawer--end-open--silverpoint--cream--ink')).toEqual({ kind: 'modal' });
    expect(overlay('popover--open--silverpoint--cream--ink')).toEqual({ kind: 'popover', place: { side: 'bottom', align: 'center' } });
    expect(overlay('tooltip--open--silverpoint--cream--ink')).toEqual({ kind: 'popover', place: { side: 'top', align: 'center' } });
    expect(overlay('select--open-selected--silverpoint--cream--ink')).toEqual({ kind: 'popover', place: { side: 'bottom', align: 'start' } });
    expect(overlay('dropdown-menu--open--silverpoint--cream--ink')).toEqual({ kind: 'popover', place: { side: 'bottom', align: 'start' }, focus: 'edit' });
    // A toast is in the page's flow; a closed select opens nothing.
    expect(overlay('toast--info--silverpoint--cream--ink')).toBeUndefined();
    expect(overlay('select--placeholder--silverpoint--cream--ink')).toBeUndefined();
    expect(overlay('button--default--silverpoint--cream--ink')).toBeUndefined();
  });
});

describe('the UI reference page (T-157)', () => {
  test('REQ-329 · REQ-331 · three panels —silverpoint ink, precision, cyanotype— each holding all 17 components', async () => {
    const { UI_PAGE } = await import('../../examples/harness/index.js');
    const { UI_COMPONENTS } = await import('@silverpoint/core/ui');
    expect(UI_PAGE.panels.map((p: { ground: string; substrate: string; mode: string }) => `${p.ground}/${p.substrate}/${p.mode}`)).toEqual([
      'silverpoint/cream/ink',
      'silverpoint/cream/precision',
      'cyanotype/prussian/ink',
    ]);
    for (const panel of UI_PAGE.panels) {
      const items = panel.sections.flatMap((s: { items: { component: string }[] }) => s.items);
      // The 0.3.0 family; feature-004's rows get pages of their own (T-222).
      expect(new Set(items.map((i: { component: string }) => i.component))).toEqual(new Set(UI_COMPONENTS.filter((c) => c.family === 'ui').map((c) => c.slug)));
      for (const item of items) expect(item.props).toMatchObject({ ground: panel.ground, substrate: panel.substrate, mode: panel.mode });
    }
  });

  test('REQ-329 · every id on the page is unique, and prefixed by its panel', async () => {
    const { UI_PAGE } = await import('../../examples/harness/index.js');
    const ids = UI_PAGE.panels.flatMap((p: { key: string; sections: { items: { props: { id: string } }[] }[] }) =>
      p.sections.flatMap((s) => s.items.map((i) => i.props.id)).map((id) => [p.key, id]),
    );
    for (const [panel, id] of ids) expect(id.startsWith(`${panel}-`)).toBe(true);
    expect(new Set(ids.map(([, id]: string[]) => id)).size).toBe(ids.length);
  });

  test('REQ-331 · C-5 · the Card holds a KpiCard chart, and the Tabs their panels', async () => {
    const { UI_PAGE } = await import('../../examples/harness/index.js');
    const items = UI_PAGE.panels[0].sections.flatMap((s: { items: unknown[] }) => s.items) as { component: string; chart?: { chart: string }; tabPanels?: unknown[]; props: { headingLevel?: number } }[];
    const card = items.find((i) => i.component === 'card')!;
    expect(card.chart?.chart).toBe('KpiCard');
    expect(card.props.headingLevel).toBe(4);
    expect(items.find((i) => i.component === 'tabs')!.tabPanels).toHaveLength(4);
  });
});
