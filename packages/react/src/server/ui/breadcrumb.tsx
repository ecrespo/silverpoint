import type { ReactElement } from 'react';
import { resolveUi, uiBreadcrumbView } from '@silverpoint/core/ui';
import type { SpBreadcrumbProps } from '../../ui/breadcrumb';
import { renderUi } from '../../ui/render';

export type { SpBreadcrumbProps };

/** `SpBreadcrumb` for React Server Components (REQ-104): props and dashboard cell only, no provider. */
export function SpBreadcrumb({ dashboardCell, ...props }: SpBreadcrumbProps) {
  return renderUi(uiBreadcrumbView(props, resolveUi(props, { cell: dashboardCell?.config })), {}) as ReactElement;
}
