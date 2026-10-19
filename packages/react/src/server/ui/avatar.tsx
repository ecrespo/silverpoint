import type { ReactElement } from 'react';
import { resolveUi, uiAvatarGroupView, uiAvatarView } from '@silverpoint/core/ui';
import type { SpAvatarGroupProps, SpAvatarProps } from '../../ui/avatar';
import { renderUi } from '../../ui/render';

export type { SpAvatarGroupProps, SpAvatarProps };

/** `SpAvatar` for React Server Components (REQ-104): props and dashboard cell only, no provider. */
export function SpAvatar({ dashboardCell, ...props }: SpAvatarProps) {
  return renderUi(uiAvatarView(props, resolveUi(props, { cell: dashboardCell?.config })), {}) as ReactElement;
}

/** `SpAvatarGroup` for React Server Components. */
export function SpAvatarGroup({ children, dashboardCell, ...props }: SpAvatarGroupProps) {
  return renderUi(uiAvatarGroupView(props, resolveUi(props, { cell: dashboardCell?.config })), { slots: { content: children } }) as ReactElement;
}
