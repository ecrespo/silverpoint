import type { Palette } from '@silverpoint/core/palettes';

/** The ink mode of a slide or a fence chart, the library's `InkMode` vocabulary (research C11). */
export type DeckMode = 'ink' | 'precision';

/** Slide sizes the theme declares (API delta §3). */
export type DeckSize = '16:9' | '4:3';

/** Options of `createDeckEngine` (API delta §2). */
export interface DeckEngineOptions {
  /** The deck id (REQ-571): the adapter's hydration-safe id or the `id` prop; sanitised to `[a-z0-9-]`. */
  readonly id: string;
  readonly ground?: string;
  readonly substrate?: string;
  readonly mode?: DeckMode;
  /** Marpit theme name; default `'silverpoint'`. */
  readonly theme?: string;
  readonly size?: DeckSize;
  readonly locale?: string;
  readonly palette?: string | Palette;
}

/** One rendered slide (Data Model §2.33). */
export interface SlideRender {
  readonly index: number;
  /** The slide box: `<div class="sp-deck-slide"><svg …>…</svg></div>`. */
  readonly html: string;
  readonly notes: readonly string[];
  readonly fragments: number;
  readonly ground: string;
  readonly substrate: string;
  readonly mode: DeckMode;
  readonly classes: readonly string[];
  readonly heading?: string;
}

/** The body of a `silverpoint` fence (Data Model §2.32). */
export interface ChartFenceSpec {
  /** The chart's catalog slug, such as `bar-chart`. */
  readonly chart: string;
  /** What the chart reads; its demo dataset when absent. */
  readonly data?: unknown;
  /** The chart's own props and the common view props; not the fence's own fields. */
  readonly props?: Readonly<Record<string, unknown>>;
  /** Width in canvas pixels; the slide's content width when absent. */
  readonly width?: number;
  /** Height in canvas pixels. Default `360`. */
  readonly height?: number;
  /** The chart's id; `<deck>-s<slide>-c<ordinal>` when absent. */
  readonly id?: string;
  /** The chart's ground; the slide's when absent. */
  readonly ground?: string;
  /** The chart's substrate; the slide's when absent. */
  readonly substrate?: string;
  /** `ink` or `precision`; the slide's when absent. */
  readonly mode?: DeckMode;
  /** A preset's name or a palette object. */
  readonly palette?: string | Palette;
}

/** Why a fence did not render (Data Model §2.32). */
export type FenceError =
  | { readonly kind: 'json'; readonly message: string }
  | { readonly kind: 'shape'; readonly message: string }
  | { readonly kind: 'chart'; readonly chart: string; readonly suggestions: readonly string[] }
  | { readonly kind: 'prop'; readonly props: readonly string[] }
  | { readonly kind: 'size'; readonly width?: number; readonly height?: number }
  | { readonly kind: 'diagnostic'; readonly code: string; readonly message: string };

/** A fence's place in the deck (Data Model §2.33). Exactly one of `spec`, `error` (I-46). */
export interface ChartSlot {
  readonly slotId: string;
  readonly slide: number;
  readonly ordinal: number;
  readonly chartId: string;
  readonly spec?: ChartFenceSpec;
  readonly error?: FenceError;
}

/** A diagnostic raised while rendering a deck. */
export interface DeckDiagnostic {
  readonly code: string;
  readonly severity: 'warn' | 'error';
  readonly message: string;
  readonly slide?: number;
  readonly slot?: string;
}

/** The engine's output (Data Model §2.33). */
export interface DeckRender {
  readonly id: string;
  readonly total: number;
  readonly size: { readonly width: number; readonly height: number };
  readonly css: string;
  readonly slides: readonly SlideRender[];
  readonly slots: readonly ChartSlot[];
  readonly diagnostics: readonly DeckDiagnostic[];
}

export interface DeckEngine {
  /** Pure and deterministic (REQ-573, REQ-574). */
  render(markdown: string): DeckRender;
}
