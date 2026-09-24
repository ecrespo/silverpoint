<script setup lang="ts">
import { DEMO_PROPS, fixtureProps, type HarnessFixture } from '@silverpoint/example-harness';
import { SpLineChart } from '@silverpoint/vue/line-chart';

const props = defineProps<{ fixture?: HarnessFixture }>();
</script>

<template>
  <main v-if="props.fixture">
    <div class="sp-harness" data-gate="" data-size="md">
      <SpLineChart v-bind="fixtureProps(props.fixture)" />
    </div>
  </main>
  <main v-else>
    <h1>silverpoint · Vite + Vue</h1>
    <div class="sp-harness" data-size="md">
      <SpLineChart v-bind="DEMO_PROPS" />
    </div>
  </main>
</template>
