/**
 * Slug → recipe (DD-061): the 60 recipes imported by name from the generated list, so a bundle
 * keeps the recipes and drops the rest of the core (DD-062). The third and last copy of this map:
 * the MCP is re-pointed here (T-318) and the deck moves in a later delta (D11).
 */
import type { ChartRecipe, CommonChartProps } from '@silverpoint/core';
import { RECIPES } from './recipes.generated';

export const CHART_SLUGS: readonly string[] = [...RECIPES.keys()];

export const recipeOfSlug = (slug: string): ChartRecipe<CommonChartProps> | undefined => (RECIPES.has(slug) ? RECIPES.get(slug) : undefined);
