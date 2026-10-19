import { uiBreadcrumbView, type SpBreadcrumbProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpBreadcrumbProps extends CoreProps, UiCellProps {}

/** `SpBreadcrumb`: a labelled nav; the last item is the current page (REQ-477). `@silverpoint/react/server/ui/breadcrumb` renders it in a Server Component. */
export function SpBreadcrumb({ dashboardCell, ...props }: SpBreadcrumbProps) {
  return renderUi(uiBreadcrumbView(props, useUi(props, dashboardCell)), {}) as ReactElement;
}
