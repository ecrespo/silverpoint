import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import { SpDropdownMenu } from '@silverpoint/react/ui/dropdown-menu';

export function DropdownMenuView() {
  return (
    <SpDropdownMenu
      label="Actions"
      items={[{ type: 'label', key: 'order', label: 'Order 1042' }, { key: 'edit', label: 'Edit', shortcut: 'E' }, { key: 'duplicate', label: 'Duplicate', shortcut: 'D' }, { key: 'archive', label: 'Archive', disabled: true }, { type: 'separator', key: 'end' }, { key: 'delete', label: 'Delete', danger: true }]}
    />
  );
}
