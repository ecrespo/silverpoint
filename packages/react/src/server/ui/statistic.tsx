import type { ReactElement } from 'react';
import { resolveUi, uiStatisticView } from '@silverpoint/core/ui';
import type { SpStatisticProps } from '../../ui/statistic';
import { renderUi } from '../../ui/render';

export type { SpStatisticProps };

/** `SpStatistic` for React Server Components (REQ-104): props and dashboard cell only, no provider. */
export function SpStatistic({ dashboardCell, ...props }: SpStatisticProps) {
  return renderUi(uiStatisticView(props, resolveUi(props, { cell: dashboardCell?.config })), {}) as ReactElement;
}
