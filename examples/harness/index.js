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

/*
 * ── UI components (feature-002) ─────────────────────────────────────────────────────────────
 * The UI fixtures, as `tools/visual-gate/ui-matrix.ts#uiMatrix` declares them — a test holds the
 * two equal — and the core's view of each, which the canonical page writes with no framework.
 */
import {
  resolveUi,
  UI_COMPONENTS,
  uiAlertView,
  uiBadgeView,
  uiButtonView,
  uiCardView,
  uiCheckboxView,
  uiDividerView,
  uiInputView,
  uiProgressView,
  uiRadioGroupView,
  uiRateView,
  uiSegmentedView,
  uiSkeletonView,
  uiSliderView,
  uiStepsView,
  uiSwitchView,
  uiTabsView,
  uiTagView,
} from '@silverpoint/core/ui';
import { UI_DEMOS } from '@silverpoint/core/ui-demos';

/** The batches of step 6c whose adapters exist. */
const UI_GATED_BATCHES = ['B1', 'B2', 'B3'];
const UI_GROUND_SUBSTRATES = [
  ...['cream', 'green', 'blue', 'ochre'].map((substrate) => ({ ground: 'silverpoint', substrate })),
  { ground: 'cyanotype', substrate: 'prussian' },
];
const UI_SIZED = new Set(['button', 'input', 'segmented']);
const UI_WIDE = new Set(['card', 'alert']);
const UI_PR_GROUNDS = new Set(['silverpoint/cream', 'cyanotype/prussian']);

/** Every UI fixture: the nightly matrix. */
export const UI_FIXTURES = Object.freeze(
  UI_COMPONENTS.filter((row) => UI_GATED_BATCHES.includes(row.batch)).flatMap((row) =>
    ['md', ...(UI_SIZED.has(row.slug) ? ['sm', 'lg'] : [])].flatMap((size) =>
      (size === 'md' ? row.states : row.states.slice(0, 1)).flatMap((state) =>
        UI_GROUND_SUBSTRATES.flatMap(({ ground, substrate }) =>
          ['ink', 'precision'].map((mode) => {
            const id = [row.slug, state, ground, substrate, mode, ...(size === 'md' ? [] : [size])].join('--');
            return Object.freeze({
              id,
              component: row.slug,
              state,
              req: 'REQ-327',
              ground,
              substrate,
              mode,
              size,
              width: UI_WIDE.has(row.slug) ? 640 : 320,
              scope: size === 'md' && UI_PR_GROUNDS.has(`${ground}/${substrate}`) ? 'pr' : 'nightly',
              canonical: `ui/${id}.canonical.txt`,
            });
          }),
        ),
      ),
    ),
  ),
);

/** The PR matrix of the UI pixel gate. */
export const UI_PR_FIXTURES = Object.freeze(UI_FIXTURES.filter((fixture) => fixture.scope === 'pr'));

/** A UI fixture by id. @param {string | null | undefined} id */
export function uiFixtureById(id) {
  return UI_FIXTURES.find((fixture) => fixture.id === id);
}

/** The harness size of a UI fixture: `md` (320 px), or `lg` (640 px) for the wide components. */
export function uiSizeOf(/** @type {{ width: number }} */ fixture) {
  return fixture.width === 640 ? 'lg' : 'md';
}

const UI_SLOTS = ['content', 'extra', 'footer'];
/** The components whose `value` each framework binds; a Progress's `value` is a plain prop. */
export const UI_VALUE_COMPONENTS = new Set(['input', 'checkbox', 'radio-group', 'switch', 'slider', 'rate', 'segmented', 'tabs']);

/**
 * What every app receives for a UI fixture: the demo's props with the fixture's ground, substrate,
 * mode and size; the value apart, for each framework's binding; the slot text apart.
 * @param {(typeof UI_FIXTURES)[number]} fixture
 */
export function uiFixtureParts(fixture) {
  const demo = UI_DEMOS[fixture.component]?.[fixture.state] ?? {};
  /** @type {Record<string, unknown>} */ const props = {};
  /** @type {Record<string, string>} */ const slots = {};
  let value;
  for (const [key, v] of Object.entries(demo)) {
    if (UI_SLOTS.includes(key)) slots[key] = /** @type {string} */ (v);
    else if (key === 'value' && UI_VALUE_COMPONENTS.has(fixture.component)) value = v;
    else props[key] = v;
  }
  return { props: { ...props, ground: fixture.ground, substrate: fixture.substrate, mode: fixture.mode, size: fixture.size }, value, slots };
}

/**
 * The core's view of a UI fixture: the tree the canonical page writes.
 * @param {(typeof UI_FIXTURES)[number]} fixture
 */
