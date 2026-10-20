import type { CommonChartProps, LineChartProps } from '@silverpoint/core';
import type { Palette } from '@silverpoint/core';
import type { SpTimelineProps } from '@silverpoint/core/timeline';
import type { SpCardProps, SpProgressProps, SpTableProps, SpToasterProps } from '@silverpoint/core/ui';

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
  /** A state fixture's name (`root`: a drilled hierarchy, REQ-439); absent for a chart's own cells. */
  readonly state?: string;
  readonly props: Readonly<Record<string, unknown>>;
  readonly rows: readonly Record<string, unknown>[] | null;
}

export declare const ALL_FIXTURES: readonly HarnessFixture[];
export declare const FIXTURES: readonly HarnessFixture[];
export declare function sizeOf(fixture: HarnessFixture): 'sm' | 'md' | 'lg';
/** The chart a fixture draws, and its state when it is a state fixture: `SunburstChart (root)`. */
export declare function fixtureLabel(fixture: Pick<HarnessFixture, 'chart' | 'state'>): string;
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
export declare const LINKED_DASHBOARD: HarnessDashboard;
export declare function dashboardPage(search: string): HarnessDashboard;

import type { CommonUiProps, UiAnchorOptions, UiElement, UiNode, UiOverlayKind } from '@silverpoint/core/ui';

export interface HarnessUiFixture {
  readonly id: string;
  readonly component: string;
  readonly state: string;
  readonly req: 'REQ-327';
  readonly ground: string;
  readonly substrate: string;
  readonly mode: 'ink' | 'precision';
  readonly size: 'sm' | 'md' | 'lg';
  readonly width: number;
  readonly scope: 'pr' | 'nightly';
  readonly canonical: string;
}
export interface HarnessUiParts {
  readonly props: CommonUiProps & Record<string, unknown>;
  readonly value: unknown;
  readonly slots: Partial<Record<'content' | 'extra' | 'footer' | 'action', string>>;
  /** An overlay's trigger text: the consumer's element beside it. */
  readonly trigger?: string;
  /** An open list's active item (REQ-498). */
  readonly active?: string;
}
export declare const UI_FIXTURES: readonly HarnessUiFixture[];
export declare const UI_PR_FIXTURES: readonly HarnessUiFixture[];
export declare function uiFixtureById(id: string | null | undefined): HarnessUiFixture | undefined;
export declare function uiSizeOf(fixture: HarnessUiFixture): 'md' | 'lg';
/** The components whose `value` each framework binds; a Progress's `value` is a plain prop. */
export declare const UI_VALUE_COMPONENTS: ReadonlySet<string>;
export declare function uiFixtureParts(fixture: HarnessUiFixture): HarnessUiParts;
export declare function uiFixtureView(fixture: HarnessUiFixture): { view: UiElement; slots: HarnessUiParts['slots'] };
/** The roots the canonical page writes for a UI fixture (T-219): composed, slots filled, an overlay's trigger before it. */
export declare function uiFixtureTree(fixture: HarnessUiFixture): readonly UiNode[];
/** How the canonical page opens a fixture's overlay as its adapter does (DD-043); `focus` is the menu item that takes focus. */
export declare function uiFixtureOverlay(
  fixture: HarnessUiFixture,
): { readonly kind: UiOverlayKind; readonly place?: UiAnchorOptions; readonly focus?: string } | undefined;

/** One item of the UI reference page (T-157): a demo state under its panel's configuration. */
export interface HarnessUiPageItem extends HarnessUiParts {
  readonly key: string;
  readonly component: string;
  /** The Card's content: a chart (C-5). */
  readonly chart?: { readonly chart: string; readonly props: Record<string, unknown> };
  /** The Tabs' panels. */
  readonly tabPanels?: readonly { readonly value: string; readonly text: string }[];
}
export interface HarnessUiPagePanel {
  readonly key: string;
  readonly title: string;
  readonly note: string;
  readonly ground: string;
  readonly substrate: string;
  readonly mode: 'ink' | 'precision';
  readonly sections: readonly { readonly title: string; readonly items: readonly HarnessUiPageItem[] }[];
}
export declare const UI_PAGE: { readonly title: string; readonly panels: readonly HarnessUiPagePanel[] };
/** An item of the composed page (T-222): a UI fixture's state, drawn on a page panel. */
export interface HarnessComposedItem extends HarnessUiFixture {
  /** The panel's key: the item's id is prefixed with it, and its overlay starts closed behind its trigger. */
  readonly page: string;
}
export interface HarnessComposedPanel {
  readonly key: string;
  readonly title: string;
  readonly note: string;
  readonly ground: string;
  readonly substrate: string;
  readonly mode: 'ink' | 'precision';
  readonly sections: readonly {
    readonly title: string;
    readonly items: readonly HarnessComposedItem[];
    /** The overlays section's toaster: its toasts are drawn inside it. */
    readonly toaster?: SpToasterProps & { readonly id: string; readonly label: string };
  }[];
}
export declare const COMPOSED_PAGE: { readonly title: string; readonly panels: readonly HarnessComposedPanel[] };
export interface HarnessPalettePreset {
  readonly key: string;
  readonly title: string;
  readonly palette: Palette;
  readonly chart: LineChartProps;
  /** The Card's props; it holds the Progress. */
  readonly card: SpCardProps;
  readonly progress: SpProgressProps;
  readonly table: SpTableProps;
}
export declare const PALETTES_PAGE: { readonly title: string; readonly presets: readonly HarnessPalettePreset[] };
export declare const TIMELINE_PAGE: {
  readonly title: string;
  readonly timeline: SpTimelineProps;
  /** What the mount shows when TimelineJS cannot be loaded. */
  readonly fallback: string;
};
