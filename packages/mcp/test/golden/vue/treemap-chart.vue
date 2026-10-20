<script setup lang="ts">
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { SpTreemapChart } from '@silverpoint/vue/treemap-chart';

defineProps<{ rows: readonly Record<string, unknown>[] }>();
</script>

<template>
  <SpTreemapChart
    :data="rows"
    labelKey="folder"
    shareKey="bytes"
    title="Treemap chart"
  />
</template>
