import { uiSwitchView, type SpSwitchProps as CoreProps } from '@silverpoint/core/ui';
import { forwardRef, type ChangeEvent, type ReactElement } from 'react';
import { useUi, useValue, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpSwitchProps extends CoreProps, UiCellProps {
  readonly checked?: boolean;
  readonly defaultChecked?: boolean;
  readonly onChange?: (checked: boolean) => void;
}

/** `SpSwitch`: a native checkbox with `role="switch"`; its ref is the input. */
export const SpSwitch = forwardRef<HTMLInputElement, SpSwitchProps>(function SpSwitch({ checked, defaultChecked, onChange, dashboardCell, ...props }, ref) {
  const [current, set] = useValue(checked, defaultChecked ?? false, onChange);
  const view = uiSwitchView(props, useUi(props, dashboardCell), { checked: current });
  const native = { ref, checked: current, onChange: (event: ChangeEvent<HTMLInputElement>) => set(event.target.checked) };
  return renderUi(view, { native }) as ReactElement;
});
