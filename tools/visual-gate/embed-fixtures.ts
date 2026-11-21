/**
 * DD-065: a chart fixture's spec equivalent, derived mechanically — `chart` is the recipe's slug,
 * the appearance fields lifted out of props, `seed` and `hatchFill` kept as props. A fixture whose
 * props hold a function has no JSON form: it is skipped by rule and counted, never dropped silently.
 * Paths are plain strings, never URLs, so a DOM test environment can load it too.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ChartSpec } from '../../packages/embed/src/spec/types';
import type { Fixture } from './fixtures';

const kebab = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').toLowerCase();

const holdsFunction = (value: unknown): boolean =>
  typeof value === 'function' || (typeof value === 'object' && value !== null && Object.values(value).some(holdsFunction));

/** The chart fixtures' directories (dashboards, decks, UI, palettes and the timeline excluded). */
const NOT_CHARTS = new Set(['dashboard', 'deck', 'ui', 'palette', 'timeline', 'embed']);

/** The chart fixtures of a scope, as the gates load them (`md` and `tile` for the PR matrix). */
export function chartFixtures(fixturesDir: string, scope: 'pr' | 'full' = 'pr'): Fixture[] {
  const out: Fixture[] = [];
  for (const dir of readdirSync(fixturesDir)) {
    if (NOT_CHARTS.has(dir) || !statSync(join(fixturesDir, dir)).isDirectory()) continue;
    for (const file of readdirSync(join(fixturesDir, dir)).filter((f) => f.endsWith('.fixture.json'))) {
      const fixture = JSON.parse(readFileSync(join(fixturesDir, dir, file), 'utf8')) as Fixture;
      if (scope === 'full' || (fixture.hatchFill === 'tile' && fixture.size.width === 320 && fixture.size.height === 150)) out.push(fixture);
    }
  }
  return out.sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** The fixture as a `ChartSpec`, or `null` when its props cannot be JSON. */
export function specOfFixture(fixture: Fixture, fixturesDir: string): ChartSpec | null {
  const { data: inline, ...props } = fixture.props as { data?: unknown };
  if (holdsFunction(props) || holdsFunction(inline)) return null;
  const data = fixture.data === null ? inline : JSON.parse(readFileSync(join(fixturesDir, fixture.data), 'utf8'));
  return {
    chart: kebab(fixture.chart),
    ...(data === undefined ? {} : { data }),
    props: { ...props, seed: fixture.seed, hatchFill: fixture.hatchFill },
    width: fixture.size.width,
    height: fixture.size.height,
    id: fixture.id,
    ground: fixture.ground,
    substrate: fixture.substrate,
    mode: fixture.mode,
  };
}
