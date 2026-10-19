import type { InkMode, Seed, SubstrateName } from '../types/data';
import type { ToneLevel } from '../types/geometry';
import type { GroundRef } from '../types/ground';
import type { Palette } from '../palette/palette';
import type { UiFrameKind } from './frame';

/** Control size; heights come from the ground's `ui.controlHeight` (Data Model §3.8). */
export type UiSize = 'sm' | 'md' | 'lg';

/** Props every UI component takes, as `CommonChartProps` does for charts (API Spec §3). */
export interface CommonUiProps {
  /** The frame variant and every related id derive from it (REQ-307, REQ-329). */
  id?: string;
  /** Overrides `id` for the frame variant only. */
  seed?: Seed;
  /** Style ground. Defaults to the dashboard's, then the app provider's, or `silverpoint` (REQ-311). */
  ground?: GroundRef;
  /** Prepared substrate within the ground (REQ-046). */
  substrate?: SubstrateName;
  /** `ink` by default; `precision` disables inking (REQ-021, REQ-306). */
  mode?: InkMode;
  /** Colours over the ground's, merged over the dashboard's and the provider's (REQ-461, REQ-462). */
  palette?: Palette;
  /** Default `'md'`. */
  size?: UiSize;
  /** Added to the component's root element, after its own classes. */
  className?: string;
}

/** An item of Tabs, Segmented or RadioGroup; keys are unique (REQ-325). */
export interface UiItem {
  key: string;
  label: string;
  disabled?: boolean;
}

export type StepStatus = 'wait' | 'process' | 'finish' | 'error';

export interface StepItem {
  key: string;
  title: string;
  description?: string;
  /** Derived from `current` when omitted; `'error'` must be explicit. */
  status?: StepStatus;
}

/** Button emphasis. Not a tone: `tone` names only a level 1-4 of the ground's ramp (A-07). */
export type UiVariant = 'default' | 'primary' | 'danger';

export type AlertKind = 'info' | 'success' | 'warning' | 'error';

export type UiOrientation = 'horizontal' | 'vertical';

/** A tonal level a component may ask for; 0 (no fill) is not one. */
export type UiToneLevel = Exclude<ToneLevel, 0>;

/*
 * Each component's own props, framework-neutral (API delta §2). Value binding —`value` with
 * `onChange`, `v-model`, `[(value)]`— and slots are each adapter's idiom, so they are not here.
 */

export interface SpButtonProps extends CommonUiProps {
  /** Default `'default'`; `danger` also draws the exact ✕ glyph (REQ-310). */
  variant?: UiVariant;
  /** Default `'button'`. */
  type?: 'button' | 'submit' | 'reset';
  /** Not focusable, not submitted; drawn with the disabled tone. */
  disabled?: boolean;
  /** Accessible name of an icon-only button (REQ-319). */
  label?: string;
  /** Fills the width of its container. */
  block?: boolean;
  /** Renders an `<a>`. */
  href?: string;
}

export interface SpInputProps extends CommonUiProps {
  /** Native input type. Default `'text'`. */
  type?: 'text' | 'search' | 'email' | 'url' | 'tel' | 'password' | 'number';
  /** Hint shown while empty; not a substitute for the accessible name. */
  placeholder?: string;
  /** Form field name; the native input submits under it (REQ-323). */
  name?: string;
  /** Not focusable and not submitted. */
  disabled?: boolean;
  /** Focusable and submitted, but not editable. */
  readOnly?: boolean;
  /** Sets `aria-invalid` and draws the exact ⚠ glyph (REQ-334). */
  invalid?: boolean;
  /** Help or error text under the control, referenced by `aria-describedby` (REQ-334). */
  message?: string;
  /** Accessible name, when no `<label for>` names the control. */
  label?: string;
}

export interface SpCheckboxProps extends CommonUiProps {
  /** The visible text and accessible name. */
  label: string;
  /** Form field name; submitted as `on` when checked. */
  name?: string;
  /** Not focusable and not submitted. */
  disabled?: boolean;
  /** Draws the exact dash and sets the native `indeterminate` state. */
  indeterminate?: boolean;
}

