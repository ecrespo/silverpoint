<script setup lang="ts">
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import { ref } from 'vue';
import { verdigris } from '@silverpoint/core/palettes';
import { SpTabs } from '@silverpoint/vue/ui/tabs';

const value = ref<string>('overview');
</script>

<template>
  <SpTabs
    label="Views"
    :items="[{ key: 'overview', label: 'Overview' }, { key: 'traffic', label: 'Traffic' }, { key: 'errors', label: 'Errors' }, { key: 'settings', label: 'Settings' }]"
    v-model="value"
    :palette="verdigris"
  />
</template>
