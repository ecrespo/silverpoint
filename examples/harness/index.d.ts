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

export declare const FIXTURES: readonly HarnessFixture[];
export declare function fixtureById(id: string | null | undefined): HarnessFixture | undefined;
/** A fixture's props: the common ones, typed, plus whatever its chart takes. */
export type FixtureProps = CommonChartProps & Record<string, unknown>;
export declare function fixtureProps(fixture: HarnessFixture): FixtureProps;
export declare const DEMO_PROPS: Readonly<LineChartProps>;
