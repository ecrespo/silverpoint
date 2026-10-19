import type { ReactElement } from 'react';
import { resolveUi, uiDescriptionsView } from '@silverpoint/core/ui';
import type { SpDescriptionsProps } from '../../ui/descriptions';
import { renderUi } from '../../ui/render';

export type { SpDescriptionsProps };

/** `SpDescriptions` for React Server Components (REQ-104): props and dashboard cell only, no provider. */
export function SpDescriptions({ dashboardCell, ...props }: SpDescriptionsProps) {
  return renderUi(uiDescriptionsView(props, resolveUi(props, { cell: dashboardCell?.config })), {}) as ReactElement;
}
