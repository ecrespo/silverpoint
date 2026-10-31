/**
 * The core's 60 chart recipes by catalog slug, the kebab case of the recipe name (`BarChart` →
 * `bar-chart`), the same objects the adapters and `render_chart` call (DD-053, REQ-589).
 */
import * as core from '@silverpoint/core';
import type { ChartRecipe, CommonChartProps } from '@silverpoint/core';
import * as catalog from '@silverpoint/core/catalog';

export type Recipe = ChartRecipe<CommonChartProps>;

const isRecipe = (value: unknown): value is Recipe =>
  typeof value === 'object' && value !== null && typeof (value as Recipe).build === 'function' && typeof (value as Recipe).name === 'string';

/** `BarChart` → `bar-chart`; `KPIGauge` → `kpi-gauge`. */
export const kebab = (name: string): string =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

const RECIPES: ReadonlyMap<string, Recipe> = new Map(
  [...Object.values(core), ...Object.values(catalog)].filter(isRecipe).map((r) => [kebab(r.name), r]),
);

export const CHART_SLUGS: readonly string[] = [...RECIPES.keys()];

export const recipeOfSlug = (slug: string): Recipe | undefined => RECIPES.get(slug);
