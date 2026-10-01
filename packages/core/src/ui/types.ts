import type { InkMode, Seed, SubstrateName } from '../types/data';
import type { ToneLevel } from '../types/geometry';
import type { GroundRef } from '../types/ground';

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
