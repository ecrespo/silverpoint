<script setup lang="ts">
import { DEMO_PROPS, fixtureProps, GALLERY, type HarnessFixture } from '@silverpoint/example-harness';
import { SpLineChart } from '@silverpoint/vue/line-chart';
import { SpBulletChart } from '@silverpoint/vue/bullet-chart';
import { SpPyramidChart } from '@silverpoint/vue/pyramid-chart';
import { SpHeatmapChart } from '@silverpoint/vue/heatmap-chart';
import { SpTreemapChart } from '@silverpoint/vue/treemap-chart';
import { SpSankeyChart } from '@silverpoint/vue/sankey-chart';
import { SpActivityGrid } from '@silverpoint/vue/activity-grid';
import { SpStepChart } from '@silverpoint/vue/step-chart';
import { SpSparklineRows } from '@silverpoint/vue/sparkline-rows';
import { SpKpiCard } from '@silverpoint/vue/kpi-card';
import { SpBarChart } from '@silverpoint/vue/bar-chart';
import { SpStackedBarChart } from '@silverpoint/vue/stacked-bar-chart';
import { SpComposedChart } from '@silverpoint/vue/composed-chart';
import { SpWaterfallChart } from '@silverpoint/vue/waterfall-chart';
import { SpFunnelChart } from '@silverpoint/vue/funnel-chart';
import { SpCandlestickChart } from '@silverpoint/vue/candlestick-chart';
import { SpAreaChart } from '@silverpoint/vue/area-chart';
import { SpRangeBandChart } from '@silverpoint/vue/range-band-chart';
import { SpStreamChart } from '@silverpoint/vue/stream-chart';
import { SpScatterChart } from '@silverpoint/vue/scatter-chart';
import { SpBubbleChart } from '@silverpoint/vue/bubble-chart';

const props = defineProps<{ fixture?: HarnessFixture; gallery?: boolean }>();

/** Every chart a fixture can name, by its chart name. */
const CHARTS = { LineChart: SpLineChart, BulletChart: SpBulletChart, PyramidChart: SpPyramidChart, HeatmapChart: SpHeatmapChart, TreemapChart: SpTreemapChart, SankeyChart: SpSankeyChart, ActivityGrid: SpActivityGrid, StepChart: SpStepChart, SparklineRows: SpSparklineRows, KpiCard: SpKpiCard, BarChart: SpBarChart, StackedBarChart: SpStackedBarChart, ComposedChart: SpComposedChart, WaterfallChart: SpWaterfallChart, FunnelChart: SpFunnelChart, CandlestickChart: SpCandlestickChart, AreaChart: SpAreaChart, RangeBandChart: SpRangeBandChart, StreamChart: SpStreamChart, ScatterChart: SpScatterChart, BubbleChart: SpBubbleChart } as const;
</script>

<template>
  <main v-if="props.fixture">
    <div class="sp-harness" data-gate="" data-size="md">
      <component :is="CHARTS[props.fixture.chart as keyof typeof CHARTS]" v-bind="fixtureProps(props.fixture)" />
    </div>
  </main>
  <main v-else-if="props.gallery">
    <h1>silverpoint · Vite + Vue · gallery</h1>
    <div class="sp-gallery">
      <div v-for="item in GALLERY" :key="item.chart" class="sp-harness" data-size="md">
        <component :is="CHARTS[item.chart as keyof typeof CHARTS]" v-bind="item.props" />
      </div>
    </div>
  </main>
  <main v-else>
    <h1>silverpoint · Vite + Vue</h1>
    <div class="sp-harness" data-size="md">
      <SpLineChart v-bind="DEMO_PROPS" />
    </div>
  </main>
</template>
