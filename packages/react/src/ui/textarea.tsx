import { uiTextareaView, type SpTextareaProps as CoreProps } from '@silverpoint/core/ui';
import { forwardRef, type ChangeEvent, type ReactElement } from 'react';
import { useUi, useValue, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpTextareaProps extends CoreProps, UiCellProps {
  /** Controlled value. */
  readonly value?: string;
  readonly defaultValue?: string;
  /** The new value, not the DOM event (REQ-322). */
  readonly onChange?: (value: string) => void;
}

/** `SpTextarea`: a native `<textarea>` on the `SpInput` contract; its ref is the textarea (REQ-484, REQ-488). */
export const SpTextarea = forwardRef<HTMLTextAreaElement, SpTextareaProps>(function SpTextarea({ value, defaultValue, onChange, dashboardCell, ...props }, ref) {
  const [current, set] = useValue(value, defaultValue ?? '', onChange);
  const view = uiTextareaView(props, useUi(props, dashboardCell), { value: current });
  const native = { ref, value: current, onChange: (event: ChangeEvent<HTMLTextAreaElement>) => set(event.target.value) };
  return renderUi(view, { native }) as ReactElement;
});
