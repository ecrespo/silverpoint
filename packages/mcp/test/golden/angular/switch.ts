import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SpSwitch } from '@silverpoint/angular/ui/switch';

/** Add '@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css', '@silverpoint/grounds/ui.css' to the `styles` of angular.json. */
@Component({
  selector: 'app-switch-view',
  imports: [SpSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-switch
      [label]="'Linked hover'"
      [name]="'linked'"
      [(value)]="value"
    />
  `,
})
export class SwitchView {
  protected readonly value = signal<boolean>(false);
}
