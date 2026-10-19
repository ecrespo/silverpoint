/** The catalog's groups (PRD §6.11), in the order the documentation lists them. */
export type UiGroup = 'actions' | 'data-entry' | 'navigation' | 'data-display' | 'feedback' | 'building-blocks' | 'disclosure' | 'overlays';

/** `ui`: the 17 of `0.3.0`; `composed` and `overlay`: feature-004's (API delta §2). */
export type UiFamily = 'ui' | 'composed' | 'overlay';

/** One UI component: every gate, fixture set and example page iterates this list. */
export interface UiComponentRow {
  /** Catalog name, as the PRD writes it. */
  readonly name: string;
  /** Kebab-case subpath: `@silverpoint/<adapter>/ui/<slug>`. */
  readonly slug: string;
  /** The exported name, the same in the three adapters (OQ-U2). */
  readonly component: string;
  readonly group: UiGroup;
  readonly family: UiFamily;
  /** The batch that implements it: step 6c (`B*`) or step 8d (`A1`, `A2`, `B`) (plan-and-tasks.md). */
  readonly batch: 'B1' | 'B2' | 'B3' | 'A1' | 'A2' | 'B';
  /** Declared states (Data Model §5); one fixture and one demo each. */
  readonly states: readonly string[];
}

const BATCH: Readonly<Record<string, UiComponentRow['batch']>> = {
  Button: 'B1', Input: 'B1', Checkbox: 'B1', Switch: 'B1', Card: 'B1', Divider: 'B1',
  RadioGroup: 'B2', Segmented: 'B2', Tabs: 'B2', Slider: 'B2', Rate: 'B2',
};

const row = (
  name: string,
  group: UiGroup,
  states: readonly string[],
  family: UiFamily = 'ui',
  batch: UiComponentRow['batch'] = BATCH[name] ?? 'B3',
): UiComponentRow =>
  Object.freeze({
    name,
    batch,
    slug: name.replace(/[A-Z]/g, (m, i: number) => (i ? '-' : '') + m.toLowerCase()),
    component: `Sp${name}`,
    group,
    family,
    states: Object.freeze([...states]),
  });
const composed = (name: string, group: UiGroup, batch: 'A1' | 'A2', states: readonly string[]) => row(name, group, states, 'composed', batch);
const overlay = (name: string, states: readonly string[]) => row(name, 'overlays', states, 'overlay', 'B');

/**
 * The 17 components of `0.3.0` and their 45 declared states (REQ-300), then the 21 of feature-004
 * and their 35 (REQ-470, Data Model delta §5). `SpTimeline` is not a row: it lives on its own
 * subpath, with one fixture of its own.
 */
export const UI_COMPONENTS: readonly UiComponentRow[] = /* @__PURE__ */ Object.freeze([
  row('Button', 'actions', ['default', 'primary', 'danger', 'disabled']),
  row('Input', 'data-entry', ['empty', 'filled', 'invalid', 'disabled']),
  row('Checkbox', 'data-entry', ['unchecked', 'checked', 'indeterminate', 'disabled']),
  row('RadioGroup', 'data-entry', ['selected', 'disabled-item']),
  row('Switch', 'data-entry', ['off', 'on', 'disabled']),
  row('Slider', 'data-entry', ['marks', 'disabled']),
  row('Rate', 'data-entry', ['three', 'read-only']),
  row('Segmented', 'data-entry', ['first', 'middle']),
  row('Tabs', 'navigation', ['first', 'disabled-tab']),
  row('Steps', 'navigation', ['current', 'error']),
  row('Card', 'data-display', ['plain', 'titled']),
  row('Tag', 'data-display', ['tone-1', 'closable']),
  row('Badge', 'data-display', ['count', 'dot', 'overflow']),
  row('Divider', 'data-display', ['plain', 'text']),
  row('Progress', 'feedback', ['line', 'circle', 'indeterminate']),
  row('Alert', 'feedback', ['info', 'success', 'warning', 'error']),
  row('Skeleton', 'feedback', ['paragraph', 'avatar']),
  composed('Surface', 'building-blocks', 'A1', ['frame-card', 'tone-2']),
  composed('Glyph', 'building-blocks', 'A1', ['all']),
  composed('Table', 'data-display', 'A1', ['plain', 'sorted-striped', 'empty']),
  composed('Pagination', 'navigation', 'A2', ['middle', 'total']),
  composed('Breadcrumb', 'navigation', 'A1', ['three']),
  composed('Avatar', 'data-display', 'A1', ['initials', 'square', 'group']),
  composed('Statistic', 'data-display', 'A1', ['plain', 'trend-down']),
  composed('Descriptions', 'data-display', 'A1', ['bordered', 'plain']),
  composed('TimelineList', 'data-display', 'A1', ['mixed']),
  composed('Collapse', 'disclosure', 'A2', ['one-open', 'accordion-disabled']),
  composed('Empty', 'data-display', 'A1', ['plain']),
  composed('Result', 'data-display', 'A1', ['success', 'error']),
  composed('Textarea', 'data-entry', 'A2', ['count', 'invalid']),
  composed('InputNumber', 'data-entry', 'A2', ['value', 'at-min']),
  overlay('Modal', ['open']),
  overlay('Drawer', ['end-open']),
  overlay('Popover', ['open']),
  overlay('Tooltip', ['open']),
  overlay('Select', ['placeholder', 'open-selected']),
  overlay('DropdownMenu', ['open']),
  overlay('Toast', ['info', 'error-action']),
]);
