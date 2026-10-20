import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SpSelect } from '@silverpoint/angular/ui/select';

/** Add '@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css', '@silverpoint/grounds/ui.css' to the `styles` of angular.json. */
@Component({
  selector: 'app-select-view',
  imports: [SpSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-select
      [label]="'Status'"
      [name]="'status'"
      [items]="[{ key: 'placed', label: 'Placed' }, { key: 'paid', label: 'Paid' }, { key: 'packed', label: 'Packed' }, { key: 'shipped', label: 'Shipped' }, { key: 'returned', label: 'Returned', disabled: true }]"
      [(value)]="value"
    />
  `,
})
export class SelectView {
  protected readonly value = signal<string | undefined>(undefined);
}
