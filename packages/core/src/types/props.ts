import type { Accessor, Datum, InkMode, Seed, SubstrateName } from './data';
import type { GroundRef } from './ground';

/** Props present in every chart, identical in React and Angular (REQ-094). */
export interface CommonChartProps {
  /** Rows to draw. If omitted, the demo dataset is rendered (REQ-093). */
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
  xKey?: Accessor<string | number>;
  valueKey?: Accessor<number | null | undefined>;
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
  titleKey?: Accessor<string>;
  actualKey?: Accessor<number | null | undefined>;
  targetKey?: Accessor<number | null | undefined>;
}

/** `PyramidChart` (REQ-070): stacked tiers whose width encodes the value (0-100). */
export interface PyramidChartProps extends CommonChartProps {
  labelKey?: Accessor<string>;
  widthKey?: Accessor<number | null | undefined>;
  toneKey?: Accessor<number | null | undefined>;
}

/** `HeatmapChart` (REQ-084): labelled rows of values, normalised against `scaleMax`. */
export interface HeatmapChartProps extends CommonChartProps {
  labelKey?: Accessor<string>;
  valuesKey?: Accessor<readonly (number | null)[] | null | undefined>;
  /** Value that maps to the darkest tone; 100 by default. */
  scaleMax?: number;
  /** Names of the columns, in order; missing ones fall back to `#k` (delta-006). */
  columnLabels?: readonly string[];
}

/** `TreemapChart` (REQ-085): tiles of `cols × rows` cells placed in a `columns × rows` grid. */
export interface TreemapChartProps extends CommonChartProps {
  labelKey?: Accessor<string>;
  shareKey?: Accessor<number | null | undefined>;
  columns?: number;
  rows?: number;
}

/** `SankeyChart` (REQ-086): flow bands between layered nodes. */
export interface SankeyChartProps extends CommonChartProps {
  sourceKey?: Accessor<string>;
  targetKey?: Accessor<string>;
  valueKey?: Accessor<number | null | undefined>;
}

/** `ActivityGrid` (REQ-087): one cell per day, a column per week. */
export interface ActivityGridProps extends CommonChartProps {
  dateKey?: Accessor<string>;
  countKey?: Accessor<number | null | undefined>;
  levelKey?: Accessor<number | null | undefined>;
  /** Weeks shown, the most recent last; 26 by default. */
  weeks?: number;
}

/** `StepChart` (REQ-061): a series drawn as steps. */
export interface StepChartProps extends CommonChartProps {
  xKey?: Accessor<string | number>;
  valueKey?: Accessor<number | null | undefined>;
  /** Where the step sits between two points; `after` by default. */
  step?: 'after' | 'before' | 'middle';
}

/** `SparklineRows` (REQ-062): one row per series — name, sparkline, readout (delta-008). */
export interface SparklineRowsProps extends CommonChartProps {
  /** Rows shown, from the first; all by default. */
  rows?: number;
  nameKey?: Accessor<string>;
  /** The printed readout; the last value of the series by default. */
  readoutKey?: Accessor<string | number | null | undefined>;
  /** The row's points: an array. */
  seriesKey?: Accessor<readonly unknown[] | null | undefined>;
  /** The value of one point; the point itself when it is a number, else its `value`. */
  pointKey?: Accessor<number | null | undefined>;
}

/** `KpiCard` (REQ-063): a metric, its delta, and an area sparkline of the series. */
export interface KpiCardProps extends CommonChartProps {
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
  xKey?: Accessor<string | number>;
  valueKey?: Accessor<number | null | undefined>;
  secondaryKey?: Accessor<number | null | undefined>;
  orientation?: 'columns' | 'rows';
}

/** `StackedBarChart` (REQ-065): one stacked segment per key. */
export interface StackedBarChartProps extends CommonChartProps {
  xKey?: Accessor<string | number>;
  keys?: readonly string[];
  /** Display names of the keys, in order; the keys themselves by default. */
  names?: readonly string[];
}

/** `ComposedChart` (REQ-066): columns and a spline on one value scale. */
export interface ComposedChartProps extends CommonChartProps {
  xKey?: Accessor<string | number>;
  barKey?: Accessor<number | null | undefined>;
  lineKey?: Accessor<number | null | undefined>;
  showLine?: boolean;
}

