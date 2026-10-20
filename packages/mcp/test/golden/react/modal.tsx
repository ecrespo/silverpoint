import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import { SpModal } from '@silverpoint/react/ui/modal';

export function ModalView() {
  return (
    <SpModal
      title="Edit order"
      description="Order 1042, placed on 14 October."
      trigger={<button type="button">Edit order</button>}
    >
      Changes reach the workshop before the order is packed.
    </SpModal>
  );
}
