import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SpDeckComponent } from '@silverpoint/angular/deck';

const MARKDOWN = `# Quarterly review

\`\`\`silverpoint
{"chart":"bar-chart","props":{"title":"Visits"}}
\`\`\`

---

## Next steps

* Ship it`;

/** Add '@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css', '@silverpoint/grounds/ui.css', '@silverpoint/marp/deck.css' to the `styles` of angular.json. */
@Component({
  selector: 'app-deck-view',
  imports: [SpDeckComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-deck
      [markdown]="markdown"
      [page]="page()"
      (pageChange)="page.set($event.page)"
      [ground]="'cyanotype'"
      [hash]="true"
    />
  `,
})
export class DeckView {
  protected readonly markdown = MARKDOWN;
  protected readonly page = signal(1);
}
