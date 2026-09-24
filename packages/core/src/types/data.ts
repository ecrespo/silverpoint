/** A row of data. Charts reach its fields through accessors. */
export type Datum = Readonly<Record<string, unknown>>;

/** Access to a field: key name or pure function. */
export type Accessor<T = number> = string | ((d: Datum, i: number) => T);

/** Inking mode. `precision` amounts to using NullInker (REQ-021). */
export type InkMode = 'ink' | 'precision';

/** Seed. A string is converted to an integer stably (REQ-003). */
export type Seed = number | string;

/** Prepared substrates of the silverpoint ground (REQ-046). */
export type SubstrateName = 'cream' | 'green' | 'blue' | 'ochre';

/** Active item resolved by the interaction engine (REQ-140). */
export interface ActiveItem {
  readonly seriesKey: string;
  readonly index: number;
  readonly datum: Datum;
  readonly value: number;
  /** Coordinates in SVG space, not screen space. */
  readonly point: Readonly<{ x: number; y: number }>;
}
