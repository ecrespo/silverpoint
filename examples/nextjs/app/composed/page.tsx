import { COMPOSED_PAGE } from '@silverpoint/example-harness';
import { Hydrated } from '../hydrated';
import { UiComponent } from '../ui-fixture';

/** The composed page (T-222): the 21 new rows, every state, in the UI page's three panels; server-rendered, then hydrated. */
export default function ComposedPage() {
  return (
    <main>
      <h1>{COMPOSED_PAGE.title} · Next.js (React)</h1>
      <div className="sp-ui-page sp-composed-page">
        {COMPOSED_PAGE.panels.map((panel) => (
          <form key={panel.key} className={`sp-ui-page-panel sp-ground-${panel.ground}`} data-substrate={panel.substrate} data-panel={panel.key} aria-labelledby={`${panel.key}-title`}>
            <h2 id={`${panel.key}-title`}>{panel.title}</h2>
            <p className="sp-ui-page-note">{panel.note}</p>
            <div className="sp-ui-page-sections">
              {panel.sections.map((section) => (
                <section key={section.title} className="sp-ui-page-section" aria-label={section.title}>
                  <h3>{section.title}</h3>
                  <div className="sp-ui-page-items">
                    {section.items.map((item) => (
                      <div key={item.id} className="sp-page-item" data-wide={item.width === 640 ? '' : undefined}>
                        <UiComponent fixture={item} />
                      </div>
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
