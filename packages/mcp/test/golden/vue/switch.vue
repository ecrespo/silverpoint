<script setup lang="ts">
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import { ref } from 'vue';
import { SpSwitch } from '@silverpoint/vue/ui/switch';

const value = ref<boolean>(false);
</script>

<template>
  <SpSwitch
    label="Linked hover"
    name="linked"
    v-model="value"
  />
</template>
