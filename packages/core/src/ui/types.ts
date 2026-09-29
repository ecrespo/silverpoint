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
  ground?: GroundRef;
  substrate?: SubstrateName;
  mode?: InkMode;
  /** Default `'md'`. */
  size?: UiSize;
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
  disabled?: boolean;
  /** Accessible name of an icon-only button (REQ-319). */
  label?: string;
  block?: boolean;
  /** Renders an `<a>`. */
  href?: string;
}

export interface SpInputProps extends CommonUiProps {
  type?: 'text' | 'search' | 'email' | 'url' | 'tel' | 'password' | 'number';
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  /** Sets `aria-invalid` and draws the exact ⚠ glyph (REQ-334). */
  invalid?: boolean;
  /** Help or error text under the control, referenced by `aria-describedby` (REQ-334). */
  message?: string;
  /** Accessible name, when no `<label for>` names the control. */
  label?: string;
}

export interface SpCheckboxProps extends CommonUiProps {
  label: string;
  name?: string;
  disabled?: boolean;
  indeterminate?: boolean;
}

export interface SpRadioGroupProps extends CommonUiProps {
  items: readonly UiItem[];
  /** Required: the native radios submit under it (REQ-323). */
  name: string;
  /** The group's name, its `<legend>`. */
  label: string;
  /** Default `'vertical'`. */
  orientation?: UiOrientation;
}

export interface SpSwitchProps extends CommonUiProps {
  label: string;
  name?: string;
  disabled?: boolean;
}

export interface SpSliderProps extends CommonUiProps {
  label: string;
  /** Default `0`. */
  min?: number;
  /** Default `100`. */
  max?: number;
  /** Default `1`. */
  step?: number;
  name?: string;
  disabled?: boolean;
  marks?: readonly number[];
}

export interface SpRateProps extends CommonUiProps {
  label: string;
  /** Default `5`, in 1..10; each mark an exact lozenge. */
  count?: number;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export interface SpSegmentedProps extends CommonUiProps {
  items: readonly UiItem[];
  label: string;
  name?: string;
  block?: boolean;
}

export interface SpTabsProps extends CommonUiProps {
  items: readonly UiItem[];
  label?: string;
  /** Default `'horizontal'`. */
  orientation?: UiOrientation;
  /** Default `'automatic'`: a tab is selected as focus reaches it. */
  activation?: 'automatic' | 'manual';
}

export interface SpStepsProps extends CommonUiProps {
  items: readonly StepItem[];
  /** 0-based. */
  current: number;
  /** Default `'horizontal'`. */
  orientation?: UiOrientation;
  label?: string;
}

export interface SpCardProps extends CommonUiProps {
  title?: string;
  /** Default `3`. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

export interface SpTagProps extends CommonUiProps {
  /** Tonal level, default `1`. */
  tone?: UiToneLevel;
  closable?: boolean;
  /** Default `'Remove'`. */
  closeLabel?: string;
}

export interface SpBadgeProps extends CommonUiProps {
  count?: number;
  /** Default `99`; above it the badge reads `99+`. */
  max?: number;
  dot?: boolean;
  label?: string;
}

export interface SpDividerProps extends CommonUiProps {
  /** Default `'horizontal'`. */
  orientation?: UiOrientation;
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
  title?: string;
  closable?: boolean;
  closeLabel?: string;
}

export interface SpSkeletonProps extends CommonUiProps {
  /** Default `3`, in 1..8. */
  lines?: number;
  avatar?: boolean;
  /** Default `'Loading'`. */
  label?: string;
}
