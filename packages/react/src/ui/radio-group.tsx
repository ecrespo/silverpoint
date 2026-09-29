import { uiRadioGroupView, uiRovingFocus, type SpRadioGroupProps as CoreProps, type UiElement } from '@silverpoint/core/ui';
import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useUi, useValue, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpRadioGroupProps extends CoreProps, UiCellProps {
  /** Controlled key; `null` checks none. */
  readonly value?: string | null;
  readonly defaultValue?: string | null;
  /** The key checked, not the DOM event (REQ-322). */
  readonly onChange?: (value: string) => void;
}

/** `SpRadioGroup`: a `<fieldset>` of native radios; arrows move and select through the core (REQ-315). */
export function SpRadioGroup({ value, defaultValue, onChange, dashboardCell, ...props }: SpRadioGroupProps) {
  const [current, set] = useValue<string | null>(value, defaultValue ?? null, onChange as (next: string | null) => void);
  const view = uiRadioGroupView(props, useUi(props, dashboardCell), { value: current });
  const native = (node: UiElement) => ({ checked: node.attrs.checked === true, onChange: (event: ChangeEvent<HTMLInputElement>) => set(event.target.value) });
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => uiRovingFocus(event, event.currentTarget, 'input.sp-ui-native', 'both', true);
  return renderUi(view, { root: { onKeyDown }, native }) as ReactElement;
}
