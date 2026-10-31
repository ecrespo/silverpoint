import '@knight-lab/timelinejs/dist/css/timeline.css';
import '@silverpoint/grounds/timeline.css';
import { COMPOSED_PAGE, DECK_PAGE, PALETTES_PAGE, TIMELINE_PAGE } from '@silverpoint/example-harness';
import { SpDeck } from '@silverpoint/react/deck';
import { LineChart } from '@silverpoint/react/line-chart';
import { SpTimeline } from '@silverpoint/react/timeline';
import { SpCard, SpProgress, SpTable, SpToaster } from '@silverpoint/react/ui';
import { useState } from 'react';
import { UiComponent } from './ui-fixture';

/** The composed page (T-222): the 21 new rows, every state, in the UI page's three panels. */
export function ComposedPage() {
  return (
    <main>
      <h1>{COMPOSED_PAGE.title} · Vite + React</h1>
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
                    {section.items
                      .filter((item) => !section.toaster || item.component !== 'toast')
                      .map((item) => (
                        <div key={item.id} className="sp-page-item" data-wide={item.width === 640 ? '' : undefined}>
                          <UiComponent fixture={item} />
                        </div>
                      ))}
                    {section.toaster ? (
                      <SpToaster {...section.toaster}>
                        {section.items
                          .filter((item) => item.component === 'toast')
                          .map((item) => (
                            <UiComponent key={item.id} fixture={item} />
                          ))}
                      </SpToaster>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>
          </form>
        ))}
      </div>
    </main>
  );
}

/** The palettes page (T-222): each preset over a LineChart, a Card holding a Progress, and a Table. */
export function PalettesPage() {
  return (
    <main>
      <h1>{PALETTES_PAGE.title} · Vite + React</h1>
      <div className="sp-palettes-page">
        {PALETTES_PAGE.presets.map((preset) => (
          <section key={preset.key} className="sp-palette-preset sp-ground-silverpoint" data-substrate="cream" data-preset={preset.key} aria-labelledby={`${preset.key}-title`}>
            <h2 id={`${preset.key}-title`}>{preset.title}</h2>
            <LineChart {...preset.chart} />
            <SpCard {...preset.card}>
              <SpProgress {...preset.progress} />
            </SpCard>
            <SpTable {...preset.table} />
          </section>
        ))}
      </div>
    </main>
  );
}

/** The timeline page (T-222): `TIMELINE_DEMO` drawn by TimelineJS, in the ground's hand. */
/** The deck page (T-277): server-rendered elsewhere, client-rendered here. */
/** The deck and the page's two actions: swap its Markdown, remove it (REQ-610, REQ-625). */
function DeckBench() {
  const [markdown, setMarkdown] = useState(DECK_PAGE.deck.markdown);
  const [shown, setShown] = useState(true);
  return (
    <>
      <p className="sp-deck-actions">
        <button type="button" onClick={() => setMarkdown(DECK_PAGE.alternate)}>{DECK_PAGE.actions.change}</button>
        <button type="button" onClick={() => setShown(false)}>{DECK_PAGE.actions.remove}</button>
      </p>
      <div className="sp-deck-page">{shown && <SpDeck {...DECK_PAGE.deck} markdown={markdown} />}</div>
    </>
  );
}

export function DeckPage() {
  return (
    <main>
      <h1>{DECK_PAGE.title} · Vite + React</h1>
      <DeckBench />
    </main>
  );
}

export function TimelinePage() {
  return (
    <main>
      <h1>{TIMELINE_PAGE.title} · Vite + React</h1>
      <div className="sp-timeline-page sp-ground-silverpoint" data-substrate="cream">
        <SpTimeline {...TIMELINE_PAGE.timeline} fallback={<p>{TIMELINE_PAGE.fallback}</p>} />
      </div>
    </main>
  );
}