export function uiFixtureView(fixture) {
  const { props, value, slots } = uiFixtureParts(fixture);
  const r = resolveUi(props, {});
  const p = /** @type {never} */ (props);
  const views = {
    button: () => uiButtonView(p, r, { text: slots.content }),
    input: () => uiInputView(p, r, { value: /** @type {string | undefined} */ (value) ?? '' }),
    checkbox: () => uiCheckboxView(p, r, { checked: Boolean(value) }),
    switch: () => uiSwitchView(p, r, { checked: Boolean(value) }),
    card: () => uiCardView(p, r, { extra: slots.extra !== undefined, footer: slots.footer !== undefined }),
    divider: () => uiDividerView(p, r),
    'radio-group': () => uiRadioGroupView(p, r, { value: /** @type {string | undefined} */ (value) ?? null }),
    segmented: () => uiSegmentedView(p, r, { value: /** @type {string | undefined} */ (value) ?? null }),
    tabs: () => uiTabsView(p, r, { value: /** @type {string | undefined} */ (value) ?? null }),
    slider: () => uiSliderView(p, r, { value: /** @type {number | undefined} */ (value) ?? 0 }),
    rate: () => uiRateView(p, r, { value: /** @type {number | undefined} */ (value) ?? 0 }),
    steps: () => uiStepsView(p, r),
    tag: () => uiTagView(p, r, { text: slots.content }),
    badge: () => uiBadgeView(p, r, { text: slots.content }),
    progress: () => uiProgressView(p, r),
    alert: () => uiAlertView(p, r, { closable: props.closable === true }),
    skeleton: () => uiSkeletonView(p, r),
  };
  return { view: views[/** @type {keyof typeof views} */ (fixture.component)](), slots };
}

/*
 * ── The UI reference page (T-157) ────────────────────────────────────────────────────────────
 * `/ui` in every app: the 17 components from `UI_DEMOS`, composed as the concept drawing, in three
 * panels. Plain data; each app writes it in its framework's idiom, as it writes the fixtures.
 */

/** Sections of a panel: `[component, state]` pairs, in the concept's order. */
const UI_PAGE_SECTIONS = [
  ['Button', [['button', 'default'], ['button', 'primary'], ['button', 'danger'], ['button', 'disabled']]],
  ['Input', [['input', 'empty'], ['input', 'invalid']]],
  ['Checkbox · Switch', [['checkbox', 'checked'], ['checkbox', 'indeterminate'], ['checkbox', 'unchecked'], ['switch', 'on'], ['switch', 'off']]],
  ['RadioGroup · Rate', [['radio-group', 'selected'], ['rate', 'three']]],
  ['Slider', [['slider', 'marks']]],
  ['Segmented', [['segmented', 'middle']]],
  ['Steps', [['steps', 'current']]],
  ['Progress', [['progress', 'line'], ['progress', 'circle'], ['progress', 'indeterminate']]],
  ['Skeleton', [['skeleton', 'avatar']]],
  ['Tabs', [['tabs', 'disabled-tab']]],
  ['Card · Tag · Badge', [['card', 'titled'], ['tag', 'tone-1'], ['tag', 'closable'], ['badge', 'count'], ['badge', 'dot'], ['badge', 'overflow']]],
  ['Alert', [['alert', 'info'], ['alert', 'success'], ['alert', 'warning'], ['alert', 'error']]],
  ['Divider', [['divider', 'text']]],
];

const UI_PAGE_PANELS = [
  { key: 'silverpoint', title: 'silverpoint · cream · ink', note: 'Tone by hatching, heightening on the current item', ground: 'silverpoint', substrate: 'cream', mode: 'ink' },
  { key: 'precision', title: 'precision mode', note: 'Same components, inking switched off', ground: 'silverpoint', substrate: 'cream', mode: 'precision' },
  { key: 'cyanotype', title: 'cyanotype · prussian', note: 'Tone is the weight of an exact white line', ground: 'cyanotype', substrate: 'prussian', mode: 'ink' },
];

/** One item of a panel: a demo state with the panel's configuration, under an id of its own. */
function uiPageItem(/** @type {(typeof UI_PAGE_PANELS)[number]} */ panel, /** @type {string} */ component, /** @type {string} */ state) {
  const demo = UI_DEMOS[component]?.[state] ?? {};
  /** @type {Record<string, unknown>} */ const props = {};
  /** @type {Record<string, string>} */ const slots = {};
  let value;
  for (const [key, v] of Object.entries(demo)) {
    if (UI_SLOTS.includes(key)) slots[key] = /** @type {string} */ (v);
    else if (key === 'value' && UI_VALUE_COMPONENTS.has(component)) value = v;
    else props[key] = v;
  }
  Object.assign(props, { id: `${panel.key}-${demo.id}`, ground: panel.ground, substrate: panel.substrate, mode: panel.mode });
  const item = { key: `${component}--${state}`, component, props, value, slots };
  // The Card holds a KPI and its sparkline, as the concept draws it (C-5); its title sits under the section's h3.
  if (component === 'card') {
    Object.assign(props, { headingLevel: 4 });
    return { ...item, slots: { extra: slots.extra }, chart: { chart: 'KpiCard', props: { id: `${panel.key}-card-kpi`, width: 280, metric: 'thousands', ground: panel.ground, substrate: panel.substrate, mode: panel.mode } } };
  }
  if (component === 'tabs') {
    const items = /** @type {{ key: string, label: string }[]} */ (props.items);
    return { ...item, tabPanels: items.map((tab) => ({ value: tab.key, text: `${tab.label}: the charts of this view.` })) };
  }
  return item;
}

/** The page: three panels of the same sections, each under its own ground, substrate and mode. */
export const UI_PAGE = Object.freeze({
  title: 'silverpoint · UI components',
  panels: UI_PAGE_PANELS.map((panel) => ({
    ...panel,
    sections: UI_PAGE_SECTIONS.map(([title, items]) => ({
      title: /** @type {string} */ (title),
      items: /** @type {[string, string][]} */ (items).map(([component, state]) => uiPageItem(panel, component, state)),
    })),
  })),
});
