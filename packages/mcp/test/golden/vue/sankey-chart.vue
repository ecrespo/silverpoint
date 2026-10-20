<script setup lang="ts">
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { SpSankeyChart } from '@silverpoint/vue/sankey-chart';

defineProps<{ rows: readonly Record<string, unknown>[] }>();
</script>

<template>
  <SpSankeyChart
    :data="rows"
    sourceKey="from"
    targetKey="to"
    valueKey="count"
    title="Signup flow"
    :height="240"
    ground="cyanotype"
  />
</template>
