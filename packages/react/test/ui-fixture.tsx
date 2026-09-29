import { createElement, type ComponentType } from 'react';
import { uiFixtureParts, type UiFixture } from '../../../tools/visual-gate/ui-matrix';

/** A fixture as a React consumer writes it: uncontrolled, the value as its default. */
export function reactFixture(fixture: UiFixture, components: Record<string, ComponentType<Record<string, unknown>>>) {
  const { props, value, slots } = uiFixtureParts(fixture);
  const bound = value === undefined ? {} : typeof value === 'boolean' ? { defaultChecked: value } : { defaultValue: value };
  return createElement(components[fixture.component]!, { ...props, ...bound, ...(slots.extra ? { extra: slots.extra } : {}) }, slots.content);
}

