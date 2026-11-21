/**
 * The shared types of host embedding (API delta §2, Data Model §2.38..§2.39): a chart as data, the
 * errors that refuse one, and the result every entry returns.
 */
import type { Palette, PaletteName } from '@silverpoint/core/palettes';

/** A chart as data. The deck fence's spec (Data Model §2.32), with no slide to inherit from. */
export interface ChartSpec {
  /** Catalog slug: `"bar-chart"`. */
  readonly chart: string;
  /** The chart's demo dataset when absent. */
  readonly data?: unknown;
  /** Own and common view props; never the fields below. */
  readonly props?: Readonly<Record<string, unknown>>;
  /** 160..1600; measured by the client when absent, 480 by the DOM-free render. */
  readonly width?: number;
  /** 90..1200; the recipe's default when absent. */
  readonly height?: number;
  /** `/^[A-Za-z0-9_.:-]+$/`; the slug (DOM-free) or `sp-embed-<n>` (client) when absent. */
  readonly id?: string;
  readonly ground?: string;
  readonly substrate?: string;
  readonly mode?: 'ink' | 'precision';
  readonly palette?: PaletteName | Palette;
}

export type SpecError =
  | { readonly kind: 'json'; readonly message: string }
  | { readonly kind: 'shape'; readonly message: string }
  | { readonly kind: 'chart'; readonly chart: string; readonly suggestions: readonly string[] }
  | { readonly kind: 'prop'; readonly props: readonly string[] }
  | { readonly kind: 'size'; readonly width?: number; readonly height?: number }
  | { readonly kind: 'limit'; readonly message: string }
  | { readonly kind: 'role'; readonly missing: readonly string[]; readonly unknownColumns: readonly string[] }
  | { readonly kind: 'diagnostic'; readonly code: string; readonly message: string };

export interface EmbedDiagnostic {
  readonly code: string;
  readonly severity: 'warn' | 'error';
  readonly message: string;
}

export type SpecResult<T> =
  | { readonly ok: true; readonly value: T; readonly diagnostics: readonly EmbedDiagnostic[] }
  | { readonly ok: false; readonly error: SpecError; readonly diagnostics: readonly EmbedDiagnostic[] };
