import type { Accessor, Datum, InkMode, Seed, SubstrateName } from './data';
import type { GroundRef } from './ground';

/** Props present in every chart, identical in React and Angular (REQ-094). */
export interface CommonChartProps {
  /**
   * Rows to draw. If omitted, the demo dataset is rendered (REQ-093): accessor props (`…Key`,
   * `keys`, `names`) are ignored, every other prop applies.
   */
  data?: readonly Datum[];

  /** Style ground. Defaults to the app provider's, or `silverpoint`. */
  ground?: GroundRef;
  /** Prepared substrate within the ground (REQ-046). */
  substrate?: SubstrateName;
  /** `ink` by default; `precision` disables inking (REQ-021). */
  mode?: InkMode;
  /** Seed. If omitted, it is derived from `id` stably (REQ-003). */
  seed?: Seed;

  /** Stable identifier. If omitted, it is generated deterministically. */
  id?: string;
  /** Height of the drawing area in px. Width is the container's unless pinned. */
  height?: number;
  width?: number;

  /** `card` draws the full frame; `bare` only the drawing area (REQ-095). */
  chrome?: 'card' | 'bare';
  /** How areas are filled (REQ-029). */
  hatchFill?: 'tile' | 'per-shape';
  title?: string;
  badge?: string;
  value?: string | number;
  unit?: string;
  footerLeft?: string;
  footerRight?: string;

  /** Accessible name. If omitted, it is derived from `title` (REQ-120). */
  label?: string;
  /** Long description for screen readers (REQ-120). */
  description?: string;
  /** Tabular alternative; `hidden` leaves it for assistive technology only (REQ-121). */
  dataTable?: 'visible' | 'hidden' | 'none';

  locale?: string;
  numberFormat?: Intl.NumberFormatOptions;

  className?: string;
}

export type LineCurve = 'monotone' | 'linear' | 'natural' | 'step';

/** `LineChart` (REQ-060): spline with an optional dotted baseline series. */
export interface LineChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  secondaryKey?: Accessor<number | null | undefined>;
  curve?: LineCurve;
  /** `all` draws the secondary series when there is one; `primary` omits it. */
  series?: 'all' | 'primary';
  /** Whether a gap left by a missing value is bridged (REQ-008). */
  connectNulls?: boolean;
}

/** Configuration an application sets once for every chart (API Spec §8). */
export interface ProviderConfig {
  ground?: GroundRef;
  substrate?: SubstrateName;
  mode?: InkMode;
  locale?: string;
}

/** `BulletChart` (REQ-069): one bar per target, with a marker at the target. Values in 0-100. */
export interface BulletChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  titleKey?: Accessor<string>;
  /** Ignored without `data`. */
  actualKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  targetKey?: Accessor<number | null | undefined>;
}

/** `PyramidChart` (REQ-070): stacked tiers whose width encodes the value (0-100). */
export interface PyramidChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  labelKey?: Accessor<string>;
  /** Ignored without `data`. */
  widthKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  toneKey?: Accessor<number | null | undefined>;
}

/** `HeatmapChart` (REQ-084): labelled rows of values, normalised against `scaleMax`. */
export interface HeatmapChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  labelKey?: Accessor<string>;
  /** Ignored without `data`. */
  valuesKey?: Accessor<readonly (number | null)[] | null | undefined>;
  /** Value that maps to the darkest tone; 100 by default. */
  scaleMax?: number;
  /** Names of the columns, in order; missing ones fall back to `#k` (delta-006). */
  columnLabels?: readonly string[];
}

/** `TreemapChart` (REQ-085): tiles of `cols × rows` cells placed in a `columns × rows` grid. */
export interface TreemapChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  labelKey?: Accessor<string>;
  /** Ignored without `data`. */
  shareKey?: Accessor<number | null | undefined>;
  columns?: number;
  rows?: number;
}

/** `SankeyChart` (REQ-086): flow bands between layered nodes. */
export interface SankeyChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  sourceKey?: Accessor<string>;
  /** Ignored without `data`. */
  targetKey?: Accessor<string>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
}

