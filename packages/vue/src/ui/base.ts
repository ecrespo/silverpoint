import { resolveUi, type CommonUiProps, type UiResolved } from '@silverpoint/core/ui';
import { computed, inject, ref, type ComputedRef, type PropType, type VNode } from 'vue';
import { DASHBOARD_CELL } from '../dashboard-context';
import { useForcedPrecision, useProvider } from '../environment';

/** Props every component declares (CommonUiProps). `class` is read from attrs and joins `className`. */
export const COMMON = {
  id: String,
  seed: [Number, String] as PropType<CommonUiProps['seed']>,
  ground: [String, Object] as PropType<CommonUiProps['ground']>,
  substrate: String as PropType<CommonUiProps['substrate']>,
  mode: String as PropType<CommonUiProps['mode']>,
  size: String as PropType<CommonUiProps['size']>,
  className: String,
} as const;

/** A Boolean prop whose absence stays `undefined`, as Vue would otherwise cast it to `false`. */
export const optionalBoolean = { type: Boolean, default: undefined } as const;

/**
 * Ground, substrate, mode, size and frame: props, then the dashboard cell, then the provider, then
 * the defaults; a forced `precision` read once mounted (REQ-311, REQ-123).
 */
export function useUi(props: () => CommonUiProps): ComputedRef<UiResolved> {
  const provider = useProvider();
  const cell = inject(DASHBOARD_CELL, undefined);
  const forced = useForcedPrecision();
  return computed(() => resolveUi(props(), { provider, cell: cell?.value?.config, forcedPrecision: forced.value }));
}

/** The consumer's `class` joins the core's `className`; no other attribute falls through. */
export const withClass = <P extends CommonUiProps>(props: P, attrs: Record<string, unknown>): P =>
  attrs.class ? { ...props, className: [props.className, attrs.class].filter(Boolean).join(' ') } : props;

/**
 * `v-model` when `modelValue` is bound, held here otherwise, from `defaultValue` (REQ-322). Setting
 * it emits `update:modelValue` either way.
 */
export function useValue<T>(model: () => T | undefined, initial: T, emit: (value: T) => void): { current: ComputedRef<T>; set(value: T): void } {
  const held = ref(initial) as { value: T };
  return {
    current: computed(() => model() ?? held.value),
    set(value: T) {
      if (model() === undefined) held.value = value;
      emit(value);
    },
  };
}

/** Text content, when the slot is text: what the accessible-name check reads (REQ-319). */
export function textOf(nodes: readonly VNode[] | undefined): string | undefined {
  if (!nodes || nodes.length === 0) return undefined;
  const [only] = nodes;
  return nodes.length === 1 && typeof only?.children === 'string' ? only.children : '·';
}
