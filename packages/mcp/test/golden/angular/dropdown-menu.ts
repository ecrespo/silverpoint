import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SpDropdownMenu } from '@silverpoint/angular/ui/dropdown-menu';

/** Add '@silverpoint/fonts/fonts.css', '@silverpoint/grounds/styles.css', '@silverpoint/grounds/ui.css' to the `styles` of angular.json. */
@Component({
  selector: 'app-dropdown-menu-view',
  imports: [SpDropdownMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sp-dropdown-menu
      [label]="'Actions'"
      [items]="[{ type: 'label', key: 'order', label: 'Order 1042' }, { key: 'edit', label: 'Edit', shortcut: 'E' }, { key: 'duplicate', label: 'Duplicate', shortcut: 'D' }, { key: 'archive', label: 'Archive', disabled: true }, { type: 'separator', key: 'end' }, { key: 'delete', label: 'Delete', danger: true }]"
    />
  `,
})
export class DropdownMenuView {}
