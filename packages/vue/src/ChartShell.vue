<script setup lang="ts">
import {
  inCell,
  instanceId,
  reduceInteraction,
  type ActiveItem,
  type ChartRecipe,
  type CommonChartProps,
  type InteractionEvent,
  type PointerKind,
  type Readout,
} from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import { computed, inject, onBeforeUnmount, ref, useId, watch } from 'vue';
import ChartFrame from './ChartFrame.vue';
import ChartOverlay from './ChartOverlay.vue';
import { DASHBOARD_CELL } from './dashboard-context';
import { useForcedPrecision, useMeasuredWidth, useProvider, useTypefaceCheck } from './environment';

/**
 * The body every chart component shares: it measures, renders a recipe through the core
 * pipeline and forwards interaction events to the core's reducer. Each `Sp*` component declares
 * its own typed props and hands them here with its recipe, so the charts differ only in the
 * recipe (Art. 2).
 */
const props = defineProps<{ recipe: ChartRecipe<CommonChartProps>; chartProps: CommonChartProps }>();

const emit = defineEmits<{
  activeChange: [item: ActiveItem | null];
  select: [item: ActiveItem];
}>();

defineSlots<{ tooltip?: (scope: { active: ActiveItem; readout: Readout }) => unknown }>();

// Vue's useId counts per application, so a server render and the hydrating client agree (REQ-109).
const generated = useId();
const provider = useProvider();
const forcedPrecision = useForcedPrecision();
useTypefaceCheck(props.recipe.name);
const root = ref<{ $el: HTMLElement }>();
const element = computed(() => root.value?.$el);
const measured = useMeasuredWidth(element, () => props.chartProps.width === undefined);
// Inside a dashboard cell: its id, height and config, and its nominal width until measured
// (REQ-206, REQ-207, REQ-209, REQ-212); the chart's own props win.
const cell = inject(DASHBOARD_CELL, undefined);

const rendered = computed(() => {
  const fitted = inCell(props.chartProps, cell?.value, props.recipe);
  return renderChart(props.recipe, fitted.props, {
    id: instanceId(props.recipe.name, generated),
    width: measured.value ?? fitted.width,
    provider,
    forcedPrecision: forcedPrecision.value,
  });
});

const rootClass = computed(() =>
  ['sp-root', `sp-ground-${rendered.value.ground}`, props.chartProps.className].filter(Boolean).join(' '),
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

// WCAG 1.4.13: a readout shown by the pointer is dismissible with Escape wherever focus is.
function onDocumentKey(event: KeyboardEvent): void {
  if (event.key === 'Escape' && !element.value?.contains(event.target as Node)) dispatch({ type: 'key', key: 'Escape' });
}
watch(
  () => active.value !== null,
  (showing) => {
    if (showing) document.addEventListener('keydown', onDocumentKey);
    else document.removeEventListener('keydown', onDocumentKey);
  },
);
onBeforeUnmount(() => document.removeEventListener('keydown', onDocumentKey));

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
