import { uiRateView, uiRovingFocus, type SpRateProps as CoreProps, type UiElement } from '@silverpoint/core/ui';
import type { ChangeEvent, KeyboardEvent, MouseEvent, ReactElement } from 'react';
import { useUi, useValue, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpRateProps extends CoreProps, UiCellProps {
  readonly value?: number;
  readonly defaultValue?: number;
  /** The number, not the DOM event (REQ-322). */
  readonly onChange?: (value: number) => void;
}

/** `SpRate`: native radios valued 1..count; read-only takes no click and no key (REQ-326). */
export function SpRate({ value, defaultValue, onChange, dashboardCell, ...props }: SpRateProps) {
  const [current, set] = useValue(value, defaultValue ?? 0, onChange);
  const view = uiRateView(props, useUi(props, dashboardCell), { value: current });
  const readOnly = props.readOnly === true;
  const native = (node: UiElement) => ({
    checked: node.attrs.checked === true,
    onChange: (event: ChangeEvent<HTMLInputElement>) => readOnly || set(Number(event.target.value)),
    onClick: readOnly ? (event: MouseEvent) => event.preventDefault() : undefined,
  });
  const onKeyDown = readOnly ? undefined : (event: KeyboardEvent<HTMLElement>) => uiRovingFocus(event, event.currentTarget, 'input.sp-ui-native', 'both', true);
  return renderUi(view, { root: { onKeyDown }, native }) as ReactElement;
}
