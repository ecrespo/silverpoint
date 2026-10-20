<script setup lang="ts">
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import { ref } from 'vue';
import { SpToast } from '@silverpoint/vue/ui/toast';

const open = ref<boolean>(true);
</script>

<template>
  <SpToast
    kind="info"
    title="Order saved"
    description="Order 1042 was updated."
    v-model:open="open"
  />
</template>
