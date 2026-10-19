import { uiDropdownMenuView, uiMenuItems, type MenuEntry, type SpDropdownMenuProps, type UiElement } from '@silverpoint/core/ui';
import { computed, defineComponent, ref, watch, type PropType } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { useListKeys } from './list';
import { OPEN, useOpen, useOverlay, useTrigger } from './overlay';
import { renderUi } from './render';

/** The element focus returns to: the built-in button, or the consumer's trigger inside its slot. */
const triggerOf = (menu: HTMLElement | null) => {
  const before = menu?.previousElementSibling;
  return (before?.classList.contains('sp-ui-trigger') ? before.firstElementChild : before) as HTMLElement | null | undefined;
};

/**
 * `SpDropdownMenu`: the APG menu button, with `v-model:open` and a `select` event carrying the key
 * (REQ-495, DD-039). DOM focus moves to the active item; every key goes through `uiListKey` and
 * `uiTypeahead`; Enter, Space or a click activates an item, closes the menu and returns focus to
 * the trigger. A `trigger` slot replaces the built-in button.
 */
export const SpDropdownMenu = defineComponent({
  name: 'SpDropdownMenu',
  inheritAttrs: false,
  props: {
    ...COMMON,
    ...OPEN,
    items: { type: Array as PropType<readonly MenuEntry[]>, required: true },
    label: { type: String, required: true },
    side: String as PropType<SpDropdownMenuProps['side']>,
    align: String as PropType<SpDropdownMenuProps['align']>,
  },
  emits: { select: (key: string) => typeof key === 'string', 'update:open': (open: boolean) => typeof open === 'boolean' },
  setup(props, { slots, attrs, emit }) {
    const resolved = useUi(() => props);
    const open = useOpen(props, (v) => emit('update:open', v));
    const menu = ref<HTMLElement | null>(null);
    useOverlay(menu, () => 'popover', open, () => ({ place: { side: props.side ?? 'bottom', align: props.align ?? 'start' } }));
    const items = computed(() => uiMenuItems(props.items));
    const list = useListKeys(
      () => items.value,
      'menu',
      () => open.current.value,
      () => -1,
    );
    const slot = useTrigger('menu', () => props.id, open, false);

    watch(
      [open.current, list.activeKey],
      ([isOpen, key]) => {
        if (!isOpen || key === null) return;
        for (const item of menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []) if (item.dataset.key === key) item.focus();
      },
      { flush: 'post' },
    );

    const close = (refocus: boolean) => {
      open.set(false);
      if (refocus) triggerOf(menu.value)?.focus();
    };
    const activate = (key: string | undefined) => {
      close(true);
      if (key !== undefined) emit('select', key);
    };
    const keyed = (event: KeyboardEvent) => {
      const result = list.key(event);
      if (result?.intent === 'open') open.set(true);
      else if (result?.intent === 'close') close(event.key !== 'Tab');
      else if (result?.intent === 'select') activate(result.key);
    };
    let pressedOpen = false;
    const bound = {
      trigger: () => ({
        onPointerdown: () => (pressedOpen = open.current.value),
        onClick: () => {
          const wasOpen = pressedOpen || open.current.value;
          pressedOpen = false;
          open.set(!wasOpen);
        },
        onKeydown: (event: KeyboardEvent) => !open.current.value && keyed(event),
        onKeyup: list.keyUp,
      }),
      popover: () => ({ ref: menu, onKeydown: keyed, onKeyup: list.keyUp }),
      menuitem: (node: UiElement) => ({ onClick: () => node.attrs['aria-disabled'] !== 'true' && activate(node.attrs['data-key'] as string) }),
    };
    return () => {
      const trigger = slot(slots.trigger?.());
      const view = uiDropdownMenuView(withClass(props as SpDropdownMenuProps, attrs), resolved.value, { open: open.current.value, active: list.activeKey.value }, { trigger: trigger !== undefined });
      return renderUi(view, { bound, slots: { trigger } });
    };
  },
});
