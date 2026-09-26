import type { CommonChartProps, LineChartProps } from '@silverpoint/core';

export interface HarnessFixture {
  readonly id: string;
  readonly chart: string;
  readonly req: string;
  readonly ground: string;
  readonly substrate: 'cream' | 'green' | 'blue' | 'ochre';
  readonly mode: 'ink' | 'precision';
  readonly hatchFill: 'tile' | 'per-shape';
  readonly seed: number;
  readonly size: { readonly width: number; readonly height: number };
  readonly props: Readonly<Record<string, unknown>>;
  readonly rows: readonly Record<string, unknown>[] | null;
}

export declare const ALL_FIXTURES: readonly HarnessFixture[];
export declare const FIXTURES: readonly HarnessFixture[];
export declare function sizeOf(fixture: HarnessFixture): 'sm' | 'md' | 'lg';
export declare function fixtureById(id: string | null | undefined): HarnessFixture | undefined;
/** A fixture's props: the common ones, typed, plus whatever its chart takes. */
export type FixtureProps = CommonChartProps & Record<string, unknown>;
export declare function fixtureProps(fixture: HarnessFixture): FixtureProps;
export declare const DEMO_PROPS: Readonly<LineChartProps>;
export declare const GALLERY: readonly { readonly chart: string; readonly props: FixtureProps }[];
export declare function wantsGallery(search: string): boolean;

import type { DashboardProps } from '@silverpoint/core';
import type { DashboardDemoChild } from '@silverpoint/core/dashboard-demos';

export interface HarnessDashboardFixture {
  readonly id: string;
  readonly dashboard: 'kpi-strip' | 'ops' | 'mixed-spans';
  readonly ground: string;
  readonly substrate: 'cream' | 'green' | 'blue' | 'ochre';
  readonly mode: 'ink' | 'precision';
  readonly ssrWidth: number;
}
export interface HarnessDashboard {
  readonly props: DashboardProps;
  readonly children: readonly DashboardDemoChild[];
}
export declare const DASHBOARD_WIDTHS: readonly number[];
export declare const DASHBOARD_FIXTURES: readonly HarnessDashboardFixture[];
export declare function dashboardFixtureById(id: string | null | undefined): HarnessDashboardFixture | undefined;
export declare function dashboardFixtureProps(fixture: HarnessDashboardFixture): HarnessDashboard;
export declare const REFERENCE_DASHBOARD: HarnessDashboard;
