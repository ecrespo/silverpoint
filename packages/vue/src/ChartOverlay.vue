<script setup lang="ts">
import { linkedMarks, readout, type ActiveItem, type Readout } from '@silverpoint/core';
import type { RenderedChart } from '@silverpoint/grounds';
import { computed, inject } from 'vue';
import { DASHBOARD_LINK } from './dashboard-context';

/**
 * Marker, readout and live region of the active item (REQ-141, REQ-122). Every number comes from
 * the core's `readout`; this component only places it.
 */
const props = defineProps<{ rendered: RenderedChart; active: ActiveItem | null }>();

defineSlots<{ tooltip?: (scope: { active: ActiveItem; readout: Readout }) => unknown }>();

const current = computed(() => (props.active ? readout(props.rendered, props.active) : null));
// Another chart's linked item, marked here and hidden from assistive technology (REQ-216, REQ-218).
const link = inject(DASHBOARD_LINK, undefined);
const linked = computed(() => linkedMarks(props.rendered, link?.state.value));
</script>

<template>
  <svg v-if="linked.length > 0" class="sp-marker" part="linked" :viewBox="rendered.view.svg.viewBox" aria-hidden="true" focusable="false">
    <path v-for="(d, index) in linked" :key="index" :d="d" />
  </svg>
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
