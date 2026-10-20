import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SpCard } from '@silverpoint/angular/ui/card';

/** Add '@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css', '@silverpoint/grounds/ui.css' to the `styles` of angular.json. */
@Component({
  selector: 'app-card-view',
  imports: [SpCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-card>
      Hits per hour rose through the afternoon and eased at night.
    </sp-card>
  `,
})
export class CardView {}
