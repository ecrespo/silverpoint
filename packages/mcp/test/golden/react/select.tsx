import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import { useState } from 'react';
import { SpSelect } from '@silverpoint/react/ui/select';

export function SelectView() {
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <SpSelect
      label="Status"
      name="status"
      items={[{ key: 'placed', label: 'Placed' }, { key: 'paid', label: 'Paid' }, { key: 'packed', label: 'Packed' }, { key: 'shipped', label: 'Shipped' }, { key: 'returned', label: 'Returned', disabled: true }]}
      value={value}
      onChange={setValue}
    />
  );
}
