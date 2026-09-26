import type { Geometry, ToneLevel } from './geometry';

/** One step of a `hatch` ground's tonal ramp (Data Model §3.4). */
export interface HatchToneSpec {
  readonly style: 'hachure' | 'cross-hatch';
  readonly gap: number;
  /** Hatch angle in degrees; cross-hatch adds the perpendicular. */
  readonly angle: number;
}

/** One step of a `weight` ground's tonal ramp (Data Model §3.7, REQ-028). */
export interface WeightToneSpec {
  readonly style: 'weight';
  /** Stroke width of a toned shape's outline, times `--sp-stroke-width`. */
  readonly weight: number;
}

/** One step of a ground's tonal ramp: a hatch under `hatch`, a line weight under `weight`. */
export type ToneSpec = HatchToneSpec | WeightToneSpec;

export type TonalRamp = Readonly<Record<Exclude<ToneLevel, 0>, ToneSpec>>;

export interface InkOptions {
  readonly seed: number;
  readonly roughness: number;
  readonly bowing: number;
  readonly hatchAngle: number;
  readonly hatchGap: number;
  readonly fillWeight: number;
  /** Upper bound of nodes the Inker must not exceed. */
  readonly nodeBudget: number;
  /** @internal `tile` shares one hatch tile per tonal level (REQ-029). */
  readonly hatchFill?: 'tile' | 'per-shape';
  /** @internal The ground's tonal ramp. */
  readonly tonalRamp?: TonalRamp;
  /** @internal Prefix that scopes generated ids to the chart instance (REQ-030). */
  readonly scope?: string;
}

export interface Inker {
  readonly name: string;
  /** Receives exact geometry and returns the inked geometry. */
  ink(geometry: Geometry, options: InkOptions): Geometry;
}
