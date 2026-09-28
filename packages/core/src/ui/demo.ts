import type { StepItem, UiItem } from './types';

/**
 * The props of one demo state: the component's own props (`Sp<Name>Props`), plus `value` for a
 * value component and `content` for the text it holds. Plain data; each adapter binds it.
 */
export type UiDemoProps = Readonly<Record<string, unknown> & { id: string }>;

/** Demo states per component slug, in the catalog's order (Data Model §4). */
export type UiDemos = Readonly<Record<string, Readonly<Record<string, UiDemoProps>>>>;

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const inner of Object.values(value)) deepFreeze(inner);
    Object.freeze(value);
  }
  return value;
}

const periods: UiItem[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];
const grounds: UiItem[] = [
  { key: 'silverpoint', label: 'silverpoint' },
  { key: 'cyanotype', label: 'cyanotype' },
];
const tabs: UiItem[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'traffic', label: 'Traffic' },
  { key: 'errors', label: 'Errors' },
  { key: 'settings', label: 'Settings' },
];
const steps: StepItem[] = [
  { key: 'install', title: 'Install' },
  { key: 'import', title: 'Import' },
  { key: 'configure', title: 'Configure' },
  { key: 'publish', title: 'Publish' },
];

/** Every state's props, keyed `<slug>` → `<state>`; each carries its fixture id `<slug>--<state>`. */
function withIds(demos: Record<string, Record<string, Record<string, unknown>>>): UiDemos {
  const out: Record<string, Record<string, UiDemoProps>> = {};
  for (const [slug, states] of Object.entries(demos)) {
    out[slug] = {};
    for (const [state, props] of Object.entries(states)) out[slug][state] = { id: `${slug}--${state}`, ...props };
  }
  return deepFreeze(out);
}

/**
 * The reference states of the 17 components, drawn from the concept for `0.3.0` (feature-002
 * `concept.png`): one per declared state of `UI_COMPONENTS` (45), shared by the fixtures, the
 * example apps' UI page and the documentation. Frozen (I-9). Cards hold text only (C-5).
 */
export const UI_DEMOS: UiDemos = /* @__PURE__ */ withIds({
  button: {
    default: { content: 'Default' },
    primary: { content: 'Primary', variant: 'primary' },
    danger: { content: 'Delete', variant: 'danger' },
    disabled: { content: 'Disabled', disabled: true },
  },
  input: {
    empty: { placeholder: 'Search charts…', type: 'search', name: 'q', value: '' },
    filled: { name: 'city', value: 'Caracas' },
    invalid: { name: 'city', value: 'Caracas', invalid: true, message: 'Required: pick a city' },
    disabled: { name: 'city', value: 'Caracas', disabled: true },
  },
  checkbox: {
    unchecked: { label: 'Legend', name: 'legend', value: false },
    checked: { label: 'Baseline', name: 'baseline', value: true },
    indeterminate: { label: 'All series', name: 'all', value: false, indeterminate: true },
    disabled: { label: 'Baseline', name: 'baseline', value: true, disabled: true },
  },
  'radio-group': {
    selected: { label: 'Ground', name: 'ground', items: grounds, value: 'silverpoint', orientation: 'horizontal' },
    'disabled-item': {
      label: 'Ground',
      name: 'ground',
      items: [grounds[0], { ...grounds[1], disabled: true }],
      value: 'silverpoint',
      orientation: 'horizontal',
    },
  },
  switch: {
    off: { label: 'Linked hover', name: 'linked', value: false },
    on: { label: 'Precision', name: 'precision', value: true },
    disabled: { label: 'Precision', name: 'precision', value: true, disabled: true },
  },
  slider: {
    marks: { label: 'Volume', name: 'volume', value: 30, marks: [0, 25, 50, 75, 100] },
    disabled: { label: 'Volume', name: 'volume', value: 30, disabled: true },
  },
  rate: {
    three: { label: 'Quality', name: 'quality', value: 3, count: 5 },
    'read-only': { label: 'Quality', name: 'quality', value: 3, count: 5, readOnly: true },
  },
  segmented: {
    first: { label: 'Period', name: 'period', items: periods, value: 'day' },
    middle: { label: 'Period', name: 'period', items: periods, value: 'week' },
  },
  tabs: {
    first: { label: 'Views', items: tabs, value: 'overview' },
    'disabled-tab': { label: 'Views', items: tabs.map((t) => (t.key === 'settings' ? { ...t, disabled: true } : t)), value: 'traffic' },
  },
  steps: {
    current: { label: 'Release', items: steps, current: 2 },
    error: { label: 'Release', items: steps.map((s) => (s.key === 'configure' ? { ...s, status: 'error' } : s)), current: 2 },
  },
  card: {
    plain: { content: 'Hits per hour rose through the afternoon and eased at night.' },
    titled: { title: 'Revenue', extra: 'Q3', content: '128 thousands, up 6.4 on the quarter.' },
  },
  tag: {
    'tone-1': { content: 'draft', tone: 1 },
    closable: { content: 'review', tone: 3, closable: true },
  },
  badge: {
    count: { content: 'Inbox', count: 12 },
    dot: { content: 'Alerts', dot: true },
    overflow: { content: 'Mentions', count: 120, max: 99 },
  },
  divider: {
    plain: {},
    text: { text: 'or' },
  },
  progress: {
    line: { label: 'Upload', value: 40 },
    circle: { label: 'Coverage', value: 72, shape: 'circle' },
    indeterminate: { label: 'Loading' },
  },
  alert: {
    info: { kind: 'info', title: 'New ground available', content: 'cyanotype ships in 0.2.0.' },
    success: { kind: 'success', title: 'Published', content: 'Every package reached npm.' },
    warning: { kind: 'warning', title: 'Contrast check', content: 'One ink is close to 4.5:1 on ochre.' },
    error: { kind: 'error', title: 'Build failed', content: 'ui.css is over its 24 KB budget.' },
  },
  skeleton: {
    paragraph: { lines: 3 },
    avatar: { lines: 3, avatar: true },
  },
});
