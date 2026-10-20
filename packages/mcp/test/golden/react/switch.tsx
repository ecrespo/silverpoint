import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import { useState } from 'react';
import { SpSwitch } from '@silverpoint/react/ui/switch';

export function SwitchView() {
  const [value, setValue] = useState<boolean>(false);
  return (
    <SpSwitch
      label="Linked hover"
      name="linked"
      checked={value}
      onChange={setValue}
    />
  );
}
