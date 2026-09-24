<script setup lang="ts">
import {
  instanceId,
  lineChart,
  reduceInteraction,
  type ActiveItem,
  type InteractionEvent,
  type LineChartProps,
  type PointerKind,
  type Readout,
} from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import * as Vue from 'vue';
import { computed, getCurrentInstance, ref } from 'vue';
import ChartFrame from './ChartFrame.vue';
import ChartOverlay from './ChartOverlay.vue';
import { useForcedPrecision, useMeasuredWidth, useProvider } from './environment';

/** `SpLineChart` (REQ-060): the same props as React's `LineChart`, name for name (API Spec §4). */
const props = defineProps<LineChartProps>();

const emit = defineEmits<{
  activeChange: [item: ActiveItem | null];
  select: [item: ActiveItem];
}>();

defineSlots<{ tooltip?: (scope: { active: ActiveItem; readout: Readout }) => unknown }>();

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

// The active item is interaction state REQ-141 requires; see the phase-0 ledger on REQ-108.
const active = ref<ActiveItem | null>(null);

function dispatch(event: InteractionEvent): boolean {
  const result = reduceInteraction(rendered.value.geometry, active.value, event);
  if (result.changed) {
    active.value = result.active;
    emit('activeChange', result.active);
  }
  if (result.selected) emit('select', result.selected);
  return result.handled;
}

function onPointer(type: 'pointer' | 'click', event: PointerEvent | MouseEvent): void {
  const svg = element.value?.querySelector('svg.sp-chart');
  if (!svg) return;
  const box = svg.getBoundingClientRect();
  dispatch({
    type,
    client: { x: event.clientX, y: event.clientY },
    box: { left: box.left, top: box.top, width: box.width, height: box.height },
    kind: (('pointerType' in event && event.pointerType) || 'mouse') as PointerKind,
  });
}

function onKeydown(event: KeyboardEvent): void {
  if (dispatch({ type: 'key', key: event.key })) event.preventDefault();
}

defineExpose({
  getGeometry: () => rendered.value.geometry,
  toSVGString: () => toSVGString(rendered.value),
});
</script>

<template>
  <ChartFrame
    ref="root"
    :rendered="rendered"
    :root-class="rootClass"
    tabindex="0"
    role="group"
    :aria-label="rendered.name"
    @pointermove="onPointer('pointer', $event)"
    @pointerdown="onPointer('pointer', $event)"
    @click="onPointer('click', $event)"
    @pointerleave="dispatch({ type: 'leave' })"
    @focus="dispatch({ type: 'focus' })"
    @blur="dispatch({ type: 'blur' })"
    @keydown="onKeydown"
  >
    <ChartOverlay :rendered="rendered" :active="active">
      <template v-if="$slots.tooltip" #tooltip="scope">
        <slot name="tooltip" v-bind="scope" />
      </template>
    </ChartOverlay>
  </ChartFrame>
</template>
