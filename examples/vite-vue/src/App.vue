<script setup lang="ts">
import { DEMO_PROPS, fixtureProps, GALLERY, sizeOf, type HarnessDashboard, type HarnessFixture } from '@silverpoint/example-harness';
import { SpDashboard, SpDashboardCell } from '@silverpoint/vue/dashboard';
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
import { SpDonutChart } from '@silverpoint/vue/donut-chart';
import { SpRadarChart } from '@silverpoint/vue/radar-chart';
import { SpPolarBarChart } from '@silverpoint/vue/polar-bar-chart';
import { SpRadialArcGroup } from '@silverpoint/vue/radial-arc-group';
import { SpRadialRings } from '@silverpoint/vue/radial-rings';
import { SpGaugeArc } from '@silverpoint/vue/gauge-arc';
import { SpMeterChart } from '@silverpoint/vue/meter-chart';
import { SpCoxcombChart } from '@silverpoint/vue/coxcomb-chart';
import { SpWindRose } from '@silverpoint/vue/wind-rose';
import { SpVolvelleChart } from '@silverpoint/vue/volvelle-chart';
import { SpChordRing } from '@silverpoint/vue/chord-ring';
import { SpOrbitChart } from '@silverpoint/vue/orbit-chart';

/** `dashboard` with `gate`: a pixel-gate page; without: the `/dashboard` page (REQ-221). */
const props = defineProps<{ fixture?: HarnessFixture; gallery?: boolean; dashboard?: HarnessDashboard; gate?: boolean }>();

/** Every chart a fixture can name, by its chart name. */
const CHARTS = { LineChart: SpLineChart, BulletChart: SpBulletChart, PyramidChart: SpPyramidChart, HeatmapChart: SpHeatmapChart, TreemapChart: SpTreemapChart, SankeyChart: SpSankeyChart, ActivityGrid: SpActivityGrid, StepChart: SpStepChart, SparklineRows: SpSparklineRows, KpiCard: SpKpiCard, BarChart: SpBarChart, StackedBarChart: SpStackedBarChart, ComposedChart: SpComposedChart, WaterfallChart: SpWaterfallChart, FunnelChart: SpFunnelChart, CandlestickChart: SpCandlestickChart, AreaChart: SpAreaChart, RangeBandChart: SpRangeBandChart, StreamChart: SpStreamChart, ScatterChart: SpScatterChart, BubbleChart: SpBubbleChart, DonutChart: SpDonutChart, RadarChart: SpRadarChart, PolarBarChart: SpPolarBarChart, RadialArcGroup: SpRadialArcGroup, RadialRings: SpRadialRings, GaugeArc: SpGaugeArc, MeterChart: SpMeterChart, CoxcombChart: SpCoxcombChart, WindRose: SpWindRose, VolvelleChart: SpVolvelleChart, ChordRing: SpChordRing, OrbitChart: SpOrbitChart } as const;
</script>

<template>
  <main v-if="props.fixture">
    <div class="sp-harness" data-gate="" :data-size="sizeOf(props.fixture)">
      <component :is="CHARTS[props.fixture.chart as keyof typeof CHARTS]" v-bind="fixtureProps(props.fixture)" />
    </div>
  </main>
  <main v-else-if="props.dashboard">
    <h1 v-if="!props.gate">silverpoint · Vite + Vue · dashboard</h1>
    <div :class="props.gate ? 'sp-dashboard-harness' : undefined" :data-gate="props.gate ? '' : undefined">
      <SpDashboard v-bind="props.dashboard.props">
        <SpDashboardCell v-for="child in props.dashboard.children" :key="child.cell" :cell="child.cell">
          <component :is="CHARTS[child.chart as keyof typeof CHARTS]" v-bind="child.props" />
        </SpDashboardCell>
      </SpDashboard>
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