/** `ActivityGrid` (REQ-087): one cell per day, a column per week. */
export interface ActivityGridProps extends CommonChartProps {
  /** Ignored without `data`. */
  dateKey?: Accessor<string>;
  /** Ignored without `data`. */
  countKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  levelKey?: Accessor<number | null | undefined>;
  /** Weeks shown, the most recent last; 26 by default. */
  weeks?: number;
}

/** `StepChart` (REQ-061): a series drawn as steps. */
export interface StepChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Where the step sits between two points; `after` by default. */
  step?: 'after' | 'before' | 'middle';
}

/** `SparklineRows` (REQ-062): one row per series — name, sparkline, readout (delta-008). */
export interface SparklineRowsProps extends CommonChartProps {
  /** Rows shown, from the first; all by default. */
  rows?: number;
  /** Ignored without `data`. */
  nameKey?: Accessor<string>;
  /** The printed readout; the last value of the series by default. Ignored without `data`. */
  readoutKey?: Accessor<string | number | null | undefined>;
  /** The row's points: an array. Ignored without `data`. */
  seriesKey?: Accessor<readonly unknown[] | null | undefined>;
  /** The value of one point; the point itself when it is a number, else its `value`. Ignored without `data`. */
  pointKey?: Accessor<number | null | undefined>;
}

/** `KpiCard` (REQ-063): a metric, its delta, and an area sparkline of the series. */
export interface KpiCardProps extends CommonChartProps {
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** The metric's name, printed under the figure. */
  metric?: string;
  /** Signed change, printed with its sign and a direction mark. */
  delta?: number;
  /** Direction of the mark; from the sign of `delta` by default. */
  deltaTone?: 'up' | 'down' | 'flat';
}

/** `BarChart` (REQ-064): pill bars, as columns or rows, with an optional second series. */
export interface BarChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  secondaryKey?: Accessor<number | null | undefined>;
  orientation?: 'columns' | 'rows';
}

/** `StackedBarChart` (REQ-065): one stacked segment per key. */
export interface StackedBarChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  keys?: readonly string[];
  /** Display names of the keys, in order; the keys themselves by default. Ignored without `data`. */
  names?: readonly string[];
}

/** `ComposedChart` (REQ-066): columns and a spline on one value scale. */
export interface ComposedChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  barKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  lineKey?: Accessor<number | null | undefined>;
  showLine?: boolean;
}

/** `WaterfallChart` (REQ-067): totals from zero and floating deltas from the running total. */
export interface WaterfallChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  stepKey?: Accessor<string>;
  /** An absolute total: the bar starts at zero and resets the running total. Ignored without `data`. */
  baseKey?: Accessor<number | null | undefined>;
  /** A change from the running total. Ignored without `data`. */
  deltaKey?: Accessor<number | null | undefined>;
}

/** `FunnelChart` (REQ-068): horizontal, centred stages. */
export interface FunnelChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  stageKey?: Accessor<string>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
}

/** `CandlestickChart` (REQ-071): OHLC bodies and wicks (Data Model §2.6). */
export interface CandlestickChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  timeKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  openKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  highKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  lowKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  closeKey?: Accessor<number | null | undefined>;
  /** Price bounds of the scale; derived from the data when omitted (REQ-097). */
  bounds?: readonly [number, number];
}

/** `AreaChart` (REQ-072): a curved, toned area under its line. */
export interface AreaChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  curve?: LineCurve;
}

/** `RangeBandChart` (REQ-073): the band between a low and a high series. */
export interface RangeBandChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  lowKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  highKey?: Accessor<number | null | undefined>;
}

/** `StreamChart` (REQ-074): two waves, overlaid or stacked. */
export interface StreamChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  keys?: readonly string[];
  stacked?: boolean;
}

/** `ScatterChart` (REQ-082): points on two linear scales, optionally sized. */
export interface ScatterChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  yKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  sizeKey?: Accessor<number | null | undefined>;
  /** Marker area in px², smallest to largest; `[60, 240]` by default. */
  sizeRange?: readonly [number, number];
}

/** `BubbleChart` (REQ-083): circles whose area encodes `sizeKey`. */
export interface BubbleChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  yKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  sizeKey?: Accessor<number | null | undefined>;
  /** Circle area in px², smallest to largest; `[100, 500]` by default. */
  sizeRange?: readonly [number, number];
}