export interface SpRadioGroupProps extends CommonUiProps {
  /** The choices; each a native radio. Keys are unique (REQ-325). */
  items: readonly UiItem[];
  /** Required: the native radios submit under it (REQ-323). */
  name: string;
  /** The group's name, its `<legend>`. */
  label: string;
  /** Default `'vertical'`. */
  orientation?: UiOrientation;
}

export interface SpSwitchProps extends CommonUiProps {
  /** The visible text and accessible name. */
  label: string;
  /** Form field name; submitted as `on` when on. */
  name?: string;
  /** Not focusable and not submitted. */
  disabled?: boolean;
}

export interface SpSliderProps extends CommonUiProps {
  /** Accessible name of the native range input. */
  label: string;
  /** Default `0`. */
  min?: number;
  /** Default `100`. */
  max?: number;
  /** Default `1`. */
  step?: number;
  /** Form field name; the native input submits under it. */
  name?: string;
  /** Not focusable and not submitted. */
  disabled?: boolean;
  /** Values on the rail that get a labelled mark. */
  marks?: readonly number[];
}

export interface SpRateProps extends CommonUiProps {
  /** The group's name, its `<legend>`. */
  label: string;
  /** Default `5`, in 1..10; each mark an exact lozenge. */
  count?: number;
  /** Form field name; the native radios submit under it. */
  name?: string;
  /** Not focusable and not submitted. */
  disabled?: boolean;
  /** Shows the value; the keyboard and the pointer do not change it. */
  readOnly?: boolean;
}

export interface SpSegmentedProps extends CommonUiProps {
  /** The options; each a native radio. Keys are unique (REQ-325). */
  items: readonly UiItem[];
  /** The control's name, its `<legend>`. */
  label: string;
  /** Form field name; the native radios submit under it. */
  name?: string;
  /** Fills the width of its container. */
  block?: boolean;
}

export interface SpTabsProps extends CommonUiProps {
  /** The tabs; a disabled one is skipped by the arrows. Keys are unique (REQ-325). */
  items: readonly UiItem[];
  /** Accessible name of the tab list. */
  label?: string;
  /** Default `'horizontal'`. */
  orientation?: UiOrientation;
  /** Default `'automatic'`: a tab is selected as focus reaches it. */
  activation?: 'automatic' | 'manual';
}

export interface SpStepsProps extends CommonUiProps {
  /** The steps, in order; a status is derived from `current` unless set. */
  items: readonly StepItem[];
  /** 0-based. */
  current: number;
  /** Default `'horizontal'`. */
  orientation?: UiOrientation;
  /** Accessible name of the list. */
  label?: string;
}

export interface SpCardProps extends CommonUiProps {
  /** Heading of the card; without it the card is a plain container. */
  title?: string;
  /** Default `3`. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

export interface SpTagProps extends CommonUiProps {
  /** Tonal level, default `1`. */
  tone?: UiToneLevel;
  /** Adds a native close button; each adapter raises its close event. */
  closable?: boolean;
  /** Accessible name of the close button. Default `Remove <text>`. */
  closeLabel?: string;
}

export interface SpBadgeProps extends CommonUiProps {
  /** The number shown, up to `max`. */
  count?: number;
  /** Default `99`; above it the badge reads `99+`. */
  max?: number;
  /** A dot with no number. */
  dot?: boolean;
  /** Accessible text of the badge, e.g. `unread messages`. */
  label?: string;
}

export interface SpDividerProps extends CommonUiProps {
  /** Default `'horizontal'`. */
  orientation?: UiOrientation;
  /** A caption set in the rule. */
  text?: string;
  /** Default `'center'`. */
  align?: 'start' | 'center' | 'end';
}

export interface SpProgressProps extends CommonUiProps {
  /** 0..100; omitted, the progress is indeterminate. */
  value?: number;
  /** Default `'line'`. */
  shape?: 'line' | 'circle';
  /** Accessible name (REQ-318). */
  label: string;
  /** Default `true`. */
  showValue?: boolean;
}

