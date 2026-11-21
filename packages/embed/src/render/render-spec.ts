/**
 * `renderSpec` (DD-061, Art. 2): the recipe by slug, then the grounds' one pipeline, `renderChart`.
 * The props are assembled exactly as `render_chart` assembled them (REQ-660), so the bytes match.
 */
import { __setDiagnosticSink, PATH_BYTE_BUDGET, pathBytes, SilverpointError } from '@silverpoint/core';
import { PALETTES, type PaletteName } from '@silverpoint/core/palettes';
import { renderChart, type RenderedChart, type RenderEnvironment } from '@silverpoint/grounds';
import { recipeOfSlug } from '../registry';
import { errorDiagnostic } from '../spec/codes';
import { DEFAULT_WIDTH } from '../spec/limits';
import type { ChartSpec, EmbedDiagnostic, SpecResult } from '../spec/types';
import { validateSpec } from '../spec/validate';

/** The props a spec draws with: its own props, then the spec's fields (REQ-630). */
export function specProps(spec: ChartSpec, width: number | undefined, id: string): Readonly<Record<string, unknown>> {
  const palette = typeof spec.palette === 'string' ? PALETTES[spec.palette as PaletteName] : spec.palette;
  return {
    ...spec.props,
    ...(spec.data === undefined ? {} : { data: spec.data }),
    id,
    width: spec.width ?? width ?? DEFAULT_WIDTH,
    ...(spec.height === undefined ? {} : { height: spec.height }),
    ...(spec.ground === undefined ? {} : { ground: spec.ground }),
    ...(spec.substrate === undefined ? {} : { substrate: spec.substrate }),
    ...(spec.mode === undefined ? {} : { mode: spec.mode }),
    ...(palette === undefined ? {} : { palette }),
  };
}

/** Runs `run` with the core's warnings collected (the MCP's `capturing`, without its catalog). */
export function capturing<T>(run: () => T): { readonly value?: T; readonly diagnostics: EmbedDiagnostic[]; readonly error?: SilverpointError } {
  const diagnostics: EmbedDiagnostic[] = [];
  const restore = __setDiagnosticSink((code, message) => diagnostics.push({ code, severity: 'warn', message }));
  try {
    return { value: run(), diagnostics };
  } catch (error) {
    if (!(error instanceof SilverpointError)) throw error;
    diagnostics.push({ code: error.code, severity: 'error', message: error.message });
    return { diagnostics, error };
  } finally {
    restore();
  }
}

export function renderSpec(input: ChartSpec | string, environment: Partial<RenderEnvironment> = {}): SpecResult<RenderedChart> {
  const valid = validateSpec(input);
  if (!valid.ok) return valid;
  const spec = valid.value;
  const recipe = recipeOfSlug(spec.chart)!;
  const id = spec.id ?? environment.id ?? spec.chart;
  const props = specProps(spec, environment.width, id);
  const env: RenderEnvironment = {
    id,
    ...(environment.provider === undefined ? {} : { provider: environment.provider }),
    ...(environment.forcedPrecision ? { forcedPrecision: true } : {}),
    ...(environment.locale === undefined ? {} : { locale: environment.locale }),
  };
  const run = capturing(() => renderChart(recipe, props as never, env));
  if (run.error || !run.value) {
    return { ok: false, error: { kind: 'diagnostic', code: run.error?.code ?? 'render', message: run.error?.message ?? 'The chart could not be rendered.' }, diagnostics: run.diagnostics };
  }
  const bytes = pathBytes(run.value.geometry);
  if (bytes > PATH_BYTE_BUDGET) {
    const message = `${bytes} bytes of path data exceed the budget of ${PATH_BYTE_BUDGET}.`;
    return { ok: false, error: { kind: 'limit', message }, diagnostics: [...run.diagnostics, errorDiagnostic('SP030', recipe.name, 'data', message)] };
  }
  return { ok: true, value: run.value, diagnostics: run.diagnostics };
}
