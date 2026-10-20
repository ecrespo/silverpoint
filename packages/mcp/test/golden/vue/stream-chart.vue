<script setup lang="ts">
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { sanguine } from '@silverpoint/core/palettes';
import { SpStreamChart } from '@silverpoint/vue/stream-chart';

defineProps<{ rows: readonly Record<string, unknown>[] }>();
</script>

<template>
  <SpStreamChart
    :data="rows"
    xKey="day"
    :keys="['hits', 'misses']"
    title="Stream chart"
    mode="precision"
    :palette="sanguine"
  />
</template>
