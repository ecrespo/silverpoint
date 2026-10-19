import { uiStatisticView, type SpStatisticProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpStatisticProps extends CoreProps, UiCellProps {}

/** `SpStatistic`: the trend by an exact arrow and by text (REQ-479). `@silverpoint/react/server/ui/statistic` renders it in a Server Component. */
export function SpStatistic({ dashboardCell, ...props }: SpStatisticProps) {
  return renderUi(uiStatisticView(props, useUi(props, dashboardCell)), {}) as ReactElement;
}
