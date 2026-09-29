import { uiCheckboxView, type SpCheckboxProps as CoreProps } from '@silverpoint/core/ui';
import { forwardRef, type ChangeEvent, type ReactElement } from 'react';
import { useUi, useValue, type UiCellProps } from './base';
import { useNativeRef } from './checkable';
import { renderUi } from './render';

export interface SpCheckboxProps extends CoreProps, UiCellProps {
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly onChange?: (checked: boolean) => void;
}

/** `SpCheckbox`: a native checkbox, hidden for sight, in its `<label>`; its ref is the input. */
export const SpCheckbox = forwardRef<HTMLInputElement, SpCheckboxProps>(function SpCheckbox(
  { checked, defaultChecked, onChange, dashboardCell, ...props },
  ref,
) {
  const [current, set] = useValue(checked, defaultChecked ?? false, onChange);
  const view = uiCheckboxView(props, useUi(props, dashboardCell), { checked: current });
  const native = {
    ref: useNativeRef(ref, props.indeterminate === true),
    checked: current,
    onChange: (event: ChangeEvent<HTMLInputElement>) => set(event.target.checked),
  };
  return renderUi(view, { native }) as ReactElement;
});
