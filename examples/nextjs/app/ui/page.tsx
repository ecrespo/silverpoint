import { UI_PAGE, type HarnessUiPageItem } from '@silverpoint/example-harness';
import { KpiCard } from '@silverpoint/react/server/kpi-card';
import { SpAlert, SpBadge, SpButton, SpCard, SpCheckbox, SpDivider, SpInput, SpProgress, SpRadioGroup, SpRate, SpSegmented, SpSkeleton, SpSlider, SpSteps, SpSwitch, SpTabPanel, SpTabs, SpTag } from '@silverpoint/react/ui';
import type { ComponentType } from 'react';
import { Hydrated } from '../hydrated';

/** Every component the page names, by its slug. */
const UI = { button: SpButton, input: SpInput, checkbox: SpCheckbox, switch: SpSwitch, card: SpCard, divider: SpDivider, 'radio-group': SpRadioGroup, segmented: SpSegmented, tabs: SpTabs, slider: SpSlider, rate: SpRate, steps: SpSteps, tag: SpTag, badge: SpBadge, progress: SpProgress, alert: SpAlert, skeleton: SpSkeleton } as unknown as Readonly<Record<string, ComponentType<Record<string, unknown>>>>;

/** One item as a consumer writes it: uncontrolled, the value as its default (REQ-322). */
function Item({ item }: { item: HarnessUiPageItem }) {
  const Component = UI[item.component]!;
  const bound = item.value === undefined ? {} : typeof item.value === 'boolean' ? { defaultChecked: item.value } : { defaultValue: item.value };
  const children = item.chart ? (
    <KpiCard {...(item.chart.props as object)} />
  ) : item.tabPanels ? (
    item.tabPanels.map((panel) => (
      <SpTabPanel key={panel.value} value={panel.value}>
        {panel.text}
      </SpTabPanel>
    ))
  ) : (
    item.slots.content
  );
  return (
    <Component {...item.props} {...bound} {...(item.slots.extra ? { extra: item.slots.extra } : {})}>
      {children}
    </Component>
  );
}

/** The UI reference page (T-157): server-rendered, then hydrated (REQ-329, REQ-331). */
export default function UiPage() {
  return (
    <main>
      <h1>{UI_PAGE.title} · Next.js (React)</h1>
      <div className="sp-ui-page">
        {UI_PAGE.panels.map((panel) => (
          <form key={panel.key} className={`sp-ui-page-panel sp-ground-${panel.ground}`} data-substrate={panel.substrate} data-panel={panel.key} aria-labelledby={`${panel.key}-title`}>
            <h2 id={`${panel.key}-title`}>{panel.title}</h2>
            <p className="sp-ui-page-note">{panel.note}</p>
            <div className="sp-ui-page-sections">
              {panel.sections.map((section) => (
                <section key={section.title} className="sp-ui-page-section" aria-label={section.title}>
                  <h3>{section.title}</h3>
                  <div className="sp-ui-page-items">
                    {section.items.map((item) => (
                      <Item key={item.key} item={item} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </form>
        ))}
      </div>
      <Hydrated />
    </main>
  );
}
