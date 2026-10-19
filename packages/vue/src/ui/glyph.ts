import { uiGlyphView, type SpGlyphProps } from '@silverpoint/core/ui';
import { defineComponent } from 'vue';
import { COMMON, useUi, withClass } from './base';
import { renderUi } from './render';

/** `SpGlyph`: one exact glyph of `UI_GLYPHS`, hidden from assistive technology (REQ-472). */
export const SpGlyph = defineComponent({
  name: 'SpGlyph',
  inheritAttrs: false,
  props: { ...COMMON, glyph: { type: String, required: true } },
  setup(props, { attrs }) {
    const resolved = useUi(() => props);
    return () => renderUi(uiGlyphView(withClass(props as SpGlyphProps, attrs), resolved.value), {});
  },
});
