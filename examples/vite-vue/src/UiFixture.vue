<script setup lang="ts">
import { uiSizeOf, type HarnessUiFixture } from '@silverpoint/example-harness';
import UiComponent from './UiComponent.vue';

const props = defineProps<{ fixture: HarnessUiFixture }>();
</script>

<template>
  <div :class="`sp-harness sp-ground-${props.fixture.ground}`" data-gate="" data-ui="" :data-substrate="props.fixture.substrate" :data-size="uiSizeOf(props.fixture)">
    <UiComponent :fixture="props.fixture" />
  </div>
</template>
