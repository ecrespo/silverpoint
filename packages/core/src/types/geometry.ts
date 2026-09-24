import type { Datum } from './data';

/** What a stroke is. Determines whether the Inker may touch it (REQ-022). */
export type StrokeRole = 'encoding' | 'ornament' | 'hatch';

/** Semantic paint slot; maps to a CSS variable (API Spec §10). */
export type StrokePart = 'ink' | 'ink-secondary' | 'heighten' | 'rule' | 'grid' | 'axis';

/**
 * How the stylesheet paints the shape: its outline, its interior with the part colour, its
 * interior with a hatch tile, or nothing — a toned shape whose edges other strokes draw, so the
 * Inker hatches it and no outline covers those edges.
 * @internal
 */
export type StrokePaint = 'stroke' | 'fill' | 'tile' | 'none';

/** Tonal level on the ground's ramp; 0 is no fill (Data Model §3.4). */
export type ToneLevel = 0 | 1 | 2 | 3 | 4;

/** Stroke instruction. It carries no color: color comes from CSS (REQ-042). */
export interface Stroke {
  /** SVG path data, already rounded to 2 decimals (REQ-002). */
  readonly d: string;
  readonly role: StrokeRole;
  readonly part: StrokePart;
  /** Relative weight, resolved against the ground's token. */
  readonly weight?: number;
  /** @internal Defaults to `'stroke'`. */
  readonly paint?: StrokePaint;
  /** @internal Dash pattern, resolved by the stylesheet. */
  readonly dash?: 'dotted';
  /** @internal Tonal level a closed shape asks the Inker to hatch. */
  readonly tone?: ToneLevel;
  /** @internal Id of the tile in `Geometry.defs` that fills this shape. */
  readonly tile?: string;
}

/** Kind of text a label carries; the stylesheet sets type by it. */
export type LabelKind = 'title' | 'badge' | 'value' | 'unit' | 'footer' | 'tick' | 'empty';

export interface TextLabel {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly kind: LabelKind;
  /** Paint slot: `text` for primary labels, `axis` for muted ones. */
  readonly part: 'text' | 'axis';
  readonly anchor: 'start' | 'middle' | 'end';
}

/** A datum's position, as the interaction engine sees it (REQ-140). */
export interface HitArea {
  readonly seriesKey: string;
  readonly index: number;
  readonly datum: Datum;
  readonly value: number;
  readonly x: number;
  readonly y: number;
  /** The item's area, when it has one — a bar, a cell, a tile. A pointer inside it wins. */
  readonly box?: Rect;
  /**
   * The item's place in a grid, when the chart is one. When every item has one, the arrow keys
   * move by column (left, right) and by row (up, down) across the whole grid (REQ-122).
   */
  readonly cell?: Readonly<{ column: number; row: number }>;
}

/**
 * A hatch tile shared by every shape of one tonal level (REQ-029).
 * @internal
 */
export interface Tile {
  /** Scoped to the chart instance (REQ-030). */
  readonly id: string;
  readonly width: number;
  readonly height: number;
  /** Rotation of the tile in degrees. */
  readonly angle: number;
  readonly strokes: readonly Stroke[];
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Everything a chart needs in order to draw itself. Serializable (REQ-011). */
export interface Geometry {
  readonly viewBox: Rect;
  readonly strokes: readonly Stroke[];
  readonly labels: readonly TextLabel[];
  readonly hitAreas: readonly HitArea[];
  /** @internal Hatch tiles referenced by strokes painted with `'tile'`. */
  readonly defs: readonly Tile[];
  /** @internal The drawing area; the interaction engine ignores anything outside it. */
  readonly plot: Rect;
}
