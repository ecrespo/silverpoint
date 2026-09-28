/** The catalog's groups (PRD §6.11), in the order the documentation lists them. */
export type UiGroup = 'actions' | 'data-entry' | 'navigation' | 'data-display' | 'feedback';

/** One UI component: every gate, fixture set and example page iterates this list. */
export interface UiComponentRow {
  /** Catalog name, as the PRD writes it. */
  readonly name: string;
  /** Kebab-case subpath: `@silverpoint/<adapter>/ui/<slug>`. */
  readonly slug: string;
  /** The exported name, the same in the three adapters (OQ-U2). */
  readonly component: string;
  readonly group: UiGroup;
  /** Declared states (Data Model §5); one fixture and one demo each. */
  readonly states: readonly string[];
}

const row = (name: string, group: UiGroup, states: readonly string[]): UiComponentRow =>
  Object.freeze({
    name,
    slug: name.replace(/[A-Z]/g, (m, i: number) => (i ? '-' : '') + m.toLowerCase()),
    component: `Sp${name}`,
    group,
    states: Object.freeze([...states]),
  });

/** The 17 components of `0.3.0` and their 45 declared states (REQ-300, Data Model §5). */
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
]);
