import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SpModal, SpTrigger } from '@silverpoint/angular/ui/modal';

/** Add '@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css', '@silverpoint/grounds/ui.css' to the `styles` of angular.json. */
@Component({
  selector: 'app-modal-view',
  imports: [SpModal, SpTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-modal
      [title]="'Edit order'"
      [description]="'Order 1042, placed on 14 October.'"
    >
      <button type="button" spTrigger>Edit order</button>
      Changes reach the workshop before the order is packed.
    </sp-modal>
  `,
})
export class ModalView {}
