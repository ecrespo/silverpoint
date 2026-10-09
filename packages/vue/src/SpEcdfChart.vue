<script setup lang="ts">
import { ecdfChart } from '@silverpoint/core/catalog';
import type { ActiveItem, ChartHandle, ChartRecipe, CommonChartProps, EcdfChartProps, Readout } from '@silverpoint/core';
import { ref } from 'vue';
import ChartShell from './ChartShell.vue';

/** `SpEcdfChart` (REQ-401): the same props as React's `EcdfChart`, name for name (API Spec §4). */
const props = defineProps<EcdfChartProps>();

const emit = defineEmits<{
  activeChange: [item: ActiveItem | null];
  select: [item: ActiveItem];
}>();

defineSlots<{ tooltip?: (scope: { active: ActiveItem; readout: Readout }) => unknown }>();

const recipe = ecdfChart as ChartRecipe<CommonChartProps>;
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
