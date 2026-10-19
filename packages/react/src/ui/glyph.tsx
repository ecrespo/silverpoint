import { uiGlyphView, type SpGlyphProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpGlyphProps extends CoreProps, UiCellProps {}

/** `SpGlyph`: one exact mark of `UI_GLYPHS` (REQ-472). `@silverpoint/react/server/ui/glyph` renders it in a Server Component. */
export function SpGlyph({ dashboardCell, ...props }: SpGlyphProps) {
  return renderUi(uiGlyphView(props, useUi(props, dashboardCell)), {}) as ReactElement;
}