export interface SpAlertProps extends CommonUiProps {
  /** Default `'info'`. */
  kind?: AlertKind;
  /** Bold first line of the alert. */
  title?: string;
  /** Adds a native close button; each adapter raises its close event. */
  closable?: boolean;
  /** Accessible name of the close button. Default `'Close'`. */
  closeLabel?: string;
}

export interface SpSkeletonProps extends CommonUiProps {
  /** Default `3`, in 1..8. */
  lines?: number;
  /** Draws an avatar placeholder before the lines. */
  avatar?: boolean;
  /** Default `'Loading'`. */
  label?: string;
}

/*
 * The composed components (feature-004, API delta §2): built from the surface, frame, tone and
 * glyph pieces above, on the same root contract.
 */

export interface SpSurfaceProps extends CommonUiProps {
  /** The element, a lowercase HTML tag name. Default `'div'`. */
  as?: string;
  /** Adds the class `sp-<name>`, a lowercase ident. */
  name?: string;
  /** Draws a frame of that kind. */
  frame?: UiFrameKind;
  /** Lays a tone: a level 1-4 of the ramp, or a state (`selected`, `primary`…). */
  tone?: UiToneLevel | string;
}

export interface SpGlyphProps extends CommonUiProps {
  /** A key of `UI_GLYPHS`. */
  glyph: string;
}

export interface TableColumn {
  readonly key: string;
  /** The key when omitted. */
  readonly title?: string;
  readonly align?: 'start' | 'center' | 'end';
  readonly sortable?: boolean;
  /** CSS length; written as an inline width on the header cell. */
  readonly width?: string;
}

export interface SpTableProps extends CommonUiProps {
  /** The columns, in order; each names the key it reads from a row. */
  columns: readonly TableColumn[];
  /** The rows, drawn as given: the consumer sorts them (DD-040). */
  data: readonly Readonly<Record<string, unknown>>[];
  /** The table's `<caption>`, its accessible name. */
  caption?: string;
  /** A sortable column's key; another key sorts nothing, silently. */
  sortKey?: string;
  /** Default `'asc'`. */
  sortOrder?: 'asc' | 'desc';
  /** Default `false`. */
  striped?: boolean;
  /** Default `true`. */
  hoverable?: boolean;
  /** Default `true`. */
  bordered?: boolean;
  /** Default `'No data'`. */
  emptyText?: string;
  /** The column whose value keys each row. */
  rowKey?: string;
}

export interface SpPaginationProps extends CommonUiProps {
  /** The number of items paged over. */
  total: number;
  /** Default `10`. */
  pageSize?: number;
  /** Pages shown on each side of the current one. Default `1`. */
  siblings?: number;
  /** Default `false`. */
  showTotal?: boolean;
  /** Default `'{start}–{end} of {total}'`. */
  totalTemplate?: string;
  /** Default `'Pagination'`. */
  label?: string;
  /** Default `'Previous page'`. */
  previousLabel?: string;
  /** Default `'Next page'`. */
  nextLabel?: string;
  /** Default `'Page'`. */
  pageLabel?: string;
  /** Every page button disabled. */
  disabled?: boolean;
}

export interface BreadcrumbItem {
  readonly key?: string;
  readonly label: string;
  readonly href?: string;
}

export interface SpBreadcrumbProps extends CommonUiProps {
  /** The last item is the current page. */
  items: readonly BreadcrumbItem[];
  /** Default `'Breadcrumb'`. */
  label?: string;
}

export interface SpAvatarProps extends CommonUiProps {
  /** An image; the initials are drawn without one. */
  src?: string;
  /** The person's name: the accessible name and the source of the initials. */
  name?: string;
  /** Overrides the initials derived from `name`. */
  initials?: string;
  /** Overrides `name` as the accessible name. */
  alt?: string;
  /** Default `'circle'`. */
  shape?: 'circle' | 'square';
  /** Side length in px; the ground's control height when omitted. */
  pixelSize?: number;
}

export interface SpAvatarGroupProps extends CommonUiProps {
  label?: string;
}

