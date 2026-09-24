<script setup lang="ts">
import { instanceId, lineChart, type ActiveItem, type LineChartProps } from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import * as Vue from 'vue';
import { computed, getCurrentInstance, ref } from 'vue';
import ChartFrame from './ChartFrame.vue';
import { useForcedPrecision, useMeasuredWidth, useProvider } from './environment';

/** `SpLineChart` (REQ-060): the same props as React's `LineChart`, name for name (API Spec §4). */
const props = defineProps<LineChartProps>();

defineEmits<{
  activeChange: [item: ActiveItem | null];
  select: [item: ActiveItem];
}>();

// `useId` arrived in Vue 3.5; 3.4 falls back to the instance uid, which is also stable per render order.
const generated = (Vue as { useId?: () => string }).useId?.() ?? `v-${getCurrentInstance()?.uid ?? 0}`;
const provider = useProvider();
const forcedPrecision = useForcedPrecision();
const root = ref<{ $el: HTMLElement }>();
const element = computed(() => root.value?.$el);
const measured = useMeasuredWidth(element, () => props.width === undefined);

const rendered = computed(() =>
  renderChart(lineChart, props, {
    id: instanceId(lineChart.name, generated),
    width: measured.value,
    provider,
    forcedPrecision: forcedPrecision.value,
  }),
);

const rootClass = computed(() =>
  ['sp-root', `sp-ground-${rendered.value.ground}`, props.className].filter(Boolean).join(' '),
);

defineExpose({
  getGeometry: () => rendered.value.geometry,
  toSVGString: () => toSVGString(rendered.value),
});
</script>

<template>
  <ChartFrame ref="root" :rendered="rendered" :root-class="rootClass" />
</template>
