/** Every chart of the catalog, by name, through the React adapter as a user imports it (per subpath). */
import { LineChart } from '@silverpoint/react/line-chart';
import { BulletChart } from '@silverpoint/react/bullet-chart';
import { PyramidChart } from '@silverpoint/react/pyramid-chart';
import { HeatmapChart } from '@silverpoint/react/heatmap-chart';
import { TreemapChart } from '@silverpoint/react/treemap-chart';
import { SankeyChart } from '@silverpoint/react/sankey-chart';
import { ActivityGrid } from '@silverpoint/react/activity-grid';
import { StepChart } from '@silverpoint/react/step-chart';
import { SparklineRows } from '@silverpoint/react/sparkline-rows';
import { KpiCard } from '@silverpoint/react/kpi-card';
import { BarChart } from '@silverpoint/react/bar-chart';
import { StackedBarChart } from '@silverpoint/react/stacked-bar-chart';
import { ComposedChart } from '@silverpoint/react/composed-chart';
import { WaterfallChart } from '@silverpoint/react/waterfall-chart';
import { FunnelChart } from '@silverpoint/react/funnel-chart';
import { CandlestickChart } from '@silverpoint/react/candlestick-chart';
import { AreaChart } from '@silverpoint/react/area-chart';
import { RangeBandChart } from '@silverpoint/react/range-band-chart';
import { StreamChart } from '@silverpoint/react/stream-chart';
import { ScatterChart } from '@silverpoint/react/scatter-chart';
import { BubbleChart } from '@silverpoint/react/bubble-chart';
import { DonutChart } from '@silverpoint/react/donut-chart';
import { RadarChart } from '@silverpoint/react/radar-chart';
import { PolarBarChart } from '@silverpoint/react/polar-bar-chart';
import { RadialArcGroup } from '@silverpoint/react/radial-arc-group';
import { RadialRings } from '@silverpoint/react/radial-rings';
import { GaugeArc } from '@silverpoint/react/gauge-arc';
import { MeterChart } from '@silverpoint/react/meter-chart';
import { CoxcombChart } from '@silverpoint/react/coxcomb-chart';
import { WindRose } from '@silverpoint/react/wind-rose';
import { VolvelleChart } from '@silverpoint/react/volvelle-chart';
import { ChordRing } from '@silverpoint/react/chord-ring';
import { OrbitChart } from '@silverpoint/react/orbit-chart';

export interface SiteChart {
  readonly chart: string;
  readonly slug: string;
  /** The component: its props are the chart's own plus the common ones. */
  readonly Component: (props: Record<string, unknown>) => ReturnType<typeof LineChart>;
}

/** In catalog order: the three engines' charts as the phases built them. */
export const CHARTS: readonly SiteChart[] = [
  { chart: 'LineChart', slug: 'line-chart', Component: LineChart as SiteChart['Component'] },
  { chart: 'BulletChart', slug: 'bullet-chart', Component: BulletChart as SiteChart['Component'] },
  { chart: 'PyramidChart', slug: 'pyramid-chart', Component: PyramidChart as SiteChart['Component'] },
  { chart: 'HeatmapChart', slug: 'heatmap-chart', Component: HeatmapChart as SiteChart['Component'] },
  { chart: 'TreemapChart', slug: 'treemap-chart', Component: TreemapChart as SiteChart['Component'] },
  { chart: 'SankeyChart', slug: 'sankey-chart', Component: SankeyChart as SiteChart['Component'] },
  { chart: 'ActivityGrid', slug: 'activity-grid', Component: ActivityGrid as SiteChart['Component'] },
  { chart: 'StepChart', slug: 'step-chart', Component: StepChart as SiteChart['Component'] },
  { chart: 'SparklineRows', slug: 'sparkline-rows', Component: SparklineRows as SiteChart['Component'] },
  { chart: 'KpiCard', slug: 'kpi-card', Component: KpiCard as SiteChart['Component'] },
  { chart: 'BarChart', slug: 'bar-chart', Component: BarChart as SiteChart['Component'] },
  { chart: 'StackedBarChart', slug: 'stacked-bar-chart', Component: StackedBarChart as SiteChart['Component'] },
  { chart: 'ComposedChart', slug: 'composed-chart', Component: ComposedChart as SiteChart['Component'] },
  { chart: 'WaterfallChart', slug: 'waterfall-chart', Component: WaterfallChart as SiteChart['Component'] },
  { chart: 'FunnelChart', slug: 'funnel-chart', Component: FunnelChart as SiteChart['Component'] },
  { chart: 'CandlestickChart', slug: 'candlestick-chart', Component: CandlestickChart as SiteChart['Component'] },
  { chart: 'AreaChart', slug: 'area-chart', Component: AreaChart as SiteChart['Component'] },
  { chart: 'RangeBandChart', slug: 'range-band-chart', Component: RangeBandChart as SiteChart['Component'] },
  { chart: 'StreamChart', slug: 'stream-chart', Component: StreamChart as SiteChart['Component'] },
  { chart: 'ScatterChart', slug: 'scatter-chart', Component: ScatterChart as SiteChart['Component'] },
  { chart: 'BubbleChart', slug: 'bubble-chart', Component: BubbleChart as SiteChart['Component'] },
  { chart: 'DonutChart', slug: 'donut-chart', Component: DonutChart as SiteChart['Component'] },
  { chart: 'RadarChart', slug: 'radar-chart', Component: RadarChart as SiteChart['Component'] },
  { chart: 'PolarBarChart', slug: 'polar-bar-chart', Component: PolarBarChart as SiteChart['Component'] },
  { chart: 'RadialArcGroup', slug: 'radial-arc-group', Component: RadialArcGroup as SiteChart['Component'] },
  { chart: 'RadialRings', slug: 'radial-rings', Component: RadialRings as SiteChart['Component'] },
  { chart: 'GaugeArc', slug: 'gauge-arc', Component: GaugeArc as SiteChart['Component'] },
  { chart: 'MeterChart', slug: 'meter-chart', Component: MeterChart as SiteChart['Component'] },
  { chart: 'CoxcombChart', slug: 'coxcomb-chart', Component: CoxcombChart as SiteChart['Component'] },
  { chart: 'WindRose', slug: 'wind-rose', Component: WindRose as SiteChart['Component'] },
  { chart: 'VolvelleChart', slug: 'volvelle-chart', Component: VolvelleChart as SiteChart['Component'] },
  { chart: 'ChordRing', slug: 'chord-ring', Component: ChordRing as SiteChart['Component'] },
  { chart: 'OrbitChart', slug: 'orbit-chart', Component: OrbitChart as SiteChart['Component'] },
];

export const chartBySlug = (slug: string | undefined): SiteChart | undefined => CHARTS.find((c) => c.slug === slug);
