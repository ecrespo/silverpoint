<script setup lang="ts">
import { DEMO_PROPS, fixtureProps, type HarnessFixture } from '@silverpoint/example-harness';
import { SpLineChart } from '@silverpoint/vue/line-chart';
import { SpBulletChart } from '@silverpoint/vue/bullet-chart';
import { SpPyramidChart } from '@silverpoint/vue/pyramid-chart';
import { SpHeatmapChart } from '@silverpoint/vue/heatmap-chart';
import { SpTreemapChart } from '@silverpoint/vue/treemap-chart';
import { SpSankeyChart } from '@silverpoint/vue/sankey-chart';
import { SpActivityGrid } from '@silverpoint/vue/activity-grid';

const props = defineProps<{ fixture?: HarnessFixture }>();

/** Every chart a fixture can name, by its chart name. */
const CHARTS = { LineChart: SpLineChart, BulletChart: SpBulletChart, PyramidChart: SpPyramidChart, HeatmapChart: SpHeatmapChart, TreemapChart: SpTreemapChart, SankeyChart: SpSankeyChart, ActivityGrid: SpActivityGrid } as const;
</script>

<template>
  <main v-if="props.fixture">
    <div class="sp-harness" data-gate="" data-size="md">
      <component :is="CHARTS[props.fixture.chart as keyof typeof CHARTS]" v-bind="fixtureProps(props.fixture)" />
    </div>
  </main>
  <main v-else>
    <h1>silverpoint · Vite + Vue</h1>
    <div class="sp-harness" data-size="md">
      <SpLineChart v-bind="DEMO_PROPS" />
    </div>
  </main>
</template>
