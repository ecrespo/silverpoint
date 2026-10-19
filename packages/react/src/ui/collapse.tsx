import { uiCollapseGroup, uiCollapseItemView, uiCollapseView, type SpCollapseItemProps as CoreItemProps, type SpCollapseProps as CoreProps } from '@silverpoint/core/ui';
import { createContext, useContext, type MouseEvent, type ReactElement, type ReactNode, type SyntheticEvent } from 'react';
import { useUi, useValue, type UiCellProps } from './base';
import { renderUi } from './render';

/** The `name` an accordion gives its items (REQ-482). */
const CollapseGroup = createContext<string | undefined>(undefined);

export interface SpCollapseProps extends CoreProps, UiCellProps {
  /** `SpCollapseItem`s. */
  readonly children?: ReactNode;
}

export interface SpCollapseItemProps extends CoreItemProps, UiCellProps {
  /** Controlled. */
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  /** The item opened or closed, by the user or by its accordion. */
  readonly onToggle?: (open: boolean) => void;
  readonly children?: ReactNode;
}

/** `SpCollapse`: a frame around native `<details>` items; `accordion` makes them exclusive, natively (REQ-482). */
export function SpCollapse({ children, dashboardCell, ...props }: SpCollapseProps) {
  const view = uiCollapseView(props, useUi(props, dashboardCell));
  return <CollapseGroup.Provider value={uiCollapseGroup(props)}>{renderUi(view, { slots: { content: children } })}</CollapseGroup.Provider>;
}

/** `SpCollapseItem`: a native `<details>`; a disabled one cancels its summary's activation (REQ-482). */
export function SpCollapseItem({ open, defaultOpen, onToggle, children, dashboardCell, ...props }: SpCollapseItemProps) {
  const [isOpen, set] = useValue(open, defaultOpen ?? false, onToggle);
  const view = uiCollapseItemView(props, useUi(props, dashboardCell), { open: isOpen, group: useContext(CollapseGroup) });
  const root = {
    onToggle: (event: SyntheticEvent<HTMLDetailsElement>) => {
      if (event.currentTarget.open !== isOpen) set(event.currentTarget.open);
    },
  };
  const summary = () => ({ onClick: (event: MouseEvent) => props.disabled && event.preventDefault() });
  return renderUi(view, { root, bound: { summary }, slots: { content: children } }) as ReactElement;
}
