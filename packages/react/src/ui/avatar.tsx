import { uiAvatarGroupView, uiAvatarView, type SpAvatarGroupProps as CoreGroupProps, type SpAvatarProps as CoreProps } from '@silverpoint/core/ui';
import type { ReactElement, ReactNode } from 'react';
import { useUi, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpAvatarProps extends CoreProps, UiCellProps {}

export interface SpAvatarGroupProps extends CoreGroupProps, UiCellProps {
  /** The avatars. */
  readonly children?: ReactNode;
}

/** `SpAvatar`: an image, or initials named as an image (REQ-478). `@silverpoint/react/server/ui/avatar` renders it in a Server Component. */
export function SpAvatar({ dashboardCell, ...props }: SpAvatarProps) {
  return renderUi(uiAvatarView(props, useUi(props, dashboardCell)), {}) as ReactElement;
}

/** `SpAvatarGroup`: a labelled group of avatars (REQ-478). */
export function SpAvatarGroup({ children, dashboardCell, ...props }: SpAvatarGroupProps) {
  return renderUi(uiAvatarGroupView(props, useUi(props, dashboardCell)), { slots: { content: children } }) as ReactElement;
}
