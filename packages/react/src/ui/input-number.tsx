import { uiInputNumberView, uiNumberStep, uiNumberValue, type SpInputNumberProps as CoreProps, type UiElement } from '@silverpoint/core/ui';
import { forwardRef, useState, type ChangeEvent, type KeyboardEvent, type ReactElement } from 'react';
import { useUi, useValue, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpInputNumberProps extends CoreProps, UiCellProps {
  /** Controlled value; `null` is an empty field. */
  readonly value?: number | null;
  readonly defaultValue?: number | null;
  /** The committed value, clamped and rounded by the core; `null` when emptied (REQ-485). */
  readonly onChange?: (value: number | null) => void;
}

/**
 * `SpInputNumber`: a native number input between exact steppers (REQ-485, REQ-488). What is typed
 * is held as text until committed (blur or Enter), so a bound never interrupts typing; the
 * committed value is the core's `uiNumberValue`, a stepper's the core's `uiNumberStep`.
 */
export const SpInputNumber = forwardRef<HTMLInputElement, SpInputNumberProps>(function SpInputNumber({ value, defaultValue, onChange, dashboardCell, ...props }, ref) {
  const [current, set] = useValue(value, defaultValue ?? null, onChange);
  const [draft, setDraft] = useState<string | null>(null);
  const view = uiInputNumberView(props, useUi(props, dashboardCell), { value: current });
  const commit = () => {
    if (draft === null) return;
    setDraft(null);
    set(draft.trim() === '' ? null : uiNumberValue(Number(draft), props).value);
  };
  const native = (node: UiElement) => ({
    ref,
    value: draft ?? node.attrs.value,
    onChange: (event: ChangeEvent<HTMLInputElement>) => setDraft(event.target.value),
    onBlur: commit,
    onKeyDown: (event: KeyboardEvent) => event.key === 'Enter' && commit(),
  });
  const stepper = (node: UiElement) => ({
    onClick: () => {
      setDraft(null);
      set(uiNumberStep(current, node.attrs['data-step'] === '1' ? 1 : -1, props));
    },
  });
  return renderUi(view, { native, bound: { stepper } }) as ReactElement;
});
