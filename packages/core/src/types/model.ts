import type { Geometry } from './geometry';
import type { Ground } from './ground';
import type { CommonChartProps } from './props';

/** Tabular alternative of a chart's data, already formatted (REQ-121). */
export interface DataTable {
  readonly caption: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

/** What a recipe needs beyond the props: the resolved environment. */
export interface RecipeContext {
  /** Resolved instance id. */
  readonly id: string;
  /** Resolved container width in px; `undefined` while it has not been measured. */
  readonly width: number | undefined;
  readonly locale: string;
  readonly emptyState: Ground['emptyState'];
  readonly domainPadding: number;
}

/**
 * Everything an adapter renders: the geometry plus the accessible layer. Adapters translate
 * it into nodes and compute nothing (Art. 2).
 */
export interface ChartModel {
  readonly chart: string;
  readonly id: string;
  /** `deferred` while the container has no usable size (REQ-009). */
  readonly status: 'ready' | 'deferred';
  readonly geometry: Geometry;
  readonly chrome: 'card' | 'bare';
  /** Accessible name (REQ-120). */
  readonly name: string;
  /** Description summarising the series (REQ-120). */
  readonly description: string;
  readonly ids: Readonly<{ title: string; desc: string; table: string }>;
  readonly table: DataTable;
  readonly dataTable: 'visible' | 'hidden' | 'none';
}

/** A chart: its display name and the pure function from props to model. */
export interface ChartRecipe<P extends CommonChartProps> {
  readonly name: string;
  build(props: P, context: RecipeContext): ChartModel;
}

/** Imperative handle every adapter exposes, deliberately minimal (API Spec §8.1). */
export interface ChartHandle {
  getGeometry(): Geometry;
  toSVGString(): string;
}
