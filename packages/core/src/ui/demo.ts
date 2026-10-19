import { uiSortRows } from './sort';
import type { DescriptionItem, MenuEntry, StepItem, TableColumn, TimelineListItem, UiItem } from './types';
import { UI_GLYPHS } from './view-kit';

/**
 * The props of one demo state: the component's own props (`Sp<Name>Props`), plus `value` for a
 * value component and `content` for the text it holds. Plain data; each adapter binds it.
 */
export type UiDemoProps = Readonly<Record<string, unknown> & { id: string }>;

/** Demo states per component slug, in the catalog's order (Data Model §4). */
export type UiDemos = Readonly<Record<string, Readonly<Record<string, UiDemoProps>>>>;

/** Freezes a demo and everything in it (I-9). */
export function deepFreeze<T>(value: T): T {
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

// feature-004 (Data Model delta §4): the composed page's orders, as Reflex 0.7's `/components`.
const columns: TableColumn[] = [
  { key: 'order', title: 'Order' },
  { key: 'customer', title: 'Customer', sortable: true },
  { key: 'status', title: 'Status' },
  { key: 'amount', title: 'Amount', align: 'end', sortable: true },
];
const orders = [
  { order: '1042', customer: 'Ada Lovelace', status: 'Shipped', amount: 128 },
  { order: '1043', customer: 'Grace Hopper', status: 'Packed', amount: 64.5 },
  { order: '1044', customer: 'Alan Turing', status: 'Paid', amount: 312 },
  { order: '1045', customer: 'Emmy Noether', status: 'Placed', amount: 18.25 },
  { order: '1046', customer: 'Kurt Gödel', status: 'Shipped', amount: 96 },
];
const order: DescriptionItem[] = [
  { key: 'customer', label: 'Customer', value: 'Ada Lovelace' },
  { key: 'status', label: 'Status', value: 'Shipped' },
  { key: 'amount', label: 'Amount', value: '128.00' },
  { key: 'placed', label: 'Placed', value: '14 October 2026' },
];
const history: TimelineListItem[] = [
  { key: 'placed', title: 'Placed', time: '14 Oct, 09:12', description: 'Two prints, one framed.' },
  { key: 'paid', title: 'Payment', time: '14 Oct, 09:14', description: 'Card declined; paid on the second try.', status: 'error' },
  { key: 'packed', title: 'Packed', time: '15 Oct, 16:40', status: 'current' },
  { key: 'shipped', title: 'Shipped', status: 'pending' },
];
const faqs = [
  { key: 'ground', title: 'What is a ground?', content: 'The prepared surface a metal stylus can mark: bone ash, gum and a little pigment.' },
  { key: 'erase', title: 'Can a line be erased?', content: 'No. Every line stays, so the drawing is planned before it is drawn.' },
  { key: 'tone', title: 'Where does the tone come from?', content: 'From hatching, level by level, never from transparency.' },
];
const statuses: UiItem[] = [
  { key: 'placed', label: 'Placed' },
  { key: 'paid', label: 'Paid' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'returned', label: 'Returned', disabled: true },
];
const actions: MenuEntry[] = [
  { type: 'label', key: 'order', label: 'Order 1042' },
  { key: 'edit', label: 'Edit', shortcut: 'E' },
  { key: 'duplicate', label: 'Duplicate', shortcut: 'D' },
  { key: 'archive', label: 'Archive', disabled: true },
  { type: 'separator', key: 'end' },
  { key: 'delete', label: 'Delete', danger: true },
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
 * `concept.png`), then of the 21 of feature-004: one per declared state of `UI_COMPONENTS` (45 +
 * 35), shared by the fixtures, the example apps' pages and the documentation. Frozen (I-9). Cards
 * hold text only (C-5). Overlays are demoed open, with `trigger` the text of their trigger button.
 */
export const UI_DEMOS: UiDemos = /* @__PURE__ */ withIds({
  button: {
    default: { content: 'Default' },
    primary: { content: 'Primary', variant: 'primary' },
    danger: { content: 'Delete', variant: 'danger' },
    disabled: { content: 'Disabled', disabled: true },
  },
  input: {
    empty: { label: 'Search charts', placeholder: 'Search charts…', type: 'search', name: 'q', value: '' },
    filled: { label: 'City', name: 'city', value: 'Caracas' },
    invalid: { label: 'City', name: 'city', value: 'Caracas', invalid: true, message: 'Required: pick a city' },
    disabled: { label: 'City', name: 'city', value: 'Caracas', disabled: true },
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
  surface: {
    'frame-card': { frame: 'card', content: 'A surface takes the ground: its substrate, its ink and a hand-drawn frame.' },
    'tone-2': { frame: 'box', tone: 2, content: 'Tone is hatched, level by level.' },
  },
  glyph: {
    all: { glyphs: Object.keys(UI_GLYPHS) },
  },
  table: {
    plain: { caption: 'Orders', columns, data: orders, rowKey: 'order' },
    'sorted-striped': { caption: 'Orders', columns, data: uiSortRows(orders, 'amount', 'desc'), rowKey: 'order', sortKey: 'amount', sortOrder: 'desc', striped: true },
    empty: { caption: 'Returns', columns, data: [], rowKey: 'order', emptyText: 'No returns yet' },
  },
  pagination: {
    middle: { total: 200, pageSize: 10, current: 10 },
    total: { total: 48, pageSize: 10, current: 1, showTotal: true },
  },
  breadcrumb: {
    three: {
      items: [
        { key: 'home', label: 'Home', href: '/' },
        { key: 'orders', label: 'Orders', href: '/orders' },
        { key: '1042', label: 'Order 1042' },
      ],
    },
  },
  avatar: {
    initials: { name: 'Ada Lovelace' },
    square: { name: 'Grace Hopper', shape: 'square' },
    group: { label: 'Reviewers', avatars: [{ name: 'Ada Lovelace' }, { name: 'Alan Turing' }, { name: 'Emmy Noether', shape: 'square' }] },
  },
  statistic: {
    plain: { title: 'Orders', value: 1284 },
    'trend-down': { title: 'Returns', value: '3.1', suffix: '%', trend: 'down', delta: '−0.4%' },
  },
  descriptions: {
    bordered: { title: 'Order 1042', items: order, columns: 2 },
    plain: { items: order, columns: 2, bordered: false },
  },
  'timeline-list': {
    mixed: { label: 'Order history', items: history },
  },
  collapse: {
    'one-open': { items: faqs.map((faq, i) => (i === 0 ? { ...faq, open: true } : faq)) },
    'accordion-disabled': { accordion: true, items: faqs.map((faq, i) => (i === 2 ? { ...faq, disabled: true } : faq)) },
  },
  empty: {
    plain: { description: 'No orders yet' },
  },
  result: {
    success: { status: 'success', title: 'Order placed', subtitle: 'Order 1042 is on its way to the workshop.' },
    error: { status: 'error', title: 'Payment failed', subtitle: 'The card was declined; nothing was charged.' },
  },
  textarea: {
    count: { label: 'Notes', name: 'notes', value: 'Leave it at the door.', maxLength: 120, showCount: true },
    invalid: { label: 'Notes', name: 'notes', value: '', invalid: true, message: 'Required: add a note' },
  },
  'input-number': {
    value: { label: 'Quantity', name: 'quantity', value: 3, min: 1, max: 10 },
    'at-min': { label: 'Quantity', name: 'quantity', value: 1, min: 1, max: 10 },
  },
  modal: {
    open: { open: true, trigger: 'Edit order', title: 'Edit order', description: 'Order 1042, placed on 14 October.', content: 'Changes reach the workshop before the order is packed.' },
  },
  drawer: {
    'end-open': { open: true, side: 'end', trigger: 'Filters', title: 'Filters', content: 'Narrow the orders by status, customer or amount.' },
  },
  popover: {
    open: { open: true, trigger: 'Details', title: 'Order 1042', content: 'Two prints, one framed; shipped on 16 October.' },
  },
  tooltip: {
    open: { open: true, trigger: 'Copy id', text: 'Copy the order id' },
  },
  select: {
    placeholder: { label: 'Status', name: 'status', items: statuses, value: null },
    'open-selected': { label: 'Status', name: 'status', items: statuses, value: 'packed', open: true, active: 'packed' },
  },
  'dropdown-menu': {
    open: { label: 'Actions', trigger: 'Actions', items: actions, open: true, active: 'edit' },
  },
  toast: {
    info: { kind: 'info', title: 'Order saved', description: 'Order 1042 was updated.', open: true },
    'error-action': { kind: 'error', title: 'Payment failed', description: 'The card was declined.', action: 'Retry', open: true },
  },
});
