import { uiFixtureParts, uiSizeOf, type HarnessUiFixture } from '@silverpoint/example-harness';
import { SpButton, SpCard, SpCheckbox, SpDivider, SpInput, SpSwitch } from '@silverpoint/react/ui';
import type { ComponentType } from 'react';

/** Every UI component a fixture can name, by its slug. */
const UI = { button: SpButton, input: SpInput, checkbox: SpCheckbox, switch: SpSwitch, card: SpCard, divider: SpDivider } as unknown as Readonly<Record<string, ComponentType<Record<string, unknown>>>>;

/**
 * A UI fixture as a consumer writes it, from a Server Component: the client components are
 * server-rendered and hydrated (REQ-329). Uncontrolled, the value as its default.
 */
export function UiFixture({ fixture }: { fixture: HarnessUiFixture }) {
  const { props, value, slots } = uiFixtureParts(fixture);
  const Component = UI[fixture.component]!;
  const bound = value === undefined ? {} : typeof value === 'boolean' ? { defaultChecked: value } : { defaultValue: value };
  return (
    <div className={`sp-harness sp-ground-${fixture.ground}`} data-gate="" data-ui="" data-substrate={fixture.substrate} data-size={uiSizeOf(fixture)}>
      <Component {...props} {...bound} {...(slots.extra ? { extra: slots.extra } : {})}>
        {slots.content}
      </Component>
    </div>
  );
}
