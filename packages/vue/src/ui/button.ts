import { uiButtonView, type SpButtonProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, optionalBoolean, textOf, useUi, withClass } from './base';
import { renderUi } from './render';

/**
 * What an overlay clones onto its trigger (`uiTriggerAria`, `useTrigger`; REQ-500): with
 * `inheritAttrs: false`, `SpButton` forwards these attributes to its root and nothing else, so its
 * attributes stay the core's (delta-014, Art. 3).
 */
const TRIGGER_ATTRS = ['aria-haspopup', 'aria-expanded', 'aria-controls', 'aria-describedby', 'onPointerdown'] as const;

function triggerAttrs(attrs: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const name of TRIGGER_ATTRS) if (attrs[name] !== undefined) out[name] = attrs[name];
  return out;
}

/** `SpButton` (API delta §2): a native `<button>`, or `<a>` with `href`. */
export const SpButton = defineComponent({
  name: 'SpButton',
  inheritAttrs: false,
  props: {
    ...COMMON,
    variant: String as PropType<SpButtonProps['variant']>,
    type: String as PropType<SpButtonProps['type']>,
    disabled: optionalBoolean,
    label: String,
    block: optionalBoolean,
    href: String,
  },
  emits: ['click'],
  setup(props, { slots, attrs, emit }) {
    const resolved = useUi(() => props);
    return () => {
      const content = slots.default?.();
      const view = uiButtonView(withClass(props as SpButtonProps, attrs), resolved.value, { text: textOf(content) });
      // A disabled link is an `<a>` without `href`, which still takes clicks: it emits none (REQ-326).
      const onClick = (event: MouseEvent) => (props.disabled ? event.preventDefault() : emit('click', event));
      return renderUi(view, { root: { ...triggerAttrs(attrs), onClick }, slots: { content } });
    };
  },
});
