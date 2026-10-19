import { uiDropdownMenuView, uiMenuItems, uiTriggerAria, type SpDropdownMenuProps as CoreProps, type UiElement } from '@silverpoint/core/ui';
import { cloneElement, isValidElement, useEffect, useRef, type KeyboardEvent, type ReactElement } from 'react';
import { useUi, type UiCellProps } from './base';
import { useListKeys } from './list';
import { useOpen, useOverlay, type OverlayOpenProps } from './overlay';
import { renderUi } from './render';

export interface SpDropdownMenuProps extends CoreProps, OverlayOpenProps, UiCellProps {
  /** An item was activated: its key. The menu closes. */
  readonly onSelect?: (key: string) => void;
  /** The element that opens it, in place of the built-in button; cloned with the menu button's ARIA. */
  readonly trigger?: ReactElement;
}

/** The element focus returns to: the built-in button, or the consumer's trigger inside its slot. */
const triggerOf = (menu: HTMLElement | null) => {
  const before = menu?.previousElementSibling;
  return (before?.classList.contains('sp-ui-trigger') ? before.firstElementChild : before) as HTMLElement | null | undefined;
};

/**
 * `SpDropdownMenu`: the APG menu button (REQ-495, DD-039). DOM focus moves to the active item;
 * every key goes through `uiListKey` and `uiTypeahead`; Enter, Space or a click activates an item,
 * closes the menu and returns focus to the trigger.
 */
export function SpDropdownMenu({ onSelect, trigger, open, defaultOpen, onOpenChange, dashboardCell, ...props }: SpDropdownMenuProps) {
  const [isOpen, setOpen, latest] = useOpen({ open, defaultOpen, onOpenChange });
  const menu = useRef<HTMLDivElement>(null);
  useOverlay(menu, 'popover', isOpen, setOpen, { place: { side: props.side ?? 'bottom', align: props.align ?? 'start' } });
  const items = uiMenuItems(props.items);
  const list = useListKeys(items, 'menu', isOpen, -1);
  const view = uiDropdownMenuView(props, useUi(props, dashboardCell), { open: isOpen, active: list.activeKey }, { trigger: trigger !== undefined });

  useEffect(() => {
    if (!isOpen || list.activeKey === null) return;
    for (const item of menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []) if (item.dataset.key === list.activeKey) item.focus();
  }, [isOpen, list.activeKey]);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerOf(menu.current)?.focus();
  };
  const activate = (key: string | undefined) => {
    close(true);
    if (key !== undefined) onSelect?.(key);
  };
  const keyed = (event: KeyboardEvent) => {
    const result = list.key(event);
    if (result?.intent === 'open') setOpen(true);
    else if (result?.intent === 'close') close(event.key !== 'Tab');
    else if (result?.intent === 'select') activate(result.key);
  };
  const pressedOpen = useRef(false);
  const bound = {
    trigger: () => ({
      onPointerDown: () => (pressedOpen.current = latest.current),
      onClick: () => {
        const wasOpen = pressedOpen.current || latest.current;
        pressedOpen.current = false;
        setOpen(!wasOpen);
      },
      onKeyDown: (event: KeyboardEvent) => !latest.current && keyed(event),
      onKeyUp: list.keyUp,
    }),
    popover: () => ({ ref: menu, onKeyDown: keyed, onKeyUp: list.keyUp }),
    menuitem: (node: UiElement) => ({ onClick: () => node.attrs['aria-disabled'] !== 'true' && activate(node.attrs['data-key'] as string) }),
  };
  const slot = isValidElement(trigger) ? cloneElement(trigger as ReactElement<Record<string, unknown>>, uiTriggerAria('menu', props.id, isOpen)) : undefined;
  return renderUi(view, { bound, slots: { trigger: slot } }) as ReactElement;
}
