import { uiDescriptionsView, type SpDescriptionsProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpDescriptionsProps extends CoreProps, UiCellProps {}

/** `SpDescriptions`: a section named by its heading around a `<dl>` (REQ-480). `@silverpoint/react/server/ui/descriptions` renders it in a Server Component. */
export function SpDescriptions({ dashboardCell, ...props }: SpDescriptionsProps) {
  return renderUi(uiDescriptionsView(props, useUi(props, dashboardCell)), {}) as ReactElement;
}
