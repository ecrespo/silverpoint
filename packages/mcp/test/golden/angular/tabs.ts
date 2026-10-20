import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { verdigris } from '@silverpoint/core/palettes';
import { SpTabs } from '@silverpoint/angular/ui/tabs';

/** Add '@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css', '@silverpoint/grounds/ui.css' to the `styles` of angular.json. */
@Component({
  selector: 'app-tabs-view',
  imports: [SpTabs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-tabs
      [label]="'Views'"
      [items]="[{ key: 'overview', label: 'Overview' }, { key: 'traffic', label: 'Traffic' }, { key: 'errors', label: 'Errors' }, { key: 'settings', label: 'Settings' }]"
      [(value)]="value"
      [palette]="verdigris"
    />
  `,
})
export class TabsView {
  protected readonly value = signal<string>('overview');
  protected readonly verdigris = verdigris;
}
