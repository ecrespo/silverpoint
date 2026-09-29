import { uiSliderView, type SpSliderProps as CoreProps } from '@silverpoint/core/ui';
import { forwardRef, type ChangeEvent, type ReactElement } from 'react';
import { useUi, useValue, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpSliderProps extends CoreProps, UiCellProps {
  readonly value?: number;
  readonly defaultValue?: number;
  /** The number, not the DOM event (REQ-322). */
  readonly onChange?: (value: number) => void;
}

/** `SpSlider`: a native range over the exact drawing; its ref is the input (REQ-314, DD-025). */
export const SpSlider = forwardRef<HTMLInputElement, SpSliderProps>(function SpSlider({ value, defaultValue, onChange, dashboardCell, ...props }, ref) {
  const [current, set] = useValue(value, defaultValue ?? props.min ?? 0, onChange);
  const view = uiSliderView(props, useUi(props, dashboardCell), { value: current });
  const native = { ref, onChange: (event: ChangeEvent<HTMLInputElement>) => set(event.target.valueAsNumber) };
  return renderUi(view, { native }) as ReactElement;
});
