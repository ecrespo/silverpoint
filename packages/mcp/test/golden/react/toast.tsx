import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import { useState } from 'react';
import { SpToast } from '@silverpoint/react/ui/toast';

export function ToastView() {
  const [open, setOpen] = useState<boolean>(true);
  return (
    <SpToast
      kind="info"
      title="Order saved"
      description="Order 1042 was updated."
      open={open}
      onOpenChange={setOpen}
    />
  );
}
