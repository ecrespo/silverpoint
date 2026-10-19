import type { ReactElement } from 'react';
import { resolveUi, uiTimelineListView } from '@silverpoint/core/ui';
import type { SpTimelineListProps } from '../../ui/timeline-list';
import { renderUi } from '../../ui/render';

export type { SpTimelineListProps };

/** `SpTimelineList` for React Server Components (REQ-104): props and dashboard cell only, no provider. */
export function SpTimelineList({ dashboardCell, ...props }: SpTimelineListProps) {
  return renderUi(uiTimelineListView(props, resolveUi(props, { cell: dashboardCell?.config })), {}) as ReactElement;
}
