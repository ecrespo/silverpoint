import { uiSelectedKey, uiSelectItems, uiSelectView, type SpSelectProps as CoreProps, type UiElement } from '@silverpoint/core/ui';
import { forwardRef, useImperativeHandle, useRef, type KeyboardEvent, type ReactElement } from 'react';
import { useUi, useValue, type UiCellProps } from './base';
import { useOpen, useOverlay, type OverlayOpenProps } from './overlay';
import { useListKeys } from './list';
import { renderUi } from './render';

export interface SpSelectProps extends CoreProps, OverlayOpenProps, UiCellProps {
  /** Controlled key; `null` is none chosen. */
  readonly value?: string | null;
  readonly defaultValue?: string | null;
  /** The key chosen, not the DOM event (REQ-322). */
  readonly onChange?: (value: string) => void;
}

/**
 * `SpSelect`: the APG select-only combobox (REQ-494, DD-039). Focus stays on the trigger, which
 * points at the active option; every key goes through `uiListKey` and `uiTypeahead`. Its ref is the
 * trigger.
 */
export const SpSelect = forwardRef<HTMLButtonElement, SpSelectProps>(function SpSelect({ value, defaultValue, onChange, open, defaultOpen, onOpenChange, dashboardCell, ...props }, forwarded) {
  const [chosen, choose] = useValue<string | null>(value, defaultValue ?? null, onChange as (next: string | null) => void);
  const [isOpen, setOpen] = useOpen({ open, defaultOpen, onOpenChange });
  const popover = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useImperativeHandle(forwarded, () => trigger.current!, []);
  useOverlay(popover, 'popover', isOpen, setOpen, { place: { side: 'bottom', align: 'start' } });

  const items = uiSelectItems(props.items);
  const selected = uiSelectedKey(items, chosen, 'none');
  const list = useListKeys(items, 'listbox', isOpen, items.findIndex((item) => item.key === selected));
  const view = uiSelectView(props, useUi(props, dashboardCell), { value: chosen, open: isOpen, active: list.activeKey });

  const close = () => setOpen(false);
  const select = (key: string | undefined) => {
    if (key !== undefined && key !== chosen) choose(key);
    close();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const result = list.key(event);
    if (!result) return;
    if (result.intent === 'open') setOpen(true);
    else if (result.intent === 'close') close();
    else if (result.intent === 'select') select(result.key);
  };
  const bound = {
    trigger: () => ({ ref: trigger, onKeyDown, onKeyUp: list.keyUp, onClick: () => (isOpen ? close() : setOpen(true)) }),
    popover: () => ({ ref: popover }),
    option: (node: UiElement) => ({
      // The trigger keeps focus: the option is pointed at, never focused.
      onPointerDown: (event: { preventDefault(): void }) => event.preventDefault(),
      onClick: () => node.attrs['aria-disabled'] !== 'true' && select(node.attrs['data-key'] as string),
    }),
  };
  return renderUi(view, { bound }) as ReactElement;
});

