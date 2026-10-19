import { uiResultView, type SpResultProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement, ReactNode } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpResultProps extends CoreProps, UiCellProps {
  /** Actions under the description. */
  readonly extra?: ReactNode;
}

/** `SpResult`: the status glyph in a round frame; status or alert by its kind (REQ-483). `@silverpoint/react/server/ui/result` renders it in a Server Component. */
export function SpResult({ extra, dashboardCell, ...props }: SpResultProps) {
  return renderUi(uiResultView(props, useUi(props, dashboardCell), { extra: extra != null }), { slots: { extra } }) as ReactElement;
}
