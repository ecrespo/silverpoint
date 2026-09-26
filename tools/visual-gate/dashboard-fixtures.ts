/**
 * The dashboard fixtures of Data Model §5 (REQ-210): 3 reference dashboards × 4 substrates ×
 * 2 modes = 24, rendered at `ssrWidth` 1280 for the tree gate; the pixel gate draws the same 24 at
 * three container widths. Each carries its canonical render, computed from the core alone.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DashboardProps } from '@silverpoint/core';
import { DASHBOARD_DEMOS, type DashboardDemoChild } from '@silverpoint/core/dashboard-demos';
import { DASHBOARDS } from './catalog';
import { FIXTURES_DIR } from './fixtures';

export interface DashboardFixture {
  /** `<dashboard>--<ground>--<substrate>--<mode>`: the file name of its canonical render. */
  readonly id: string;
  readonly dashboard: keyof typeof DASHBOARD_DEMOS;
  readonly req: string;
  readonly ground: string;
  readonly substrate: string;
  readonly mode: 'ink' | 'precision';
  /** The nominal width of the parity render (Data Model §5). */
  readonly ssrWidth: number;
  /** Path to the canonical normalised tree, relative to the fixtures directory. */
  readonly canonical: string;
}

export const SUBSTRATES = ['cream', 'green', 'blue', 'ochre'] as const;
export const PARITY_WIDTH = 1280;

export const dashboardFixtureId = (f: Pick<DashboardFixture, 'dashboard' | 'ground' | 'substrate' | 'mode'>) => `${f.dashboard}--${f.ground}--${f.substrate}--${f.mode}`;

/** The 24 fixtures, in a stable order. */
export function dashboardMatrix(): DashboardFixture[] {
  return DASHBOARDS.flatMap((dashboard) =>
    SUBSTRATES.flatMap((substrate) =>
      (['ink', 'precision'] as const).map((mode) => {
        const cell = { dashboard, ground: 'silverpoint', substrate, mode } as const;
        const id = dashboardFixtureId(cell);
        return { ...cell, id, req: 'REQ-210', ssrWidth: PARITY_WIDTH, canonical: `dashboard/${id}.canonical.txt` };
      }),
    ),
  );
}

/** The committed dashboard fixtures, sorted by id. */
export function loadDashboardFixtures(): DashboardFixture[] {
  const dir = join(FIXTURES_DIR, 'dashboard');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.dashboard.json'))
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')) as DashboardFixture)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

/**
 * What every adapter receives for a fixture: the dashboard's props, with the fixture's substrate
 * and mode set on the dashboard — so its charts inherit them (REQ-212) — and its children.
 */
export function dashboardFixtureProps(fixture: DashboardFixture): { props: DashboardProps; children: readonly DashboardDemoChild[] } {
  const demo = DASHBOARD_DEMOS[fixture.dashboard];
  return {
    props: { ...demo.props, ground: fixture.ground, substrate: fixture.substrate as DashboardProps['substrate'], mode: fixture.mode, ssrWidth: fixture.ssrWidth } as DashboardProps,
    children: demo.children,
  };
}
