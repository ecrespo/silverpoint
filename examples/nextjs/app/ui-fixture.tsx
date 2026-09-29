import { uiFixtureParts, uiSizeOf, type HarnessUiFixture } from '@silverpoint/example-harness';
import { SpAlert, SpBadge, SpButton, SpCard, SpCheckbox, SpDivider, SpInput, SpProgress, SpRadioGroup, SpRate, SpSegmented, SpSkeleton, SpSlider, SpSteps, SpSwitch, SpTabs, SpTag } from '@silverpoint/react/ui';
import type { ComponentType } from 'react';

/** Every UI component a fixture can name, by its slug. */
const UI = { button: SpButton, input: SpInput, checkbox: SpCheckbox, switch: SpSwitch, card: SpCard, divider: SpDivider, 'radio-group': SpRadioGroup, segmented: SpSegmented, tabs: SpTabs, slider: SpSlider, rate: SpRate, steps: SpSteps, tag: SpTag, badge: SpBadge, progress: SpProgress, alert: SpAlert, skeleton: SpSkeleton } as unknown as Readonly<Record<string, ComponentType<Record<string, unknown>>>>;

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
