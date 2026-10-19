import type { GroundRef, InkMode, Palette, ProviderConfig, SubstrateName } from '@silverpoint/core';
import { nestProvider } from '@silverpoint/core/palettes';
import { defineComponent, provide, shallowReactive, watch, type PropType } from 'vue';
import { SILVERPOINT, useProvider } from './environment';

/**
 * `SilverpointProvider`: `provideSilverpoint` for a section of the page (REQ-462). Its set props win
 * over the app's or an outer section's, the rest are inherited, and the palettes merge field by
 * field. It renders its slot and nothing around it, so layout and parity are untouched (DD-037).
 */
export const SilverpointProvider = defineComponent({
  name: 'SilverpointProvider',
  props: {
    ground: [String, Object] as PropType<GroundRef>,
    substrate: String as PropType<SubstrateName>,
    mode: String as PropType<InkMode>,
    locale: String,
    palette: Object as PropType<Palette>,
  },
  setup(props, { slots }) {
    const outer = useProvider();
    const own = () => nestProvider(outer, { ...props });
    // Reactive, so the charts and components below re-render when a prop changes.
    const config = shallowReactive<ProviderConfig>(own());
    watch(own, (next) => {
      for (const key of Object.keys(config) as (keyof ProviderConfig)[]) if (!(key in next)) delete config[key];
      Object.assign(config, next);
    });
    provide(SILVERPOINT, config);
    return () => slots.default?.();
  },
});
