import type { ReactElement } from 'react';
import { resolveUi, uiStepsView } from '@silverpoint/core/ui';
import type { SpStepsProps as ClientProps } from '../../ui/steps';
import { renderUi } from '../../ui/render';

/** Props and dashboard cell only: a Server Component reads no provider. */
export type SpStepsProps = ClientProps;

/** `SpSteps` for React Server Components (REQ-104): no hook and no client boundary. */
export function SpSteps({ dashboardCell, ...props }: SpStepsProps) {
  return renderUi(uiStepsView(props, resolveUi(props, { cell: dashboardCell?.config })), {}) as ReactElement;
}
