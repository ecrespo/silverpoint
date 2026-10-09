<script setup lang="ts">
import { beeswarmChart } from '@silverpoint/core/catalog';
import type { ActiveItem, ChartHandle, ChartRecipe, CommonChartProps, BeeswarmChartProps, Readout } from '@silverpoint/core';
import { ref } from 'vue';
import ChartShell from './ChartShell.vue';

/** `SpBeeswarmChart` (REQ-405): the same props as React's `BeeswarmChart`, name for name (API Spec §4). */
const props = defineProps<BeeswarmChartProps>();

const emit = defineEmits<{
  activeChange: [item: ActiveItem | null];
  select: [item: ActiveItem];
}>();

defineSlots<{ tooltip?: (scope: { active: ActiveItem; readout: Readout }) => unknown }>();

const recipe = beeswarmChart as ChartRecipe<CommonChartProps>;
const shell = ref<ChartHandle>();
defineExpose<ChartHandle>({
  getGeometry: () => shell.value!.getGeometry(),
  toSVGString: () => shell.value!.toSVGString(),
});
</script>

<template>
  <ChartShell
    ref="shell"
    :recipe="recipe"
    :chart-props="props"
    @active-change="emit('activeChange', $event)"
    @select="emit('select', $event)"
  >
    <template v-if="$slots.tooltip" #tooltip="scope">
      <slot name="tooltip" v-bind="scope" />
    </template>
  </ChartShell>
</template>
