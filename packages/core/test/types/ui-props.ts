/**
 * Compiled by `ui-catalog.test.ts`, never run. Every `@ts-expect-error` must be consumed: an
 * unused one is itself an error, so relaxing a required prop turns the test red (T-135).
 */
import type {
  SpAlertProps,
  SpBadgeProps,
  SpButtonProps,
  SpCheckboxProps,
  SpProgressProps,
  SpRadioGroupProps,
  SpRateProps,
  SpSegmentedProps,
  SpSliderProps,
  SpStepsProps,
  SpSwitchProps,
  SpTabsProps,
  SpTagProps,
  UiItem,
} from '../../src/ui';

const items: UiItem[] = [{ key: 'day', label: 'Day' }];

export const valid = [
  {} satisfies SpButtonProps,
  { variant: 'danger', type: 'submit' } satisfies SpButtonProps,
  { label: 'Baseline' } satisfies SpCheckboxProps,
  { items, name: 'ground', label: 'Ground' } satisfies SpRadioGroupProps,
  { label: 'Precision' } satisfies SpSwitchProps,
  { label: 'Volume', min: 0, max: 100, step: 5, marks: [0, 50, 100] } satisfies SpSliderProps,
  { label: 'Quality', count: 5 } satisfies SpRateProps,
  { items, label: 'Period' } satisfies SpSegmentedProps,
  { items, activation: 'manual' } satisfies SpTabsProps,
  { items: [{ key: 'install', title: 'Install' }], current: 0 } satisfies SpStepsProps,
  { tone: 3, closable: true } satisfies SpTagProps,
  { count: 120, max: 99 } satisfies SpBadgeProps,
  { label: 'Upload', shape: 'circle', value: 72 } satisfies SpProgressProps,
  { kind: 'error', title: 'Build failed' } satisfies SpAlertProps,
];

// @ts-expect-error — a RadioGroup needs `name` for native form submission (REQ-323)
export const radioWithoutName: SpRadioGroupProps = { items, label: 'Ground' };
// @ts-expect-error — a RadioGroup needs `items`
export const radioWithoutItems: SpRadioGroupProps = { name: 'ground', label: 'Ground' };
// @ts-expect-error — a Checkbox needs `label`
export const checkboxWithoutLabel: SpCheckboxProps = {};
// @ts-expect-error — a Switch needs `label`
export const switchWithoutLabel: SpSwitchProps = {};
// @ts-expect-error — a Slider needs `label`
export const sliderWithoutLabel: SpSliderProps = { min: 0 };
// @ts-expect-error — a Rate needs `label`
export const rateWithoutLabel: SpRateProps = { count: 5 };
// @ts-expect-error — a Segmented needs `label`
export const segmentedWithoutLabel: SpSegmentedProps = { items };
// @ts-expect-error — Tabs need `items`
export const tabsWithoutItems: SpTabsProps = {};
// @ts-expect-error — Steps need `current`
export const stepsWithoutCurrent: SpStepsProps = { items: [] };
// @ts-expect-error — a Progress needs `label`, its accessible name (REQ-318)
export const progressWithoutLabel: SpProgressProps = { value: 40 };
// @ts-expect-error — `tone` is not a Button prop: emphasis is `variant` (A-07)
export const buttonWithTone: SpButtonProps = { tone: 'primary' };
// @ts-expect-error — a Tag tone is a ramp level 1-4
export const tagToneZero: SpTagProps = { tone: 0 };
