/** T-293 · the registry and the generated prop tables (REQ-630, REQ-653; I-55). */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { CHART_SLUGS } from '../src/index';
import { recipeOfSlug } from '../src/registry';
import { CHART_PROPS } from '../src/spec/charts.generated';

const catalog = JSON.parse(readFileSync(new URL('../../mcp/agent-catalog.json', import.meta.url), 'utf8')) as { charts: { slug: string; props: { name: string }[] }[] };

describe('registry', () => {
  test("I-55 · CHART_SLUGS equals the agent catalog's chart slugs, in order", () => {
    expect(CHART_SLUGS).toEqual(catalog.charts.map((c) => c.slug));
    expect(CHART_SLUGS).toHaveLength(60);
  });

  test('I-55 · every slug resolves to a recipe of the same name', () => {
    for (const slug of CHART_SLUGS) {
      const recipe = recipeOfSlug(slug);
      expect(recipe, slug).toBeDefined();
      expect(recipe!.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()).toBe(slug);
    }
  });

  test('REQ-653 · the prop tables are the catalog’s, chart by chart', () => {
    for (const c of catalog.charts) expect(CHART_PROPS[c.slug], c.slug).toEqual(c.props.map((p) => p.name));
  });

  test('an unknown slug resolves to nothing', () => {
    expect(recipeOfSlug('nope')).toBeUndefined();
    expect(recipeOfSlug('constructor')).toBeUndefined();
  });
});
