import type { ReactElement } from 'react';
import { resolveUi, uiAlertView } from '@silverpoint/core/ui';
import type { SpAlertProps as ClientProps } from '../../ui/alert';
import { renderUi } from '../../ui/render';

/** Props and dashboard cell only: a Server Component reads no provider. It closes nothing: a closable alert is a client component. */
export type SpAlertProps = Omit<ClientProps, 'closable' | 'closeLabel' | 'onClose'>;

/** `SpAlert` for React Server Components (REQ-104): no hook and no client boundary. */
export function SpAlert({ children, dashboardCell, ...props }: SpAlertProps) {
  return renderUi(uiAlertView(props, resolveUi(props, { cell: dashboardCell?.config }), { closable: false }), { slots: { content: children } }) as ReactElement;
}
