import type { Accessor, Datum, InkMode, Seed, SubstrateName } from './data';
import type { GroundRef } from './ground';

/** Props present in every chart, identical in React and Angular (REQ-094). */
export interface CommonChartProps {
  /**
   * Rows to draw. If omitted, the demo dataset is rendered (REQ-093): accessor props (`…Key`,
   * `keys`, `names`, `levels`, `axis`, `dimensions`, `period`) are ignored, every other prop
   * applies.
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


// ---------------------------------------------------------------------------------------------
// The second catalog (feature-003, API Spec §7.3): REQ-400..REQ-426. Every accessor is ignored
// without `data` (REQ-098, REQ-099); every other own prop applies to the demo too.
// ---------------------------------------------------------------------------------------------

/** Bars as columns or rows, as `BarChart` has them. */
export type ChartOrientation = 'columns' | 'rows';

/** `HistogramChart` (REQ-400): raw observations binned in the core (Data Model §2.15). */
export interface HistogramChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /**
   * A number asks for that many equal-width bins over the niced extent; an array gives the
   * thresholds, increasing. Freedman–Diaconis by default, Sturges when the IQR is 0 (REQ-432).
   */
  bins?: number | readonly number[];
  /** Turns the counts into a running total. */
  cumulative?: boolean;
  orientation?: ChartOrientation;
}

/** `EcdfChart` (REQ-401): the empirical cumulative distribution as a step function. */
export interface EcdfChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Two groups at most are drawn. Ignored without `data`. */
  groupKey?: Accessor<string | null | undefined>;
  /** Quantiles, in 0-1, drawn as rules. */
  markers?: readonly number[];
}

/** `BoxPlotChart` (REQ-402): quartiles, median, Tukey whiskers and outliers per group. */
export interface BoxPlotChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  groupKey?: Accessor<string | null | undefined>;
  /** Whisker reach as a multiple of the IQR; 1.5 by default (REQ-432). */
  whisker?: number;
  /** Draws the observations past the whiskers; `true` by default. */
  outliers?: boolean;
  orientation?: ChartOrientation;
}

/** `ViolinChart` (REQ-403): a mirrored kernel density per group, quartiles marked inside. */
export interface ViolinChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  groupKey?: Accessor<string | null | undefined>;
  /** Kernel bandwidth in data units, shared by every group; Silverman's rule by default. */
  bandwidth?: number;
  /** Marks the quartiles inside each violin; `true` by default. */
  quartiles?: boolean;
  orientation?: ChartOrientation;
}

/** `RidgelineChart` (REQ-404): a kernel density per group on overlapping baselines. */
export interface RidgelineChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** The group of an observation; one ridge per group. Ignored without `data`. */
  groupKey: Accessor<string | null | undefined>;
  /** Kernel bandwidth in data units, shared by every group; Silverman's rule by default. */
  bandwidth?: number;
  /** How far a ridge reaches into the one behind it, 0-1; 0.5 by default. */
  overlap?: number;
}

/** `BeeswarmChart` (REQ-405): one point per observation, packed without overlap. */
export interface BeeswarmChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  groupKey?: Accessor<string | null | undefined>;
  /** Names the point in the readout and the table. Ignored without `data`. */
  labelKey?: Accessor<string | null | undefined>;
  /** Point radius in px; 3 by default. */
  radius?: number;
}

/** `LollipopChart` (REQ-406): a stem from the baseline and a head at the value (Data Model §2.1). */
export interface LollipopChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  orientation?: ChartOrientation;
  /** Order of the categories; `none` keeps the data order. */
  sort?: 'none' | 'ascending' | 'descending';
}

/** `DumbbellChart` (REQ-407): two values per category joined by a segment (Data Model §2.16). */
export interface DumbbellChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  labelKey?: Accessor<string>;
  /** Ignored without `data`. */
  startKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  endKey?: Accessor<number | null | undefined>;
  /** Titles of the two values; `['start', 'end']` by default. Ignored without `data`. */
  names?: readonly [string, string];
  /** `arrow` encodes the direction from the first value to the second. */
  endMarker?: 'dot' | 'arrow';
  /** `rows` by default: long category names read across. */
  orientation?: ChartOrientation;
}

