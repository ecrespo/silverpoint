import type { ReactElement } from 'react';
import { uiDividerView, type SpDividerProps as CoreProps } from '@silverpoint/core/ui';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpDividerProps extends CoreProps, UiCellProps {}

/** `SpDivider`: reads the provider; `@silverpoint/react/server/ui/divider` renders it in a Server Component. */
export function SpDivider({ dashboardCell, ...props }: SpDividerProps) {
  return renderUi(uiDividerView(props, useUi(props, dashboardCell)), {}) as ReactElement;
}
