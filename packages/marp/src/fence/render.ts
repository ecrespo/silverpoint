/**
 * A fence's slot markup (DD-053, REQ-589..REQ-591): the chart root `@silverpoint/grounds` writes
 * —the tree the adapters hydrate— in `<figure class="sp-deck-chart">`, or a visible error figure.
 * No maths here (Art. 2): the chart is the core's recipe through the grounds' one pipeline.
 */
import { SilverpointError } from '@silverpoint/core';
import { PALETTES, type Palette } from '@silverpoint/core/palettes';
import { listGrounds, renderChart, toChartRootString } from '@silverpoint/grounds';
import type { ChartFenceSpec, DeckMode, FenceError } from '../types';
import { closest, didYouMean } from '../util/closest';
import { CHART_PROPS, COMMON_PROPS } from './charts.generated';
import { HEIGHT, WIDTH } from './parse';
import { recipeOfSlug } from './recipes';

/** What the slide gives a fence that does not say. */
export interface FenceContext {
  readonly chartId: string;
  readonly width: number;                 // the slide's content width
  readonly ground: string;
  readonly substrate: string;
  readonly mode: DeckMode;
  readonly palette?: string | Palette;    // the deck's
}

export const DEFAULT_HEIGHT = 360;

const escape = (value: string): string => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * The props a fence's chart is drawn with —`id` and `width` included— the same for the static render
 * and for each adapter's hydration (Art. 3, DD-053).
 */
export function fenceChartProps(spec: ChartFenceSpec, context: FenceContext): Readonly<Record<string, unknown>> & { readonly id: string; readonly width: number } {
  const ground = spec.ground ?? context.ground;
  // A fence on another ground takes that ground's first substrate unless it names one, as a
  // slide does (REQ-585); an unknown ground is left to the pipeline's own diagnostic.
  const other = listGrounds().find((g) => g.name === ground);
  const substrate = spec.substrate ?? (ground === context.ground ? context.substrate : other && Object.keys(other.substrates)[0]);
  const named = spec.palette ?? context.palette;
  // A preset name is the core's preset (REQ-461); the pipeline takes the palette's fields.
  const palette = typeof named === 'string' ? (Object.hasOwn(PALETTES, named) ? PALETTES[named] : undefined) : named;
  return {
    ...spec.props,
    ...(spec.data === undefined ? {} : { data: spec.data }),
    ground,
    ...(substrate === undefined ? {} : { substrate }),
    mode: spec.mode ?? context.mode,
    ...(palette === undefined ? {} : { palette }),
    height: spec.height ?? DEFAULT_HEIGHT,
    id: context.chartId,
    width: spec.width ?? context.width,
  };
}

/** The chart root for a parsed spec, or the error the chart raised (kind `diagnostic`). */
export function renderFenceChart(spec: ChartFenceSpec, context: FenceContext): { readonly html: string } | { readonly error: FenceError } {
  const recipe = recipeOfSlug(spec.chart);
  if (!recipe) return { error: { kind: 'chart', chart: spec.chart, suggestions: [] } };
  const { id, width, ...props } = fenceChartProps(spec, context);
  try {
    const rendered = renderChart(recipe, props as never, { id, width });
    return { html: toChartRootString(rendered) };
  } catch (e) {
    const code = e instanceof SilverpointError ? e.code : 'render';
    return { error: { kind: 'diagnostic', code, message: e instanceof Error ? e.message : String(e) } };
  }
}

/** The figure's sentence, naming the problem and the closest valid names (REQ-591). */
export function fenceErrorMessage(error: FenceError, chart: string | undefined): string {
  switch (error.kind) {
    case 'json':
    case 'shape':
    case 'diagnostic':
      return error.message;
    case 'chart':
      return `unknown chart "${error.chart}".${didYouMean(error.chart, Object.keys(CHART_PROPS))}`;
    case 'prop': {
      const declared = [...(CHART_PROPS[chart ?? ''] ?? []), ...COMMON_PROPS];
      const near = error.props.map((p) => closest(p, declared)[0]).filter((n): n is string => n !== undefined);
      const hint = near.length === 0 ? '' : ` Did you mean ${near.map((n) => `"${n}"`).join(' or ')}?`;
      return `${chart} does not declare ${error.props.map((p) => `"${p}"`).join(', ')}.${hint}`;
    }
    case 'size': {
      const parts = [
        ...(error.width === undefined ? [] : [`width ${error.width} is outside ${WIDTH.min}..${WIDTH.max}`]),
        ...(error.height === undefined ? [] : [`height ${error.height} is outside ${HEIGHT.min}..${HEIGHT.max}`]),
      ];
      return `${parts.join('; ')}.`;
    }
  }
}

export function slotMarkup(slotId: string, spec: ChartFenceSpec, chartHtml: string): string {
  return `<figure class="sp-deck-chart" data-sp-slot="${slotId}" part="sp-deck-chart" data-sp-spec="${escape(JSON.stringify(spec))}">${chartHtml}</figure>`;
}

export function errorMarkup(slotId: string, caption: string): string {
  return `<figure class="sp-deck-chart sp-deck-chart--error" data-sp-slot="${slotId}" role="note" part="sp-deck-chart-error"><figcaption>${escape(caption)}</figcaption></figure>`;
}
