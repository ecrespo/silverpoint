/** The host catalog's shapes (Data Model §2.40..§2.43, API delta §15). */
import type { ChartSpec } from '../spec/types';

export type DataShape = string;

export interface HostRole {
  /** The agent catalog's `role`, or the reshape's role. */
  readonly id: string;
  /** The accessor prop a column name is written to; `null` for reshape-only roles. */
  readonly prop: string | null;
  readonly label: string;
  readonly kind: 'dimension' | 'measure' | 'temporal' | 'any';
  readonly dataType: 'string' | 'number' | 'date' | 'boolean';
  readonly required: boolean;
  /** Takes several columns. */
  readonly multiple: boolean;
}

export interface HostOption {
  readonly name: string;
  readonly label: string;
  readonly doc: string;
  readonly kind: 'boolean' | 'number' | 'string' | 'enum';
  readonly values?: readonly string[];
  readonly default?: boolean | number | string;
}

export interface HostChart {
  readonly slug: string;
  readonly title: string;
  readonly family: string;
  readonly summary: string;
  readonly shape: DataShape;
  readonly binding: 'rows' | 'pivot' | 'scalar' | 'none';
  readonly reshape?: 'matrix' | 'dimensions' | 'first-row';
  readonly reason?: string;
  readonly roles: readonly HostRole[];
  readonly options: readonly HostOption[];
  /**
   * The demo as a host would hand it over. `options` holds the demo's non-role props (amended in
   * implementation: `names` of the dumbbell, `axis` of the interval chart…), so the demo binds to
   * the canonical demo render (I-59).
   */
  readonly demo?: { readonly roles: Readonly<Record<string, string | readonly string[]>>; readonly rows: readonly Readonly<Record<string, unknown>>[]; readonly options?: Readonly<Record<string, unknown>> };
}

export interface HostCatalog {
  readonly schema: 1;
  readonly version: string;
  readonly appearance: {
    readonly grounds: readonly { readonly name: string; readonly label: string; readonly substrates: readonly { readonly name: string; readonly label: string }[] }[];
    readonly modes: readonly { readonly name: 'ink' | 'precision'; readonly label: string }[];
    readonly palettes: readonly { readonly name: string; readonly label: string }[];
  };
  readonly common: readonly HostOption[];
  readonly charts: readonly HostChart[];
}

export interface HostEntry {
  readonly id: string;
  readonly name: string;
  readonly kind: 'bi' | 'workflow' | 'notebook' | 'web' | 'cms' | 'language';
  readonly via: 'embed' | 'react' | 'python';
  readonly repository: string | null;
  readonly package: string | null;
  readonly registry: 'npm' | 'pypi' | 'github-release' | 'github-pages' | 'knime-hub' | 'none';
  readonly status: 'planned' | 'preview' | 'released';
  readonly summary: string;
}

/** A table in row form or in column form (row-major), API delta §15.2. */
export type Table =
  | { readonly rows: readonly Readonly<Record<string, unknown>>[] }
  | { readonly columns: readonly string[]; readonly values: readonly (readonly unknown[])[] };

export interface TableBinding {
  readonly chart: string;
  readonly table: Table;
  /** Role id → column name; a role with `multiple` takes an array of names. */
  readonly roles: Readonly<Record<string, string | readonly string[]>>;
  /** Own options and common view options. */
  readonly options?: Readonly<Record<string, unknown>>;
  readonly appearance?: Pick<ChartSpec, 'ground' | 'substrate' | 'mode' | 'palette'>;
  readonly size?: Pick<ChartSpec, 'width' | 'height'>;
  readonly id?: string;
}

/** One row of the generated binding table. */
export interface Binding {
  readonly binding: HostChart['binding'];
  readonly reshape?: HostChart['reshape'];
  readonly reason?: string;
  readonly roles: readonly Pick<HostRole, 'id' | 'prop' | 'required' | 'multiple'>[];
}
