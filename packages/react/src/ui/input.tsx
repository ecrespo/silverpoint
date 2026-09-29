import { uiInputView, type SpInputProps as CoreProps } from '@silverpoint/core/ui';
import { forwardRef, type ChangeEvent, type ReactNode, type ReactElement } from 'react';
import { useUi, useValue, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpInputProps extends CoreProps, UiCellProps {
  /** Controlled value. */
  readonly value?: string;
  readonly defaultValue?: string;
  /** The new value, not the DOM event (REQ-322). */
  readonly onChange?: (value: string) => void;
  readonly prefix?: ReactNode;
  readonly suffix?: ReactNode;
}

/** `SpInput`: a native `<input>` in a framed box; its ref is the input (REQ-314, REQ-334). */
export const SpInput = forwardRef<HTMLInputElement, SpInputProps>(function SpInput(
  { value, defaultValue, onChange, prefix, suffix, dashboardCell, ...props },
  ref,
) {
  const [current, set] = useValue(value, defaultValue ?? '', onChange);
  const view = uiInputView(props, useUi(props, dashboardCell), { value: current, prefix: prefix != null, suffix: suffix != null });
  const native = { ref, value: current, onChange: (event: ChangeEvent<HTMLInputElement>) => set(event.target.value) };
  return renderUi(view, { native, slots: { prefix, suffix } }) as ReactElement;
});
