import { DECK_PAGE } from '@silverpoint/example-harness';
import { Hydrated } from '../hydrated';
import { DeckBench } from './deck-bench';

/** The deck page (T-277): a Server Component renders the client SpDeck, held by the page's two actions, with plain props (REQ-609, REQ-612). */
export default function DeckPage() {
  return (
    <main>
      <h1>{DECK_PAGE.title} · Next.js (React)</h1>
      <DeckBench />
      <Hydrated />
    </main>
  );
}
