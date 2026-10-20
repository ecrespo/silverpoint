/**
 * The core's 60 chart recipes by recipe name (the React name in the catalog): the same objects
 * the adapters and the canonical render call (DD-047).
 */
import * as core from '@silverpoint/core';
import type { ChartRecipe, CommonChartProps } from '@silverpoint/core';
import * as catalog from '@silverpoint/core/catalog';
import type { ChartEntry } from './types';

type Recipe = ChartRecipe<CommonChartProps>;

const isRecipe = (value: unknown): value is Recipe =>
  typeof value === 'object' && value !== null && typeof (value as Recipe).build === 'function' && typeof (value as Recipe).name === 'string';

const RECIPES: ReadonlyMap<string, Recipe> = new Map([...Object.values(core), ...Object.values(catalog)].filter(isRecipe).map((r) => [r.name, r]));

export function recipeOf(chart: ChartEntry): Recipe {
  const recipe = RECIPES.get(chart.names.react);
  if (!recipe) throw new Error(`No recipe named ${chart.names.react} in @silverpoint/core.`);
  return recipe;
}

export const RECIPE_COUNT = RECIPES.size;
