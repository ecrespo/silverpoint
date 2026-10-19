import { uiAvatarGroupView, uiAvatarView, type SpAvatarGroupProps, type SpAvatarProps } from '@silverpoint/core/ui';
import { defineComponent, type PropType } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpAvatar`: an image, or initials named as an image (REQ-478). */
export const SpAvatar = defineComponent({
  name: 'SpAvatar',
  inheritAttrs: false,
  props: { ...COMMON, src: String, name: String, initials: String, alt: String, shape: String as PropType<SpAvatarProps['shape']>, pixelSize: Number },
  setup(props, { attrs }) {
    const resolved = useUi(() => props);
    return () => renderUi(uiAvatarView(withClass(props as SpAvatarProps, attrs), resolved.value), {});
  },
});

/** `SpAvatarGroup`: a labelled group of avatars, its slot `default` (REQ-478). */
export const SpAvatarGroup = defineComponent({
  name: 'SpAvatarGroup',
  inheritAttrs: false,
  props: { ...COMMON, label: String },
  setup(props, { slots, attrs }) {
    const resolved = useUi(() => props);
    return () => renderUi(uiAvatarGroupView(withClass(props as SpAvatarGroupProps, attrs), resolved.value), { slots: { content: slots.default?.() } });
  },
});
