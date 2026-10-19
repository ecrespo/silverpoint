import { uiCollapseGroup, uiCollapseItemView, uiCollapseView, type SpCollapseItemProps, type SpCollapseProps } from '@silverpoint/core/ui';
import { computed, defineComponent, inject, provide, type ComputedRef, type InjectionKey } from 'vue';
import { COMMON, optionalBoolean, useUi, useValue, withClass } from './base';
import { renderUi } from './render';

/** The `name` an accordion gives its items (REQ-482). */
const COLLAPSE_GROUP: InjectionKey<ComputedRef<string | undefined>> = Symbol('SpCollapse');

/** `SpCollapse`: a frame around native `<details>` items; `accordion` makes them exclusive, natively (REQ-482). */
export const SpCollapse = defineComponent({
  name: 'SpCollapse',
  inheritAttrs: false,
  props: { ...COMMON, accordion: optionalBoolean, bordered: optionalBoolean },
  setup(props, { slots, attrs }) {
    const resolved = useUi(() => props);
    provide(
      COLLAPSE_GROUP,
      computed(() => uiCollapseGroup(props as SpCollapseProps)),
    );
    return () => renderUi(uiCollapseView(withClass(props as SpCollapseProps, attrs), resolved.value), { slots: { content: slots.default?.() } });
  },
});

/** `SpCollapseItem`: a native `<details>` with `v-model:open`; a disabled one cancels its summary's activation (REQ-482). */
export const SpCollapseItem = defineComponent({
  name: 'SpCollapseItem',
  inheritAttrs: false,
  props: { ...COMMON, title: { type: String, required: true }, disabled: optionalBoolean, open: optionalBoolean, defaultOpen: optionalBoolean },
  emits: { 'update:open': (open: boolean) => typeof open === 'boolean', toggle: (open: boolean) => typeof open === 'boolean' },
  setup(props, { slots, attrs, emit }) {
    const resolved = useUi(() => props);
    const group = inject(
      COLLAPSE_GROUP,
      computed(() => undefined),
    );
    const open = useValue(
      () => props.open,
      props.defaultOpen ?? false,
      (v: boolean) => {
        emit('update:open', v);
        emit('toggle', v);
      },
    );
    const root = {
      onToggle: (event: Event) => {
        const next = (event.currentTarget as HTMLDetailsElement).open;
        if (next !== open.current.value) open.set(next);
      },
    };
    const summary = () => ({ onClick: (event: MouseEvent) => props.disabled && event.preventDefault() });
    return () => {
      const view = uiCollapseItemView(withClass(props as SpCollapseItemProps, attrs), resolved.value, { open: open.current.value, group: group.value });
      return renderUi(view, { root, bound: { summary }, slots: { content: slots.default?.() } });
    };
  },
});
