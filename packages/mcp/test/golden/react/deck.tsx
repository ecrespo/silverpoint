import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import '@silverpoint/marp/deck.css';
import { useState } from 'react';
import { SpDeck } from '@silverpoint/react/deck';

const MARKDOWN = `# Quarterly review

\`\`\`silverpoint
{"chart":"bar-chart","props":{"title":"Visits"}}
\`\`\`

---

## Next steps

* Ship it`;

export function DeckView() {
  const [page, setPage] = useState(1);
  return (
    <SpDeck
      markdown={MARKDOWN}
      page={page}
      onPageChange={({ page }) => setPage(page)}
      ground="cyanotype"
      hash={true}
    />
  );
}
