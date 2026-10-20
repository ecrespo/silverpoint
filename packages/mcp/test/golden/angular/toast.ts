import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SpToast } from '@silverpoint/angular/ui/toast';

/** Add '@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css', '@silverpoint/grounds/ui.css' to the `styles` of angular.json. */
@Component({
  selector: 'app-toast-view',
  imports: [SpToast],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-toast
      [kind]="'info'"
      [title]="'Order saved'"
      [description]="'Order 1042 was updated.'"
      [(open)]="open"
    />
  `,
})
export class ToastView {
  protected readonly open = signal<boolean>(true);
}
