/**
 * The fixture matrix of Art. 3 (Data Model §5, REQ-182): the declared unit both gates compare.
 * Each fixture carries its canonical render — the normalised SVG the core pipeline produces —
 * and every adapter is compared against that file, never against a sibling adapter.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ChartRecipe, CommonChartProps, Datum } from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import { normalizeSvg } from '../svg-normalizer/normalize';
import { CATALOG } from './catalog';

export interface Fixture {
  /** Stable identifier; it is the file name of the golden image. */
  readonly id: string;
  readonly chart: string;
  /** Traceability to the PRD. */
  readonly req: string;
  readonly ground: string;
  readonly substrate: string;
  readonly mode: 'ink' | 'precision';
  readonly hatchFill: 'tile' | 'per-shape';
  readonly seed: number;
  readonly size: { readonly width: number; readonly height: number };
  readonly props: Readonly<Record<string, unknown>>;
  /** Path to a JSON data file, relative to the fixtures directory, or `null` for the demo dataset. */
  readonly data: string | null;
  /** Path to the canonical normalised SVG, relative to the fixtures directory. */
  readonly canonical: string;
}

export const FIXTURES_DIR = fileURLToPath(new URL('../../fixtures', import.meta.url));

/** Size names of Data Model §5. */
export const SIZES = { sm: { width: 240, height: 120 }, md: { width: 320, height: 150 }, lg: { width: 640, height: 300 } } as const;

/** Recipes by chart name, from the catalog. */
export const RECIPES: Readonly<Record<string, ChartRecipe<CommonChartProps>>> = Object.fromEntries(CATALOG.map((c) => [c.chart, c.recipe]));

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function sizeName(size: { width: number; height: number }): string | undefined {
  return Object.entries(SIZES).find(([, s]) => s.width === size.width && s.height === size.height)?.[0];
}

/** The id a fixture must carry: `<chart>--<ground>--<substrate>--<mode>--<size>`. */
export function fixtureId(fixture: Pick<Fixture, 'chart' | 'ground' | 'substrate' | 'mode' | 'size' | 'hatchFill'>): string {
  const suffix = fixture.hatchFill === 'per-shape' ? '--per-shape' : '';
  return `${kebab(fixture.chart)}--${fixture.ground}--${fixture.substrate}--${fixture.mode}--${sizeName(fixture.size) ?? 'custom'}${suffix}`;
}

/** Returns one message per schema violation; empty when the fixture is valid. */
export function validateFixture(value: unknown): string[] {
  const problems: string[] = [];
  const f = value as Partial<Record<keyof Fixture, unknown>>;
  if (typeof value !== 'object' || value === null) return ['a fixture is an object'];
  for (const key of ['id', 'chart', 'req', 'ground', 'substrate', 'canonical'] as const) {
    if (typeof f[key] !== 'string' || (f[key] as string).length === 0) problems.push(`${key} must be a non-empty string`);
  }
  if (f.mode !== 'ink' && f.mode !== 'precision') problems.push(`mode must be 'ink' or 'precision'`);
  if (f.hatchFill !== 'tile' && f.hatchFill !== 'per-shape') problems.push(`hatchFill must be 'tile' or 'per-shape'`);
  if (typeof f.seed !== 'number' || !Number.isInteger(f.seed)) problems.push('seed must be an integer');
  const size = f.size as { width?: unknown; height?: unknown } | undefined;
  if (typeof size?.width !== 'number' || typeof size?.height !== 'number') problems.push('size needs a numeric width and height');
  if (typeof f.props !== 'object' || f.props === null) problems.push('props must be an object');
  if (f.data !== null && typeof f.data !== 'string') problems.push('data must be a path or null');
  if (typeof f.req === 'string' && !/^REQ-\d{3}$/.test(f.req)) problems.push('req must be a REQ-NNN identifier');
  if (typeof f.chart === 'string' && !(f.chart in RECIPES)) problems.push(`chart ${f.chart} has no recipe`);
  if (problems.length === 0 && f.id !== fixtureId(value as Fixture)) problems.push(`id must be ${fixtureId(value as Fixture)}`);
  return problems;
}

function jsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? jsonFiles(join(dir, entry.name)) : entry.name.endsWith('.fixture.json') ? [join(dir, entry.name)] : [],
  );
}

/** Every fixture under `fixtures/`, sorted by id. */
/** Whether a cell belongs to the PR matrix: the `md` size and `tile` fills (Data Model §5). */
export const inPrMatrix = (fixture: Pick<Fixture, 'hatchFill' | 'size'>): boolean =>
  fixture.hatchFill === 'tile' && fixture.size.width === SIZES.md.width && fixture.size.height === SIZES.md.height;

/** The committed fixtures: the PR matrix (264) by default, or the nightly one (1,584). */
export function loadFixtures(scope: 'pr' | 'full' = 'pr'): Fixture[] {
  return jsonFiles(FIXTURES_DIR)
    .map((file) => JSON.parse(readFileSync(file, 'utf8')) as Fixture)
    .filter((fixture) => scope === 'full' || inPrMatrix(fixture))
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** The props every adapter receives for a fixture: the same object, whatever the framework. */
export function fixtureProps(fixture: Fixture): CommonChartProps {
  const data = fixture.data === null ? undefined : (JSON.parse(readFileSync(join(FIXTURES_DIR, fixture.data), 'utf8')) as Datum[]);
  return {
    ...fixture.props,
    ...(data === undefined ? {} : { data }),
    id: fixture.id,
    ground: fixture.ground,
    substrate: fixture.substrate as CommonChartProps['substrate'],
    mode: fixture.mode,
    hatchFill: fixture.hatchFill,
    seed: fixture.seed,
    width: fixture.size.width,
    height: fixture.size.height,
  };
}

/** The canonical render of a fixture, computed by the core pipeline and normalised. */
export function canonicalFor(fixture: Fixture): string {
  const recipe = RECIPES[fixture.chart];
  if (!recipe) throw new Error(`No recipe for ${fixture.chart}`);
  return normalizeSvg(toSVGString(renderChart(recipe, fixtureProps(fixture), { id: fixture.id })));
}