/** `WaterfallChart` (REQ-067): totals from zero and floating deltas from the running total. */
export interface WaterfallChartProps extends CommonChartProps {
  stepKey?: Accessor<string>;
  /** An absolute total: the bar starts at zero and resets the running total. */
  baseKey?: Accessor<number | null | undefined>;
  /** A change from the running total. */
  deltaKey?: Accessor<number | null | undefined>;
}

/** `FunnelChart` (REQ-068): horizontal, centred stages. */
export interface FunnelChartProps extends CommonChartProps {
  stageKey?: Accessor<string>;
  valueKey?: Accessor<number | null | undefined>;
}

/** `CandlestickChart` (REQ-071): OHLC bodies and wicks (Data Model §2.6). */
export interface CandlestickChartProps extends CommonChartProps {
  timeKey?: Accessor<string | number>;
  openKey?: Accessor<number | null | undefined>;
  highKey?: Accessor<number | null | undefined>;
  lowKey?: Accessor<number | null | undefined>;
  closeKey?: Accessor<number | null | undefined>;
  /** Price bounds of the scale; derived from the data when omitted (REQ-097). */
  bounds?: readonly [number, number];
}

/** `AreaChart` (REQ-072): a curved, toned area under its line. */
export interface AreaChartProps extends CommonChartProps {
  xKey?: Accessor<string | number>;
  valueKey?: Accessor<number | null | undefined>;
  curve?: LineCurve;
}

/** `RangeBandChart` (REQ-073): the band between a low and a high series. */
export interface RangeBandChartProps extends CommonChartProps {
  xKey?: Accessor<string | number>;
  lowKey?: Accessor<number | null | undefined>;
  highKey?: Accessor<number | null | undefined>;
}

/** `StreamChart` (REQ-074): two waves, overlaid or stacked. */
export interface StreamChartProps extends CommonChartProps {
  xKey?: Accessor<string | number>;
  keys?: readonly string[];
  stacked?: boolean;
}

/** `ScatterChart` (REQ-082): points on two linear scales, optionally sized. */
export interface ScatterChartProps extends CommonChartProps {
  xKey?: Accessor<number | null | undefined>;
  yKey?: Accessor<number | null | undefined>;
  sizeKey?: Accessor<number | null | undefined>;
  /** Marker area in px², smallest to largest; `[60, 240]` by default. */
  sizeRange?: readonly [number, number];
}

/** `BubbleChart` (REQ-083): circles whose area encodes `sizeKey`. */
export interface BubbleChartProps extends CommonChartProps {
  xKey?: Accessor<number | null | undefined>;
  yKey?: Accessor<number | null | undefined>;
  sizeKey?: Accessor<number | null | undefined>;
  /** Circle area in px², smallest to largest; `[100, 500]` by default. */
  sizeRange?: readonly [number, number];
}

/** `DonutChart` (REQ-075): sectors ∝ value around a central readout (Data Model §2.2). */
export interface DonutChartProps extends CommonChartProps {
  nameKey?: Accessor<string | number>;
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
  subjectKey?: Accessor<string | number>;
  valueKey?: Accessor<number | null | undefined>;
  /** The value range along a spoke; `[0, the largest value]`, niced, by default. */
  domain?: readonly [number, number];
}

/** `PolarBarChart` (REQ-077): 360° bars out from a hole, length ∝ value (Data Model §2.2). */
export interface PolarBarChartProps extends CommonChartProps {
  nameKey?: Accessor<string | number>;
  valueKey?: Accessor<number | null | undefined>;
}

/** `CoxcombChart` (REQ-088): equal angles, sector **area** ∝ value (Data Model §2.2). */
export interface CoxcombChartProps extends CommonChartProps {
  nameKey?: Accessor<string | number>;
  valueKey?: Accessor<number | null | undefined>;
  /** Where the first sector starts, in degrees clockwise from 12 o'clock; 0 by default. */
  startAngle?: number;
}

/** `RadialArcGroup` (REQ-078): concentric 180° tracks, sweep ∝ value / the largest (Data Model §2.2). */
export interface RadialArcGroupProps extends CommonChartProps {
  nameKey?: Accessor<string | number>;
  valueKey?: Accessor<number | null | undefined>;
}

/** `RadialRings` (REQ-079): concentric progress rings, sweep ∝ value in 0-100 (Data Model §2.2). */
export interface RadialRingsProps extends CommonChartProps {
  nameKey?: Accessor<string | number>;
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

