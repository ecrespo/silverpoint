/**
 * The fixture matrix as every example app sees it, plus the props builder the string gate uses.
 * Kept in plain JavaScript so Vite, Next.js and the Angular CLI consume it without a transform.
 */
import { DASHBOARD_DEMOS } from '@silverpoint/core/dashboard-demos';
import { ALL_FIXTURES } from './fixtures.generated.js';

/** The nightly matrix (Data Model §5): 1,782 cells. */
export { ALL_FIXTURES };

/** The PR matrix: the `md` + `tile` slice every PR compares. */
export const FIXTURES = ALL_FIXTURES.filter((fixture) => fixture.hatchFill === 'tile' && fixture.size.width === 320);

/**
 * The container size a fixture lays out in — `sm`, `md` or `lg` of the harness stylesheet — so the
 * canonical page and every app screenshot the same layout.
 * @param {(typeof ALL_FIXTURES)[number]} fixture
 */
export function sizeOf(fixture) {
  return fixture.size.width === 240 ? 'sm' : fixture.size.width === 640 ? 'lg' : 'md';
}

/** Any cell of the full matrix, by id. @param {string | null | undefined} id */
export function fixtureById(id) {
  return ALL_FIXTURES.find((fixture) => fixture.id === id);
}

/**
 * The same props `tools/visual-gate/fixtures.ts#fixtureProps` builds — a test holds them equal.
 * @param {(typeof FIXTURES)[number]} fixture
 */
export function fixtureProps(fixture) {
  return {
    ...fixture.props,
    ...(fixture.rows === null ? {} : { data: fixture.rows }),
    id: fixture.id,
    ground: fixture.ground,
    substrate: fixture.substrate,
    mode: fixture.mode,
    hatchFill: fixture.hatchFill,
    seed: fixture.seed,
    width: fixture.size.width,
    height: fixture.size.height,
  };
}

/** The chart the home page of every example app shows. */
export const DEMO_PROPS = Object.freeze({
  id: 'sp-demo',
  width: 320,
  title: 'Throughput per hour',
  badge: 'Live',
  value: 88,
  unit: 'requests',
  footerLeft: '00–22 h',
  footerRight: 'silverpoint',
});

const kebab = (/** @type {string} */ name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * One of every chart, with its demo dataset and its fixture card, each under an id of its own:
 * the `?gallery` page every app shows, which axe-core audits (T-045).
 */
export const GALLERY = Object.freeze(
  FIXTURES.filter((fixture) => fixture.substrate === 'cream' && fixture.mode === 'ink').map((fixture) => ({
    chart: fixture.chart,
    props: { ...fixture.props, id: `sp-gallery-${kebab(fixture.chart)}`, width: 320 },
  })),
);

/** Whether the page asks for the gallery. */
export function wantsGallery(/** @type {string} */ search) {
  return new URLSearchParams(search).has('gallery');
}


/** The container widths of the dashboard pixel gate, one per breakpoint (REQ-211, Data Model §5). */
export const DASHBOARD_WIDTHS = Object.freeze([375, 800, 1280]);

/** Each ground with its substrates: `silverpoint`'s four, and `cyanotype`'s one (REQ-028). */
const GROUND_SUBSTRATES = [
  ...['cream', 'green', 'blue', 'ochre'].map((substrate) => ({ ground: 'silverpoint', substrate })),
  { ground: 'cyanotype', substrate: 'prussian' },
];

/**
 * The 30 dashboard fixtures, as `tools/visual-gate/dashboard-fixtures.ts#dashboardMatrix` declares
 * them — a test holds the two equal. Each is a reference dashboard in one ground substrate and mode.
 */
export const DASHBOARD_FIXTURES = Object.freeze(
  Object.keys(DASHBOARD_DEMOS).flatMap((dashboard) =>
    GROUND_SUBSTRATES.flatMap(({ ground, substrate }) =>
      ['ink', 'precision'].map((mode) =>
        Object.freeze({ id: `${dashboard}--${ground}--${substrate}--${mode}`, dashboard, ground, substrate, mode, ssrWidth: 1280 }),
      ),
    ),
  ),
);

/** A dashboard fixture by id. @param {string | null | undefined} id */
export function dashboardFixtureById(id) {
  return DASHBOARD_FIXTURES.find((fixture) => fixture.id === id);
}

/**
 * What every app renders for a dashboard fixture: its dashboard's props with the fixture's
 * substrate and mode set on the dashboard, and its children (the same builder as the tree gate's).
 * @param {(typeof DASHBOARD_FIXTURES)[number]} fixture
 */
export function dashboardFixtureProps(fixture) {
  const demo = DASHBOARD_DEMOS[/** @type {keyof typeof DASHBOARD_DEMOS} */ (fixture.dashboard)];
  return {
    props: { ...demo.props, ground: fixture.ground, substrate: fixture.substrate, mode: fixture.mode, ssrWidth: fixture.ssrWidth },
    children: demo.children,
  };
}

/** The `/dashboard` page of every app: the `ops` reference dashboard as a consumer writes it (REQ-221). */
export const REFERENCE_DASHBOARD = Object.freeze({ props: DASHBOARD_DEMOS.ops.props, children: DASHBOARD_DEMOS.ops.children });

const HOURS = ['10', '11', '12', '13', '14', '15'];

/**
 * The `/dashboard?linked` page (REQ-216): three charts of consumer rows that share an `hour` field,
 * linked on it — the demo datasets carry no common key, so the reference dashboards cannot show it.
 */
export const LINKED_DASHBOARD = Object.freeze({
  props: { id: 'linked', title: 'Linked by hour', link: { key: 'hour' }, layout: { cells: [{ id: 'hits' }, { id: 'errors' }, { id: 'load' }] } },
  children: [
    { cell: 'hits', chart: 'LineChart', props: { title: 'Hits', data: HOURS.map((hour, i) => ({ hour, hits: [30, 42, 38, 55, 61, 47][i] })), xKey: 'hour', valueKey: 'hits' } },
    { cell: 'errors', chart: 'BarChart', props: { title: 'Errors', data: HOURS.map((hour, i) => ({ hour, n: [2, 5, 1, 7, 3, 4][i] })), xKey: 'hour', valueKey: 'n' } },
    { cell: 'load', chart: 'AreaChart', props: { title: 'Load', data: HOURS.map((hour, i) => ({ hour, v: [20, 35, 30, 48, 52, 40][i] })), xKey: 'hour', valueKey: 'v' } },
  ],
});

/** The dashboard a `/dashboard` page shows: the linked one with `?linked`, else the reference `ops`. */
export function dashboardPage(/** @type {string} */ search) {
  return new URLSearchParams(search).has('linked') ? LINKED_DASHBOARD : REFERENCE_DASHBOARD;
}
