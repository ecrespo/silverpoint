'use client';

import { DECK_PAGE } from '@silverpoint/example-harness';
import { SpDeck } from '@silverpoint/react/deck';
import { useState } from 'react';

/** The deck and the page's two actions: swap its Markdown, remove it (REQ-610, REQ-625). */
export function DeckBench() {
  const [markdown, setMarkdown] = useState(DECK_PAGE.deck.markdown);
  const [shown, setShown] = useState(true);
  return (
    <>
      <p className="sp-deck-actions">
        <button type="button" onClick={() => setMarkdown(DECK_PAGE.alternate)}>
          {DECK_PAGE.actions.change}
        </button>
        <button type="button" onClick={() => setShown(false)}>
          {DECK_PAGE.actions.remove}
        </button>
      </p>
      <div className="sp-deck-page">{shown && <SpDeck {...DECK_PAGE.deck} markdown={markdown} />}</div>
    </>
  );
}
