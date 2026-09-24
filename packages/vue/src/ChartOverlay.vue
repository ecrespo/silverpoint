<script setup lang="ts">
import { readout, type ActiveItem, type Readout } from '@silverpoint/core';
import type { RenderedChart } from '@silverpoint/grounds';
import { computed } from 'vue';

/**
 * Marker, readout and live region of the active item (REQ-141, REQ-122). Every number comes from
 * the core's `readout`; this component only places it.
 */
const props = defineProps<{ rendered: RenderedChart; active: ActiveItem | null }>();

defineSlots<{ tooltip?: (scope: { active: ActiveItem; readout: Readout }) => unknown }>();

const current = computed(() => (props.active ? readout(props.rendered, props.active) : null));
</script>

<template>
  <template v-if="current && active">
    <svg class="sp-marker" :viewBox="rendered.view.svg.viewBox" aria-hidden="true" focusable="false">
      <path :d="current.marker.d" />
    </svg>
    <div class="sp-readout" :style="{ left: current.left, top: current.top }" aria-hidden="true">
      <slot name="tooltip" :active="active" :readout="current">
        <span class="sp-readout-heading">{{ current.heading }}</span>{{ current.text }}
      </slot>
    </div>
  </template>
  <div class="sp-live" aria-live="polite">{{ current ? current.announcement : '' }}</div>
</template>
