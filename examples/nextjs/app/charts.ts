/**
 * Every chart a fixture or a dashboard can name, by its chart name: the client entries, which a
 * Server Component renders as client references (REQ-103, REQ-104).
 */
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

/** Every chart a fixture can name, by its chart name. */
export const CHARTS = { LineChart, BulletChart, PyramidChart, HeatmapChart, TreemapChart, SankeyChart, ActivityGrid, StepChart, SparklineRows, KpiCard, BarChart, StackedBarChart, ComposedChart, WaterfallChart, FunnelChart, CandlestickChart, AreaChart, RangeBandChart, StreamChart, ScatterChart, BubbleChart, DonutChart, RadarChart, PolarBarChart, RadialArcGroup, RadialRings, GaugeArc, MeterChart, CoxcombChart, WindRose, VolvelleChart, ChordRing, OrbitChart } as const;
