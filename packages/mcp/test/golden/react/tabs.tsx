import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import { useState } from 'react';
import { verdigris } from '@silverpoint/core/palettes';
import { SpTabs } from '@silverpoint/react/ui/tabs';

export function TabsView() {
  const [value, setValue] = useState<string>('overview');
  return (
    <SpTabs
      label="Views"
      items={[{ key: 'overview', label: 'Overview' }, { key: 'traffic', label: 'Traffic' }, { key: 'errors', label: 'Errors' }, { key: 'settings', label: 'Settings' }]}
      value={value}
      onChange={setValue}
      palette={verdigris}
    />
  );
}
