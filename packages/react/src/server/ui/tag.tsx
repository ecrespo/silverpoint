import type { ReactElement } from 'react';
import { resolveUi, uiTagView } from '@silverpoint/core/ui';
import type { SpTagProps as ClientProps } from '../../ui/tag';
import { renderUi, textOf } from '../../ui/render';

/** Props and dashboard cell only: a Server Component reads no provider. It closes nothing: a closable tag is a client component. */
export type SpTagProps = Omit<ClientProps, 'closable' | 'closeLabel' | 'onClose'>;

/** `SpTag` for React Server Components (REQ-104): no hook and no client boundary. */
export function SpTag({ children, dashboardCell, ...props }: SpTagProps) {
  return renderUi(uiTagView(props, resolveUi(props, { cell: dashboardCell?.config }), { text: textOf(children) }), { slots: { content: children } }) as ReactElement;
}
