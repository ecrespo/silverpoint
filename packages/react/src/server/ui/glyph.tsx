import type { ReactElement } from 'react';
import { resolveUi, uiGlyphView } from '@silverpoint/core/ui';
import type { SpGlyphProps } from '../../ui/glyph';
import { renderUi } from '../../ui/render';

export type { SpGlyphProps };

/** `SpGlyph` for React Server Components (REQ-104): props and dashboard cell only, no provider. */
export function SpGlyph({ dashboardCell, ...props }: SpGlyphProps) {
  return renderUi(uiGlyphView(props, resolveUi(props, { cell: dashboardCell?.config })), {}) as ReactElement;
}
