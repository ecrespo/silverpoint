import { uiSelectedKey, uiSelectItems, uiSelectView, type SpSelectProps, type UiElement, type UiItem } from '@silverpoint/core/ui';
import { computed, defineComponent, ref, type PropType } from 'vue';
import { COMMON, optionalBoolean, useUi, useValue, withClass } from './base';
import { useListKeys } from './list';
import { OPEN, useOpen, useOverlay } from './overlay';
import { renderUi } from './render';

/**
 * `SpSelect`: the APG select-only combobox, with `v-model` and `v-model:open` (REQ-494, DD-039).
 * Focus stays on the trigger, which points at the active option; every key goes through `uiListKey`
 * and `uiTypeahead`.
 */
export const SpSelect = defineComponent({
  name: 'SpSelect',
  inheritAttrs: false,
  props: {
    ...COMMON,
    ...OPEN,
    modelValue: { type: String as PropType<string | null>, default: undefined },
    defaultValue: { type: String as PropType<string | null>, default: undefined },
    items: { type: Array as PropType<readonly (string | UiItem)[]>, required: true },
    placeholder: String,
    label: { type: String, required: true },
    disabled: optionalBoolean,
    required: optionalBoolean,
    name: String,
    width: String,
  },
  emits: { 'update:modelValue': (value: string) => typeof value === 'string', 'update:open': (open: boolean) => typeof open === 'boolean' },
  setup(props, { attrs, emit }) {
    const resolved = useUi(() => props);
    const chosen = useValue<string | null>(() => props.modelValue, props.defaultValue ?? null, (v) => emit('update:modelValue', v!));
    const open = useOpen(props, (v) => emit('update:open', v));
    const popover = ref<HTMLElement | null>(null);
    useOverlay(popover, () => 'popover', open, () => ({ place: { side: 'bottom', align: 'start' } }));

    const items = computed(() => uiSelectItems(props.items));
    const list = useListKeys(
      () => items.value,
      'listbox',
      () => open.current.value,
      () => {
        const selected = uiSelectedKey(items.value, chosen.current.value, 'none');
        return items.value.findIndex((item) => item.key === selected);
      },
    );

    const close = () => open.set(false);
    const select = (key: string | undefined) => {
      if (key !== undefined && key !== chosen.current.value) chosen.set(key);
      close();
    };
    const onKeydown = (event: KeyboardEvent) => {
      const result = list.key(event);
      if (!result) return;
      if (result.intent === 'open') open.set(true);
      else if (result.intent === 'close') close();
      else if (result.intent === 'select') select(result.key);
    };
    const bound = {
      trigger: () => ({ onKeydown, onKeyup: list.keyUp, onClick: () => open.set(!open.current.value) }),
      popover: () => ({ ref: popover }),
      option: (node: UiElement) => ({
        // The trigger keeps focus: the option is pointed at, never focused.
        onPointerdown: (event: Event) => event.preventDefault(),
        onClick: () => node.attrs['aria-disabled'] !== 'true' && select(node.attrs['data-key'] as string),
      }),
    };
    return () => renderUi(uiSelectView(withClass(props as SpSelectProps, attrs), resolved.value, { value: chosen.current.value, open: open.current.value, active: list.activeKey.value }), { bound });
  },
});
