import { DECK_PAGE } from '@silverpoint/example-harness';
import { SpDeck } from '@silverpoint/react/deck';
import { Hydrated } from '../hydrated';

/** The deck page (T-277): a Server Component renders the client SpDeck with plain props (REQ-609, REQ-612). */
export default function DeckPage() {
  return (
    <main>
      <h1>{DECK_PAGE.title} · Next.js (React)</h1>
      <div className="sp-deck-page">
        <SpDeck {...DECK_PAGE.deck} />
      </div>
      <Hydrated />
    </main>
  );
}
