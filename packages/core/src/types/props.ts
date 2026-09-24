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
