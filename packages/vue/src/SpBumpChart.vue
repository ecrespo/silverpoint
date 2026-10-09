<script setup lang="ts">
import { bumpChart } from '@silverpoint/core/catalog';
import type { ActiveItem, ChartHandle, ChartRecipe, CommonChartProps, BumpChartProps, Readout } from '@silverpoint/core';
import { ref } from 'vue';
import ChartShell from './ChartShell.vue';

/** `SpBumpChart` (REQ-409): the same props as React's `BumpChart`, name for name (API Spec §4). */
const props = defineProps<BumpChartProps>();

const emit = defineEmits<{
  activeChange: [item: ActiveItem | null];
  select: [item: ActiveItem];
}>();

defineSlots<{ tooltip?: (scope: { active: ActiveItem; readout: Readout }) => unknown }>();

const recipe = bumpChart as ChartRecipe<CommonChartProps>;
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
