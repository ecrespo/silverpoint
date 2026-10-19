import type { ReactElement } from 'react';
import { resolveUi, uiResultView } from '@silverpoint/core/ui';
import type { SpResultProps } from '../../ui/result';
import { renderUi } from '../../ui/render';

export type { SpResultProps };

/** `SpResult` for React Server Components (REQ-104): props and dashboard cell only, no provider. */
export function SpResult({ extra, dashboardCell, ...props }: SpResultProps) {
  return renderUi(uiResultView(props, resolveUi(props, { cell: dashboardCell?.config }), { extra: extra != null }), { slots: { extra } }) as ReactElement;
}
