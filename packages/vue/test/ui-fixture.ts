import { h, type Component } from 'vue';
import { uiFixtureParts, type UiFixture } from '../../../tools/visual-gate/ui-matrix';

/** A fixture as a Vue consumer writes it: uncontrolled, the value as `default-value`. */
export function vueFixture(fixture: UiFixture, components: Record<string, Component>) {
  const { props, value, slots } = uiFixtureParts(fixture);
  const children = {
    ...(slots.content !== undefined ? { default: () => slots.content } : {}),
    ...(slots.extra !== undefined ? { extra: () => slots.extra } : {}),
  };
  return h(components[fixture.component]!, { ...props, ...(value === undefined ? {} : { defaultValue: value }) }, children);
}