/** `DonutChart` (REQ-075): sectors ∝ value around a central readout (Data Model §2.2). */
export interface DonutChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  nameKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Printed in the centre; the total by default. */
  centerValue?: string | number;
  /** A line under the centre value. */
  centerLabel?: string;
  /** Names every sector with its share beside the ring; `true` by default. */
  legend?: boolean;
}

/** `RadarChart` (REQ-076): one spoke per subject, a closed polygon of values (Data Model §2.2). */
export interface RadarChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  subjectKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** The value range along a spoke; `[0, the largest value]`, niced, by default. */
  domain?: readonly [number, number];
}

/** `PolarBarChart` (REQ-077): 360° bars out from a hole, length ∝ value (Data Model §2.2). */
export interface PolarBarChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  nameKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
}

/** `CoxcombChart` (REQ-088): equal angles, sector **area** ∝ value (Data Model §2.2). */
export interface CoxcombChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  nameKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Where the first sector starts, in degrees clockwise from 12 o'clock; 0 by default. */
  startAngle?: number;
}

/** `RadialArcGroup` (REQ-078): concentric 180° tracks, sweep ∝ value / the largest (Data Model §2.2). */
export interface RadialArcGroupProps extends CommonChartProps {
  /** Ignored without `data`. */
  nameKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
}

/** `RadialRings` (REQ-079): concentric progress rings, sweep ∝ value in 0-100 (Data Model §2.2). */
export interface RadialRingsProps extends CommonChartProps {
  /** Ignored without `data`. */
  nameKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
}

/** `GaugeArc` (REQ-080): a 240° arc swept to a percent (Data Model §2.3). */
export interface GaugeArcProps extends CommonChartProps {
  /** 0 to 100; saturated at the ends outside it. */
  percent?: number;
  /** Names the measure under the readout. */
  caption?: string;
  /** Printed in place of the percent. */
  readout?: string;
}

/** `MeterChart` (REQ-081): a semicircular meter with a needle at a percent (Data Model §2.3). */
export interface MeterChartProps extends CommonChartProps {
  /** 0 to 100; saturated at the ends outside it. */
  percent?: number;
  /** Names the measure under the readout. */
  caption?: string;
  /** Printed in place of the percent. */
  readout?: string;
}

/** `WindRose` (REQ-089): observations of (bearing, speed) binned by compass sector and speed. */
export interface WindRoseProps extends CommonChartProps {
  /** Where the wind blows from, in degrees clockwise from north. Ignored without `data`. */
  bearingKey?: Accessor<number | null | undefined>;
  /** The wind speed; 0 is a calm, which has no direction. Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Compass sectors: 4, 8, 16 or 32; 16 by default. */
  sectors?: number;
  /** Ascending speed thresholds that split each sector; `[5, 10, 15, 20]` by default. */
  bins?: readonly number[];
}

/** `ChordRing` (REQ-091): directed flows between categories around a circle (Data Model §2.7). */
export interface ChordRingProps extends CommonChartProps {
  /** Ignored without `data`. */
  sourceKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  targetKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Categories drawn; past it the smallest merge into "Other" (`SP010`). 12 by default. */
  maxCategories?: number;
}

/** `OrbitChart` (REQ-092): nested elliptical orbits with markers along them (Data Model §2.10, delta-009). */
export interface OrbitChartProps extends CommonChartProps {
  /** Orbits shown, from the inside out; all by default. */
  orbits?: number;
  /** A row's markers; `'markers'` by default. Ignored without `data`. */
  markerKey?: Accessor<readonly unknown[] | null | undefined>;
  /** A marker's period, 0-1 over the cycle; `'period'` by default. Ignored without `data`. */
  periodKey?: Accessor<number | null | undefined>;
}

/** `VolvelleChart` (REQ-090): concentric categorical rings read against one index (delta-010). */
export interface VolvelleChartProps extends CommonChartProps {
  /** Rings shown, from the inside out; all by default. */
  rings?: number;
  /**
   * The ring whose segment is brought under the index, 0-based; 0 by default. Without `data`, it
   * addresses the demo’s rings: `Day`, `Shift`, `Team`.
   */
  indexRing?: number;
  /**
   * The segment of `indexRing` under the index; its first segment by default. Without `data`, it
   * addresses the demo’s rings: `Day`, `Shift`, `Team`.
   */
  indexValue?: string;
}

