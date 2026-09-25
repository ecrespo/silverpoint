import {
  diagnose,
  enforceHeightening,
  NullInker,
  PATH_BYTE_BUDGET,
  pathBytes,
  resolveConfig,
  resolveInker,
  resolveSeed,
  roundGeometry,
  svgString,
  toSvgView,
  type ChartModel,
  type ChartRecipe,
  type CommonChartProps,
  type InkMode,
  type ProviderConfig,
  type SvgView,
} from '@silverpoint/core';
import { RoughInker } from './ink/rough-inker';
import { resolveGround } from './registry';

/** What an adapter knows about where the chart is mounted; everything else comes from props. */
export interface RenderEnvironment {
  /** Instance id the adapter generated deterministically; an `id` prop wins over it. */
  readonly id: string;
  /** Measured container width in px; `undefined` before measurement. */
  readonly width?: number;
  readonly provider?: ProviderConfig;
  /** `prefers-contrast: more` or `forced-colors: active` holds (REQ-123). */
  readonly forcedPrecision?: boolean;
  readonly locale?: string;
}

/** A chart ready for an adapter to translate: the inked model plus its SVG view. */
export interface RenderedChart extends ChartModel {
  readonly ground: string;
  readonly substrate: string;
  readonly mode: InkMode;
  readonly view: SvgView;
}

/** Inkers that ship with the grounds package and resolve without registration. */
const BUILTIN_INKERS = [RoughInker];

/** Characters an id keeps intact in a space-separated IDREF list and inside `url(#…)`. */
const SAFE_ID = /^[A-Za-z0-9_.:-]+$/;

/**
 * The chart's id, safe to derive IDREFs and `url(#…)` references from: anything else is replaced
 * by `-` and warned, rather than breaking the labelling and the fills silently (REQ-008, REQ-120).
 */
function safeId(given: string, chart: string): string {
  if (SAFE_ID.test(given)) return given;
  const safe = given.replace(/[^A-Za-z0-9_.:-]+/g, '-') || 'sp';
  if (process.env.NODE_ENV !== 'production') {
    diagnose('SP002', chart, { property: 'id', message: `"${given}" cannot stem IDREFs and url(#…) references; "${safe}" is used.` });
  }
  return safe;
}

/**
 * The single render pipeline every adapter calls (TD §3.3): resolve the configuration, run the
 * recipe, ink, hold the heightening rules, round, and describe the SVG. Adapters translate the
 * result into nodes and nothing else (Art. 2).
 */
export function renderChart<P extends CommonChartProps>(
  recipe: ChartRecipe<P>,
  props: P,
  environment: RenderEnvironment,
): RenderedChart {
  const chart = recipe.name;
  const config = resolveConfig(props, environment.provider, environment);
  const ground = resolveGround(config.ground, chart);
  const id = safeId(props.id ?? environment.id, chart);

  const model = recipe.build(props, {
    id,
    width: props.width ?? environment.width,
    locale: config.locale,
    emptyState: ground.emptyState,
    domainPadding: ground.domainPadding,
  });

  let geometry = model.geometry;
  if (model.status === 'ready') {
    const inker = config.mode === 'precision' ? NullInker : resolveInker(ground.inker, chart, BUILTIN_INKERS);
    const inked = inker.ink(geometry, {
      seed: resolveSeed(props.seed, id),
      ...ground.inkOptions,
      nodeBudget: PATH_BYTE_BUDGET,
      hatchFill: config.hatchFill,
      tonalRamp: ground.tonalRamp,
      scope: id,
    });
    geometry = roundGeometry(enforceHeightening(inked, chart));
    const bytes = pathBytes(geometry);
    if (bytes > PATH_BYTE_BUDGET && process.env.NODE_ENV !== 'production') {
      diagnose('SP011', chart, { property: 'hatchFill', message: `${bytes} bytes of path data.` });
    }
  }

  const rendered = { ...model, id, geometry, ground: ground.name, substrate: config.substrate, mode: config.mode };
  return { ...rendered, view: toSvgView(rendered, rendered) };
}

/** The canonical SVG markup of a rendered chart (`ChartHandle.toSVGString`, API Spec §8.1). */
export function toSVGString(rendered: RenderedChart): string {
  return svgString(rendered.view);
}