export interface SpStatisticProps extends CommonUiProps {
  /** The label above the value. */
  title: string;
  /** Printed as given. */
  value: string | number;
  /** Printed before the value (`$`). */
  prefix?: string;
  /** Printed after the value (`%`). */
  suffix?: string;
  /** Draws the exact ↑ or ↓ glyph beside the delta. */
  trend?: 'up' | 'down';
  /** The change, as text (`+4.2%`). */
  delta?: string;
}

export interface DescriptionItem {
  readonly key?: string;
  readonly label: string;
  readonly value: string;
}

export interface SpDescriptionsProps extends CommonUiProps {
  /** The label–value pairs, a `<dl>`. Keys, when given, are unique (REQ-325). */
  items: readonly DescriptionItem[];
  /** A heading above the list, at `headingLevel`. */
  title?: string;
  /** Default `3`, in 1..6. */
  columns?: number;
  /** Default `true`. */
  bordered?: boolean;
  /** Default `3`. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

export interface TimelineListItem {
  readonly key?: string;
  readonly title: string;
  readonly time?: string;
  readonly description?: string;
  /** Default `'done'`; at most one `current`. */
  readonly status?: 'done' | 'current' | 'pending' | 'error';
}

export interface SpTimelineListProps extends CommonUiProps {
  /** The events, in reading order. */
  items: readonly TimelineListItem[];
  /** Accessible name of the list. */
  label?: string;
}

export interface SpCollapseProps extends CommonUiProps {
  /** One item open at a time, natively (`<details name>`). Default `false`. */
  accordion?: boolean;
  /** Default `true`. */
  bordered?: boolean;
}

export interface SpCollapseItemProps extends CommonUiProps {
  title: string;
  disabled?: boolean;
}

export interface SpEmptyProps extends CommonUiProps {
  /** Default `'No data'`. */
  description?: string;
}

export interface SpResultProps extends CommonUiProps {
  /** Default `'info'`. */
  status?: AlertKind;
  /** The heading, at `headingLevel`. */
  title: string;
  /** A paragraph under the title. */
  subtitle?: string;
  /** Default `3`. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

export interface SpTextareaProps extends CommonUiProps {
  /** Default `3`. */
  rows?: number;
  /** Hint shown while empty; not a substitute for the accessible name. */
  placeholder?: string;
  /** Accessible name, when no `<label for>` names the control. */
  label?: string;
  /** Help or error text under the control, referenced by `aria-describedby` (REQ-334). */
  message?: string;
  /** Sets `aria-invalid` and draws the exact ⚠ glyph (REQ-334). */
  invalid?: boolean;
  /** Not focusable and not submitted. */
  disabled?: boolean;
  /** Focusable and submitted, but not editable. */
  readOnly?: boolean;
  /** The native limit; the counter shows it with `showCount`. */
  maxLength?: number;
  /** Default `false`. */
  showCount?: boolean;
  /** Form field name; the native textarea submits under it (REQ-323). */
  name?: string;
}

export interface SpInputNumberProps extends CommonUiProps {
  /** The lowest value; the value is clamped to it (REQ-485). */
  min?: number;
  /** The highest value; the value is clamped to it (REQ-485). */
  max?: number;
  /** Default `1`. */
  step?: number;
  /** Decimals. */
  precision?: number;
  /** Hint shown while empty; not a substitute for the accessible name. */
  placeholder?: string;
  /** Accessible name, when no `<label for>` names the control. */
  label?: string;
  /** Help or error text under the control, referenced by `aria-describedby` (REQ-334). */
  message?: string;
  /** Sets `aria-invalid` and draws the exact ⚠ glyph (REQ-334). */
  invalid?: boolean;
  /** Not focusable and not submitted; the steppers are disabled too. */
  disabled?: boolean;
  /** Focusable and submitted, but not editable. */
  readOnly?: boolean;
  /** Form field name; the native input submits under it (REQ-323). */
  name?: string;
  /** Default `'Decrease'`. */
  decrementLabel?: string;
  /** Default `'Increase'`. */
  incrementLabel?: string;
}

