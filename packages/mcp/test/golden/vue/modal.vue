<script setup lang="ts">
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import { SpModal } from '@silverpoint/vue/ui/modal';
</script>

<template>
  <SpModal
    title="Edit order"
    description="Order 1042, placed on 14 October."
  >
    <template #trigger><button type="button">Edit order</button></template>
    Changes reach the workshop before the order is packed.
  </SpModal>
</template>
