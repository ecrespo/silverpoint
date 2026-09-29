import { uiRovingFocus, uiSegmentedView, type SpSegmentedProps as CoreProps, type UiElement } from '@silverpoint/core/ui';
import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useUi, useValue, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpSegmentedProps extends CoreProps, UiCellProps {
  /** Controlled key; an unknown one shows the first enabled segment. */
  readonly value?: string;
  readonly defaultValue?: string;
  /** The key selected, not the DOM event (REQ-322). */
  readonly onChange?: (value: string) => void;
}

/** `SpSegmented`: native radios in one frame; arrows move and select through the core (REQ-315). */
export function SpSegmented({ value, defaultValue, onChange, dashboardCell, ...props }: SpSegmentedProps) {
  const [current, set] = useValue<string | undefined>(value, defaultValue, onChange as (next: string | undefined) => void);
  const view = uiSegmentedView(props, useUi(props, dashboardCell), { value: current ?? null });
  const native = (node: UiElement) => ({ checked: node.attrs.checked === true, onChange: (event: ChangeEvent<HTMLInputElement>) => set(event.target.value) });
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => uiRovingFocus(event, event.currentTarget, 'input.sp-ui-native', 'both', true);
  return renderUi(view, { root: { onKeyDown }, native }) as ReactElement;
}