/** `SlopeChart` (REQ-408): two period axes, one segment per category (Data Model §2.16). */
export interface SlopeChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  labelKey?: Accessor<string>;
  /** Ignored without `data`. */
  startKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  endKey?: Accessor<number | null | undefined>;
  /** Titles of the two periods; `['start', 'end']` by default. Ignored without `data`. */
  names?: readonly [string, string];
}

/** `BumpChart` (REQ-409): the rank of each series at each x, computed in the core (Data Model §2.17). */
export interface BumpChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  seriesKey?: Accessor<string>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** `descending` gives rank 1 to the highest value (the default). */
  order?: 'descending' | 'ascending';
  /** Series drawn, the best-ranked first; all by default. */
  series?: number;
}

/** `ErrorBarChart` (REQ-410): a point estimate with its interval (Data Model §2.18). */
export interface ErrorBarChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  labelKey?: Accessor<string>;
  /** Ignored without `data`. */
  estimateKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  lowKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  highKey?: Accessor<number | null | undefined>;
  /** A reference value drawn as a dotted rule. */
  reference?: number;
  /** `rows` by default, as a forest plot reads. */
  orientation?: ChartOrientation;
}

/** `IntervalChart` (REQ-411): floating bars from start to end on lanes (Data Model §2.19). */
export interface IntervalChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  laneKey?: Accessor<string>;
  /** Ignored without `data`. */
  startKey?: Accessor<number | string | null | undefined>;
  /** Ignored without `data`. */
  endKey?: Accessor<number | string | null | undefined>;
  /** Ignored without `data`. */
  labelKey?: Accessor<string | null | undefined>;
  /** `date` reads ISO `YYYY-MM-DD` days in UTC; `number` by default. Ignored without `data`. */
  axis?: 'number' | 'date';
}

/** `DivergingBarChart` (REQ-412): ordered levels stacked on both sides of a neutral centre (Data Model §2.20). */
export interface DivergingBarChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  labelKey?: Accessor<string>;
  /** The level columns, most negative first. Ignored without `data`. */
  levels: readonly string[];
  /** Index of the neutral level, split across the centre; `null` for none. The middle one by default. */
  neutral?: number | null;
  /** Normalises each row to 100 %; `true` by default. */
  percent?: boolean;
}

/** `ConnectedScatterChart` (REQ-413): an ordered path through x-y points (Data Model §2.21). */
export interface ConnectedScatterChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  yKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  labelKey?: Accessor<string | null | undefined>;
  /** Draws direction marks along the path; `true` by default. */
  arrows?: boolean;
}

/** `WaffleChart` (REQ-414): a unit grid filled in reading order by category (Data Model §2.2). */
export interface WaffleChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  nameKey?: Accessor<string | number>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Cells in the grid; 100 by default. */
  cells?: number;
  /** Cells per row; 10 by default. */
  columns?: number;
}

/** `MarimekkoChart` (REQ-415): column width ∝ total, segment height ∝ share (Data Model §2.22). */
export interface MarimekkoChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  columnKey?: Accessor<string>;
  /** Ignored without `data`. */
  segmentKey?: Accessor<string>;
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
}

/** Props shared by the hierarchy charts (Data Model §2.23). */
interface HierarchyChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  idKey?: Accessor<string>;
  /** `null` for the root. Ignored without `data`. */
  parentKey?: Accessor<string | null | undefined>;
  /** Ignored without `data`. */
  labelKey?: Accessor<string | null | undefined>;
}

/** `SquarifiedTreemap` (REQ-416): a hierarchy laid out by the squarified algorithm. */
export interface SquarifiedTreemapProps extends HierarchyChartProps {
  /** Read on leaves; an internal node is the sum of its children. Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Levels drawn below the root; all by default. */
  depth?: number;
  /** The node drawn as root, controlled (REQ-439); the data root by default. */
  rootId?: string | null;
}

/** `SunburstChart` (REQ-417): a hierarchy as concentric rings of arcs. */
export interface SunburstChartProps extends HierarchyChartProps {
  /** Read on leaves; an internal node is the sum of its children. Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** Rings drawn below the root; all by default. */
  depth?: number;
  /** The node drawn as root, controlled (REQ-439); the data root by default. */
  rootId?: string | null;
}

