<script setup lang="ts">
import { DEMO_PROPS, fixtureProps, GALLERY, sizeOf, UI_PAGE, uiFixtureParts, uiSizeOf, type HarnessDashboard, type HarnessFixture, type HarnessUiFixture } from '@silverpoint/example-harness';
import { SpAlert, SpBadge, SpButton, SpCard, SpCheckbox, SpDivider, SpInput, SpProgress, SpRadioGroup, SpRate, SpSegmented, SpSkeleton, SpSlider, SpSteps, SpSwitch, SpTabPanel, SpTabs, SpTag } from '@silverpoint/vue/ui';
import { computed } from 'vue';
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
const props = defineProps<{ fixture?: HarnessFixture; gallery?: boolean; dashboard?: HarnessDashboard; gate?: boolean; ui?: HarnessUiFixture; uiPage?: boolean }>();

/** Every UI component a fixture can name, by its slug. */
const UI = { button: SpButton, input: SpInput, checkbox: SpCheckbox, switch: SpSwitch, card: SpCard, divider: SpDivider, 'radio-group': SpRadioGroup, segmented: SpSegmented, tabs: SpTabs, slider: SpSlider, rate: SpRate, steps: SpSteps, tag: SpTag, badge: SpBadge, progress: SpProgress, alert: SpAlert, skeleton: SpSkeleton } as const;
/** A UI fixture as a consumer writes it: uncontrolled, the value as `default-value` (REQ-322). */
const uiParts = computed(() => (props.ui ? uiFixtureParts(props.ui) : undefined));

/** Every chart a fixture can name, by its chart name. */
const CHARTS = { LineChart: SpLineChart, BulletChart: SpBulletChart, PyramidChart: SpPyramidChart, HeatmapChart: SpHeatmapChart, TreemapChart: SpTreemapChart, SankeyChart: SpSankeyChart, ActivityGrid: SpActivityGrid, StepChart: SpStepChart, SparklineRows: SpSparklineRows, KpiCard: SpKpiCard, BarChart: SpBarChart, StackedBarChart: SpStackedBarChart, ComposedChart: SpComposedChart, WaterfallChart: SpWaterfallChart, FunnelChart: SpFunnelChart, CandlestickChart: SpCandlestickChart, AreaChart: SpAreaChart, RangeBandChart: SpRangeBandChart, StreamChart: SpStreamChart, ScatterChart: SpScatterChart, BubbleChart: SpBubbleChart, DonutChart: SpDonutChart, RadarChart: SpRadarChart, PolarBarChart: SpPolarBarChart, RadialArcGroup: SpRadialArcGroup, RadialRings: SpRadialRings, GaugeArc: SpGaugeArc, MeterChart: SpMeterChart, CoxcombChart: SpCoxcombChart, WindRose: SpWindRose, VolvelleChart: SpVolvelleChart, ChordRing: SpChordRing, OrbitChart: SpOrbitChart } as const;
</script>

<template>
  <main v-if="props.uiPage">
    <h1>{{ UI_PAGE.title }} · Vite + Vue</h1>
    <div class="sp-ui-page">
      <form
        v-for="panel in UI_PAGE.panels"
        :key="panel.key"
        :class="`sp-ui-page-panel sp-ground-${panel.ground}`"
        :data-substrate="panel.substrate"
        :data-panel="panel.key"
        :aria-labelledby="`${panel.key}-title`"
      >
        <h2 :id="`${panel.key}-title`">{{ panel.title }}</h2>
        <p class="sp-ui-page-note">{{ panel.note }}</p>
        <div class="sp-ui-page-sections">
          <section v-for="section in panel.sections" :key="section.title" class="sp-ui-page-section" :aria-label="section.title">
            <h3>{{ section.title }}</h3>
            <div class="sp-ui-page-items">
              <component
                :is="UI[item.component as keyof typeof UI]"
                v-for="item in section.items"
                :key="item.key"
                v-bind="{ ...item.props, ...(item.value === undefined ? {} : { defaultValue: item.value }) }"
              >
                <template v-if="item.chart" #default>
                  <component :is="CHARTS[item.chart.chart as keyof typeof CHARTS]" v-bind="item.chart.props" />
                </template>
                <template v-else-if="item.tabPanels" #default>
                  <SpTabPanel v-for="tab in item.tabPanels" :key="tab.value" :value="tab.value">{{ tab.text }}</SpTabPanel>
                </template>
                <template v-else-if="item.slots.content !== undefined" #default>{{ item.slots.content }}</template>
                <template v-if="item.slots.extra !== undefined" #extra>{{ item.slots.extra }}</template>
              </component>
            </div>
          </section>
        </div>
      </form>
    </div>
  </main>
  <main v-else-if="props.ui && uiParts">
    <div :class="`sp-harness sp-ground-${props.ui.ground}`" data-gate="" data-ui="" :data-substrate="props.ui.substrate" :data-size="uiSizeOf(props.ui)">
      <component
        :is="UI[props.ui.component as keyof typeof UI]"
        v-bind="{ ...uiParts.props, ...(uiParts.value === undefined ? {} : { defaultValue: uiParts.value }) }"
      >
        <template v-if="uiParts.slots.content !== undefined" #default>{{ uiParts.slots.content }}</template>
        <template v-if="uiParts.slots.extra !== undefined" #extra>{{ uiParts.slots.extra }}</template>
      </component>
    </div>
  </main>
  <main v-else-if="props.fixture">
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
