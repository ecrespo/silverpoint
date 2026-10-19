import { uiTimelineListView, type SpTimelineListProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpTimelineListProps extends CoreProps, UiCellProps {}

/** `SpTimelineList`: an ordered list; each status by its mark's shape (REQ-481). `@silverpoint/react/server/ui/timeline-list` renders it in a Server Component. */
export function SpTimelineList({ dashboardCell, ...props }: SpTimelineListProps) {
  return renderUi(uiTimelineListView(props, useUi(props, dashboardCell)), {}) as ReactElement;
}