/** `TreeChart` (REQ-418): a tidy node-link tree. */
export interface TreeChartProps extends HierarchyChartProps {
  /** Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  orientation?: 'horizontal' | 'vertical';
}

/** `ParallelCoordinatesChart` (REQ-419): one axis per dimension, one polyline per row (Data Model §2.20). */
export interface ParallelCoordinatesChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  labelKey?: Accessor<string | null | undefined>;
  /** The dimension columns, in axis order. Ignored without `data`. */
  dimensions: readonly string[];
  /** Axis domains by dimension; derived from the data when omitted (REQ-097). */
  domains?: Readonly<Record<string, readonly [number, number]>>;
}

/** `PolarLineChart` (REQ-420): a line over angle × radius (Data Model §2.21). */
export interface PolarLineChartProps extends CommonChartProps {
  /** In the units of `period`. Ignored without `data`. */
  angleKey?: Accessor<number | null | undefined>;
  /** The radius, `≥ 0`. Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** One turn, in the units of the angle; when set, the line closes. Ignored without `data`. */
  period?: number;
  /** Where the angle 0 sits, in degrees clockwise from 12 o'clock; 0 by default. */
  startAngle?: number;
}

/** `PolarScatterChart` (REQ-421): points over angle × radius (Data Model §2.21). */
export interface PolarScatterChartProps extends CommonChartProps {
  /** In the units of `period`. Ignored without `data`. */
  angleKey?: Accessor<number | null | undefined>;
  /** The radius, `≥ 0`. Ignored without `data`. */
  radiusKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  sizeKey?: Accessor<number | null | undefined>;
  /** One turn, in the units of the angle; 360 by default. Ignored without `data`. */
  period?: number;
}

/** `DensityBinChart` (REQ-422): x-y points binned in two dimensions (Data Model §2.24). */
export interface DensityBinChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  yKey?: Accessor<number | null | undefined>;
  binShape?: 'hexagon' | 'rect';
  /** Bin size in px; 14 by default. */
  binSize?: number;
}

/** `ContourChart` (REQ-423): iso-lines and filled bands of a density or a grid (Data Model §2.24). */
export interface ContourChartProps extends CommonChartProps {
  /** `points` estimates a density from a point cloud; `grid` reads a regular grid of values. */
  source?: 'points' | 'grid';
  /** Ignored without `data`. */
  xKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  yKey?: Accessor<number | null | undefined>;
  /** The grid value (`source: 'grid'`). Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** A count of levels, or the thresholds, increasing. */
  levels?: number | readonly number[];
  /** Fills the bands between levels; `true` by default. */
  filled?: boolean;
}

/** `DelaunayChart` (REQ-424): the triangulation of x-y points, or its Voronoi cells (Data Model §2.24). */
export interface DelaunayChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  yKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  labelKey?: Accessor<string | null | undefined>;
  mesh?: 'delaunay' | 'voronoi';
}

/** `VectorFieldChart` (REQ-425): an arrow per grid point (Data Model §2.24). */
export interface VectorFieldChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  xKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  yKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  uKey?: Accessor<number | null | undefined>;
  /** Ignored without `data`. */
  vKey?: Accessor<number | null | undefined>;
  /** Arrow length per unit of magnitude; fitted to the grid by default. */
  scale?: number;
}

/** A node of a `NetworkChart`; with finite `x` and `y` on every node, no layout runs (REQ-436). */
export interface NetworkNode {
  readonly id: string;
  readonly label?: string;
  readonly group?: string;
  readonly x?: number;
  readonly y?: number;
}

/** `NetworkChart` (REQ-426): a node-link graph laid out deterministically (Data Model §2.7, §2.24). */
export interface NetworkChartProps extends CommonChartProps {
  /** Ignored without `data`. */
  sourceKey?: Accessor<string>;
  /** Ignored without `data`. */
  targetKey?: Accessor<string>;
  /** 1 by default. Ignored without `data`. */
  valueKey?: Accessor<number | null | undefined>;
  /** The nodes; the distinct ends of the links by default. Data: ignored without `data`. */
  nodes?: readonly NetworkNode[];
  /** Layout iterations; 300 by default. */
  iterations?: number;
}
