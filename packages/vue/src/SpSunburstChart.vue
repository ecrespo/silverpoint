<script setup lang="ts">
import { sunburstChart, rootChangeOf } from '@silverpoint/core/catalog';
import type { ActiveItem, ChartHandle, ChartRecipe, CommonChartProps, SunburstChartProps, Readout } from '@silverpoint/core';
import { ref } from 'vue';
import ChartShell from './ChartShell.vue';

/** `SpSunburstChart` (REQ-417): the same props as React's `SunburstChart`, name for name (API Spec §4). */
const props = defineProps<SunburstChartProps>();

const emit = defineEmits<{
  activeChange: [item: ActiveItem | null];
  select: [item: ActiveItem];
  /** The node to draw as root, for the consumer to pass back as `rootId` (REQ-439). */
  rootChange: [id: string | null];
}>();

defineSlots<{ tooltip?: (scope: { active: ActiveItem; readout: Readout }) => unknown }>();

const recipe = sunburstChart as ChartRecipe<CommonChartProps>;
const shell = ref<ChartHandle>();
defineExpose<ChartHandle>({
  getGeometry: () => shell.value!.getGeometry(),
  toSVGString: () => shell.value!.toSVGString(),
});

// `rootChange` is read from the drawing as it is now; the root stays the consumer's `rootId` (REQ-108).
function onSelect(item: ActiveItem): void {
  emit('select', item);
  if (shell.value) emit('rootChange', rootChangeOf(shell.value.getGeometry(), item));
}
</script>

<template>
  <ChartShell
    ref="shell"
    :recipe="recipe"
    :chart-props="props"
    @active-change="emit('activeChange', $event)"
    @select="onSelect"
  >
    <template v-if="$slots.tooltip" #tooltip="scope">
      <slot name="tooltip" v-bind="scope" />
    </template>
  </ChartShell>
</template>
