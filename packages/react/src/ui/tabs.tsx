import { uiItems, uiRovingFocus, uiSelectedKey, uiTabPanelView, uiTabsView, type SpTabsProps as CoreProps } from '@silverpoint/core/ui';
import { createContext, useContext, type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import { useUi, useValue, type UiCellProps } from './base';
import { renderUi } from './render';

export interface SpTabsProps extends CoreProps, UiCellProps {
  /** Controlled key; an unknown one shows the first enabled tab. */
  readonly value?: string;
  readonly defaultValue?: string;
  /** The key selected, not the DOM event (REQ-322). */
  readonly onChange?: (value: string) => void;
  /** `SpTabPanel` elements. */
  readonly children?: ReactNode;
}

/** What a panel reads from its tabs: their id, for the ids that relate them, and the selected key. */
const TabsContext = createContext<{ readonly id?: string; readonly value: string | null }>({ value: null });

/** `SpTabs`: a tablist of native buttons, one tab stop; arrows through the core, `activation` as APG (REQ-315). */
export function SpTabs({ value, defaultValue, onChange, children, dashboardCell, ...props }: SpTabsProps) {
  const [current, set] = useValue<string | undefined>(value, defaultValue, onChange as (next: string | undefined) => void);
  const view = uiTabsView(props, useUi(props, dashboardCell), { value: current ?? null });
  const selected = uiSelectedKey(uiItems(props.items, 'SpTabs'), current, 'first');
  const native = { onClick: (event: MouseEvent<HTMLButtonElement>) => set(String(event.currentTarget.dataset.key)) };
  const orientation = props.orientation ?? 'horizontal';
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) =>
    uiRovingFocus(event, event.currentTarget, '[role="tab"]', orientation, props.activation !== 'manual');
  const content = <TabsContext.Provider value={{ id: props.id, value: selected }}>{children}</TabsContext.Provider>;
  return renderUi(view, { root: { onKeyDown }, native, slots: { content } }) as ReactElement;
}

export interface SpTabPanelProps {
  /** The key of the tab that shows this panel. */
  readonly value: string;
  readonly children?: ReactNode;
}

/** `SpTabPanel`: a `tabpanel` labelled by its tab, hidden unless its tab is selected. */
export function SpTabPanel({ value, children }: SpTabPanelProps) {
  return renderUi(uiTabPanelView({ value }, useContext(TabsContext)), { slots: { content: children } }) as ReactElement;
}