/*
 * The overlays (feature-004, API delta §2): native `<dialog>` and the Popover API; the open state
 * is each adapter's binding (`open` + open-change), so it is not here.
 */

export interface SpModalProps extends CommonUiProps {
  /** The heading, `${id}--title`, that names the dialog. */
  title?: string;
  /** A paragraph, `${id}--description`, that describes the dialog. */
  description?: string;
  /** Accessible name without a title (REQ-501). */
  label?: string;
  /** Default `true`. */
  closable?: boolean;
  /** Default `'Close'`. */
  closeLabel?: string;
  /** CSS length. Default `'520px'` (from `ui.css`). */
  width?: string;
  /** Escape and a backdrop click close it. Default `true`. */
  dismissible?: boolean;
}

export interface SpDrawerProps extends Omit<SpModalProps, 'width'> {
  /** Default `'end'`. */
  side?: 'start' | 'end' | 'top' | 'bottom';
  /** CSS length across the side. Default `'380px'` (start/end) or `'320px'` (top/bottom). */
  extent?: string;
  /** `false` opens with `show()`. Default `true`. */
  modal?: boolean;
}

export interface SpPopoverProps extends CommonUiProps {
  /** A heading that names the popover. */
  title?: string;
  /** Accessible name without a title. */
  label?: string;
  /** Default `'bottom'`. */
  side?: 'top' | 'end' | 'bottom' | 'start';
  /** Default `'center'`. */
  align?: 'start' | 'center' | 'end';
  /** Default `6`. */
  offset?: number;
  /** Default `false`. */
  closable?: boolean;
  /** Default `'Close'`. */
  closeLabel?: string;
  /** CSS length. Default `'320px'` (from `ui.css`). */
  width?: string;
}

export interface SpTooltipProps extends CommonUiProps {
  /** The tooltip, the trigger's accessible description. */
  text: string;
  /** Default `'top'`. */
  side?: 'top' | 'end' | 'bottom' | 'start';
  /** Default `'center'`. */
  align?: 'start' | 'center' | 'end';
  /** Default `6`. */
  offset?: number;
  /** Default `300` ms. */
  delay?: number;
}

export interface SpSelectProps extends CommonUiProps {
  /** A string is its own key and label. */
  items: readonly (string | UiItem)[];
  /** Default `'Select…'`. */
  placeholder?: string;
  /** Accessible name of the combobox. */
  label: string;
  /** Not focusable and not submitted. */
  disabled?: boolean;
  /** Sets `aria-required` on the combobox. */
  required?: boolean;
  /** Submits the key under this name, from a hidden input (REQ-323). */
  name?: string;
  /** CSS length. Default `'180px'` (from `ui.css`). */
  width?: string;
}

export type MenuEntry =
  | { readonly key: string; readonly label: string; readonly shortcut?: string; readonly disabled?: boolean; readonly danger?: boolean; readonly type?: 'item' }
  | { readonly type: 'separator'; readonly key: string }
  | { readonly type: 'label'; readonly key: string; readonly label: string };

export interface SpDropdownMenuProps extends CommonUiProps {
  /** Items, separators and labels, in order. Keys are unique (REQ-325). */
  items: readonly MenuEntry[];
  /** The menu's accessible name and the trigger's text when no trigger slot. */
  label: string;
  /** Default `'bottom'`. */
  side?: 'top' | 'end' | 'bottom' | 'start';
  /** Default `'start'`. */
  align?: 'start' | 'center' | 'end';
}

export interface SpToastProps extends CommonUiProps {
  /** The toast's first line. */
  title: string;
  /** A line under the title. */
  description?: string;
  /** Default `'info'`. */
  kind?: AlertKind;
  /** ms, at least 1000, or `Infinity`; the toaster's when omitted. */
  duration?: number;
  /** Default `'Dismiss'`. */
  closeLabel?: string;
}

export interface SpToasterProps extends CommonUiProps {
  /** Default `'bottom-end'`. */
  position?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';
  /** Default `5000` ms. */
  duration?: number;
  /** Default `'Notifications'`. */
  label?: string;
}
