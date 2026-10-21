# silverpoint — API Specification

## Metadata

| Field | Value |
|---|---|
| **Author** | Ernesto Crespo |
| **Status** | `IN_REVIEW` |
| **API version** | v1.12 |
| **Date** | 2026-10-20 |
| **Related PRD** | [`prd.md`](prd.md) v1.14 |
| **Applicable Constitution** | [`constitution.md`](constitution.md) v1.10 |
| **Surface** | npm packages; one public, read-only MCP endpoint (§14) |

---

## 0. Template adaptation note

The API Spec template assumes an HTTP service. silverpoint is a client library, so each
section is carried over to its equivalent and the correspondence is written down here, so
that the Analyze gate does not read it as an omission:

| Original section | Equivalent here |
|---|---|
| Base URL | Packages and *entry points* (§1) |
| Authentication and roles | Not applicable — replaced by public versus internal surface (§2) |
| Response format | Shared types and naming conventions (§3, §4) |
| Error codes | Catalog of errors and warnings with a stable code (§11) |
| Endpoints | Components and their props (§5 through §8) |
| Pagination | Not applicable |
| Webhooks | Events and interaction (§9) |
| Rate limiting | Limits and budgets (§12) |
| Versioning | SemVer and deprecation policy (§13) |

## 1. Packages and entry points

| Package | Contents | Dependencies |
|---|---|---|
| `@silverpoint/core` | Geometry, scales, interaction, the `Inker` interface, types; the second catalog's recipes under `/catalog` (§7.3); the UI components' framework-neutral surface under `/ui` and `/ui-demos` (§1.2, §1.3); the palette API under `/palettes` and the timeline's under `/timeline` (§1.3) | `d3-scale`, `d3-shape` and the ribbon generator (§8.4) |
| `@silverpoint/grounds` | Declarative style tokens, the `styles.css` sheet, the opt-in `ui.css` sheet (§1.2) and the opt-in `timeline.css` sheet (§1.3) | `@silverpoint/core` |
| `@silverpoint/react` | React components: charts, the dashboard, the UI components (§1.2, §1.3) and `SpTimeline` | `peer`: `react`, `react-dom`; optional `peer`: `@knight-lab/timelinejs` (§1.3) |
| `@silverpoint/angular` | Standalone components, in Angular Package Format | `peer`: `@angular/core`, `@angular/common`, `@angular/forms` (UI components, REQ-323); optional `peer`: `@knight-lab/timelinejs` (§1.3) |
| `@silverpoint/vue` | Vue 3 components authored with `<script setup>`: charts, the dashboard, the UI components and `SpTimeline` | `peer`: `vue`; optional `peer`: `@knight-lab/timelinejs` (§1.3) |
| `@silverpoint/fonts` | **Optional.** Self-hosted EB Garamond (400, 500 and 400 italic) plus its `@font-face` rules | none |
| `@silverpoint/tailwind` | **Optional.** A Tailwind preset naming the public `--sp-` variables as theme tokens (§10.4, REQ-047) | none, not even a peer |
| `@silverpoint/mcp` | **Optional, for agents.** The agent catalog and an MCP server over stdio (`silverpoint-mcp`) and stateless Streamable HTTP (`./http`) (§14) | `@silverpoint/core`, `@silverpoint/grounds`, `@modelcontextprotocol/sdk`, `zod`; no framework, no peer |

Every chart is importable by subpath, so that an app using one does not drag in all 60
(REQ-107, REQ-444):

```ts
import { LineChart } from '@silverpoint/react';            // barrel
import { LineChart } from '@silverpoint/react/line-chart';  // subpath
import '@silverpoint/grounds/styles.css';                   // once only, in the app
```

The dashboard composition (§7.1) follows the same rule, under a `dashboard` subpath in each
adapter: `@silverpoint/react/dashboard` (and `/server/dashboard`), `@silverpoint/vue/dashboard`,
`@silverpoint/angular/dashboard`. It ships inside the existing packages; there is no dashboard
package.

The 27 charts of the second catalog (§7.3) are subpaths of the same shape, in every adapter
(`@silverpoint/react/histogram-chart`, `@silverpoint/vue/sunburst-chart`,
`@silverpoint/angular/box-plot-chart`). In the core their recipes, demos and the internal
statistics and layouts they use sit behind one subpath, `@silverpoint/core/catalog`, apart from the
main entry as `/dashboard-demos` and `/ui` are, so the core's main bundle keeps its budget; their
props types stay in the main entry. The statistics and layout functions are not exported: a public
`@silverpoint/core/stats` is not offered in `0.x` (OQ-C3). The core's dependencies are unchanged:
the hierarchy, contour and triangulation generators are owned by the core.

### 1.1 Consuming under a bundler

The three frameworks are React, Angular and Vue. The bundlers that host them are validated
separately, because that is where package resolution actually breaks. Vite is the default
host for both the React and the Vue example apps, and runs underneath the Angular CLI.

| Host | Guarantee | Requirement |
|---|---|---|
| Vite | Every subpath resolves identically in the dev server and in the production build, with no `optimizeDeps` entry required | REQ-033 |
| Vite, Next.js, any bundler | The stylesheet import survives tree-shaking: packages declare `sideEffects: false` **except** for `.css`, so `import '@silverpoint/grounds/styles.css'` is never dropped | REQ-034 |
| Next.js | Server-rendered markup hydrates with no mismatch | REQ-103 |

If a consumer ever needs an `optimizeDeps.include` entry to make an import work, that is a
defect in this package, not a configuration step for them to discover.

In Angular the subpath is a secondary entry point per APF:

```ts
import { SpLineChart } from '@silverpoint/angular/line-chart';
```

In Vue the subpath mirrors React's:

```ts
import { SpLineChart } from '@silverpoint/vue/line-chart';
```

### 1.2 UI components (feature-002)

No new package (DD-021): the 17 components ship inside the existing seven, under one version.

| Package | Subpath | Exports |
|---|---|---|
| `@silverpoint/core` | `@silverpoint/core/ui` (internal surface, §2.1) and `@silverpoint/core/ui-demos` | `ui/*`: value geometry, keyboard transitions, frame variant, item validation, the `ui*View` trees, types (§3.3). A subpath of its own, so the charts' entry and its 45 kB budget are unchanged, and the UI runtime is measured apart (REQ-330) |
| `@silverpoint/grounds` | `@silverpoint/grounds/ui.css` | The components' stylesheet: frame and tone pieces per ground, sizes, focus, states (§10.2). Opt-in (REQ-301) |
| `@silverpoint/react` | `@silverpoint/react/ui/<name>` and the barrel `@silverpoint/react/ui`; `@silverpoint/react/server/ui/<name>` | `SpButton`, `SpInput`, `SpCheckbox`, `SpRadioGroup`, `SpSwitch`, `SpSlider`, `SpRate`, `SpSegmented`, `SpTabs`, `SpTabPanel`, `SpSteps`, `SpCard`, `SpTag`, `SpBadge`, `SpDivider`, `SpProgress`, `SpAlert`, `SpSkeleton` |
| `@silverpoint/vue` | `@silverpoint/vue/ui/<name>` and `@silverpoint/vue/ui` | The same names as React (`SpButton`, `SpTabPanel`, …) |
| `@silverpoint/angular` | `@silverpoint/angular/ui/<name>` (secondary entry points) and `@silverpoint/angular/ui`; the providers, tokens and environment signals in `@silverpoint/angular/env` | `SpButton` (`button[spButton], a[spButton]`) and the elements `sp-input`, `sp-checkbox`, `sp-radio-group`, `sp-switch`, `sp-slider`, `sp-rate`, `sp-segmented`, `sp-tabs`, `sp-tab-panel`, `sp-steps`, `sp-card`, `sp-tag`, `sp-badge`, `sp-divider`, `sp-progress`, `sp-alert`, `sp-skeleton` |

That is 17 components and 18 exported names (`SpTabPanel` is part of Tabs). `<name>` is kebab-case:
`ui/button`, `ui/radio-group`, `ui/tabs` (which also exports `SpTabPanel`).

Every component is named `Sp<Name>` in the three adapters (OQ-U2): unlike the charts, component
names such as `Button` and `Input` collide with every application's own, and one name per component
keeps the docs and the parity fixtures adapter-neutral. The component tables below use the bare
`<Name>` for brevity.

The React client boundary (`"use client"`) is set only on components with state or effects.
Display components render in Server Components from `@silverpoint/react/server/ui/<name>` (props
and dashboard cell only, as the charts' server entries do): `card`, `tag`, `badge`, `divider`,
`progress`, `alert`, `skeleton` and `steps`. The server `Tag` and `Alert` take no `closable`.
`ui/<name>` are client entries that read the provider (REQ-104 extended).

Angular: `@angular/forms` is a peer, for `ControlValueAccessor` (REQ-323). The providers, tokens
and environment signals live in the secondary entry `@silverpoint/angular/env`,
which the main entry re-exports, so a UI component does not carry the charts' render pipeline
(REQ-330).

```ts
import '@silverpoint/grounds/styles.css';   // as today
import '@silverpoint/grounds/ui.css';       // once, only if the app uses components
import { SpSegmented } from '@silverpoint/react/ui/segmented';
```

### 1.3 Palettes, composed components, overlays and the timeline (feature-004)

No new package (DD-021 holds). One new optional peer, on one subpath.

| Package | Subpath | Exports |
|---|---|---|
| `@silverpoint/core` | `.` (main) | `type Palette`, `type PaletteFinding` (types only) |
| `@silverpoint/core` | `@silverpoint/core/palettes` | `paletteStyle`, `resolvePalette`, `nestProvider`, `checkPalette`, `contrastRatio`, `PALETTE_PROPERTIES`, `PALETTE_PAIRS`; the presets `silverpoint`, `sanguine`, `sepia`, `ironGall`, `verdigris`, `indigo`, `PALETTES` (one record of the six) and `PALETTE_NAMES`. *Amended in implementation (user decision, 2026-10-18):* the functions sit here, not on the main entry, which they pushed past its 45 kB budget (REQ-164); only the types stay on the main entry. `PALETTE_NAMES` is written out, so an unused preset tree-shakes out |
| `@silverpoint/core` | `@silverpoint/core/ui` | Adds the view functions, types and core functions of §2.1 |
| `@silverpoint/core` | `@silverpoint/core/ui-demos` | `UI_DEMOS` gains one entry per state of the new rows (Data Model §5); `TIMELINE_DEMO` (Data Model §4). *Amended in implementation:* the timeline's demo data is `TIMELINE_DEMO` here, not `TIMELINE_EVENTS` on `/timeline`, so no application ships it (REQ-330) |
| `@silverpoint/core` | `@silverpoint/core/timeline` | `timelineView`, `timelineInk` (the probe reader, DOM structural types), `TIMELINE_FRAMES`, `TIMELINE_TONES`, types (`SpTimelineProps`, `TimelineData`). *Amended in implementation:* the client half is here too, so the three adapters share it: `timelineMount` (inks the surface, loads TimelineJS through the adapter's `load`, builds it in the mount, forwards its events, warns `SP025` and calls `failed` on a failed load; its cleanup cancels a pending load and removes only TimelineJS's DOM), `timelineOptions` (drops `font` and `theme`) and `TIMELINE_EVENTS` (TimelineJS's seven event names, each with the name the adapters forward it under) |
| `@silverpoint/grounds` | `@silverpoint/grounds/ui.css` | Adds the rules of the new components (§7.4) |
| `@silverpoint/grounds` | `@silverpoint/grounds/timeline.css` | The TimelineJS skin (REQ-511). Opt-in |
| `@silverpoint/react` | `ui/<name>`, `server/ui/<name>`, `ui` barrel | `SpSurface`, `SpGlyph`, `SpTable`, `SpPagination`, `SpBreadcrumb`, `SpAvatar`, `SpAvatarGroup`, `SpStatistic`, `SpDescriptions`, `SpTimelineList`, `SpCollapse`, `SpCollapseItem`, `SpEmpty`, `SpResult`, `SpTextarea`, `SpInputNumber`, `SpModal`, `SpDrawer`, `SpPopover`, `SpTooltip`, `SpSelect`, `SpDropdownMenu`, `SpToast`, `SpToaster`. *Amended in implementation:* `server/ui/<name>` exists for the display components of batch A1 only (`surface`, `glyph`, `table` —sorting needs the client entry—, `breadcrumb`, `avatar`, `statistic`, `descriptions`, `timeline-list`, `empty`, `result`); Pagination, Collapse, Textarea, InputNumber and the eight overlays are client components only (§8.1) |
| `@silverpoint/react` | `@silverpoint/react/timeline` | `SpTimeline` |
| `@silverpoint/vue` | `ui/<name>`, `ui`, `timeline` | The same names; `SilverpointProvider` on the main entry (§3.4) |
| `@silverpoint/angular` | `ui/<name>`, `ui`, `timeline` (secondary entry points) | `[spSurface]`, `sp-glyph`, `sp-table`, `sp-pagination`, `sp-breadcrumb`, `sp-avatar`, `sp-avatar-group`, `sp-statistic`, `sp-descriptions`, `sp-timeline-list`, `sp-collapse`, `sp-collapse-item`, `sp-empty`, `sp-result`, `sp-textarea`, `sp-input-number`, `sp-modal`, `sp-drawer`, `sp-popover`, `sp-tooltip`, `sp-select`, `sp-dropdown-menu`, `sp-toast`, `sp-toaster`, `sp-timeline`. *Amended in implementation:* the surface is the attribute component `[spSurface]` (DD-024): the consumer's own element is the root, so `as` does not apply in Angular, and `sp-ui-tree` needs no case for every tag `as` may name; `sp-empty` and `sp-result` take `<ng-template spExtra>`, the card's `SpCardExtra`, re-exported from their entry points |
| `@silverpoint/angular` | `@silverpoint/angular/ui/overlay` (secondary entry point) | *Amended in implementation:* `SpTrigger`, the overlay base `SpUiOverlay` and the helpers `uiOverlayNative` and `uiListKeys`, apart from `ui/base` (§8.2). Each overlay subpath re-exports `SpTrigger` |

Subpath names: `ui/avatar` exports `SpAvatar` and `SpAvatarGroup`; `ui/collapse` exports
`SpCollapse` and `SpCollapseItem`; `ui/toast` exports `SpToast` and `SpToaster`.

**Peer dependencies.** `@knight-lab/timelinejs` `^3.9.13` is in the `peerDependencies` of the
three adapters with `peerDependenciesMeta: { optional: true }`. Only the `timeline` subpath imports it,
dynamically, on the client (REQ-510, REQ-513). TimelineJS's own stylesheet
(`@knight-lab/timelinejs/dist/css/timeline.css`) is imported by the consumer before ours.
*Amended in implementation:* the subpath imports `@knight-lab/timelinejs/src/js/timeline/Timeline.js`,
not the package entry: 3.9.13's entry imports a Less stylesheet that no consumer bundler loads
without a loader (esbuild, the engine of Vite and the Angular CLI, refuses it), while `Timeline.js`
is plain ES modules that split into a chunk of their own. The package ships no types; the adapters
read the module as `TimelineJsModule`. The adapters also carry it as an exact dev dependency
(`3.9.13`), for their tests. The import is a literal, so a consumer who imports the `timeline`
subpath must install the peer: without it the build fails to resolve it, and `SP025` covers
failures at run time (PRD REQ-515 as amended).

```ts
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import { sanguine } from '@silverpoint/core/palettes';
import { SilverpointProvider } from '@silverpoint/react';
import { SpTable } from '@silverpoint/react/ui/table';
import { SpModal } from '@silverpoint/react/ui/modal';

<SilverpointProvider palette={sanguine}>
  <SpTable caption="Orders" columns={columns} data={rows} sortKey={key} sortOrder={order} onSort={sortBy} />
  <SpModal title="Edit order" trigger={<SpButton>Edit</SpButton>}>…</SpModal>
</SilverpointProvider>
```

## 2. Public versus internal surface

**Public** —subject to SemVer—: component names and selectors, props and inputs, the
types exported in §3, the ground token schema (§6), the CSS custom properties of §10, the
error codes of §11 and the subpath names; for the UI components (§7.2, §7.4), the `Sp<Name>` names and selectors, their props, the markup contract and `part` names, and `@silverpoint/grounds/ui.css`; the palette API of `@silverpoint/core/palettes` and its six presets (§3.4); `SpTimeline`'s props and events and `@silverpoint/grounds/timeline.css` (§7.4).

**Internal** —may change in a minor version—: the shape of the `Geometry` objects the core
returns, the implementation of each `Inker`, the structure of the SVG DOM except for the
`part` attributes documented in §10, and any symbol exported under the `__` prefix. The whole of `@silverpoint/core/ui` (§2.1) is internal: adapters consume it, applications do not. So are the functions of `@silverpoint/core/timeline` (`timelineView`, `timelineInk`, `timelineMount`, `timelineOptions`), which the adapters share, and Angular's `@silverpoint/angular/ui/overlay` base. The DOM TimelineJS builds inside `SpTimeline` is not markup the library emits (Art. 3).

THE SYSTEM marks internals with `@internal` in TSDoc and excludes them from the public
`.d.ts`.

### 2.1 UI core surface (`@silverpoint/core/ui`)

```ts
/** 0..variants-1, from seed ?? id ?? 0 (REQ-307). Pure. */
export function uiFrameVariant(seed: Seed | undefined, id: string | undefined, variants: number): number;

/** Box, slice and radius of each frame kind, the geometry the grounds build cuts (DD-022). */
export const UI_FRAME_KINDS: Record<UiFrameKind, { size: number; slice: number; radius: number }>;

/**
 * Exact outline of a frame kind, the input the grounds build inks into pieces (DD-022). Build time
 * only. One `ornament` stroke: a frame carries no value, so the ground's inker may draw it, with
 * its vertices preserved (Art. 1 as amended).
 */
export function uiFrameOutline(kind: UiFrameKind): Geometry;

/**
 * Value → exact fraction in [0, 1], 2 decimals, after clamping and step rounding (REQ-324).
 * Without `step` the value is only clamped (Progress). `component` names the `SP017` warning.
 */
export function uiValue(value: number, range: { min: number; max: number; step?: number }, component?: string): { value: number; fraction: number; corrected: boolean };

/** A Rate's `count`: integer in 1..10, default 5; corrected with `SP017`. */
export function uiRateCount(count: number | undefined, component?: string): number;

/** Circle progress: the exact arc of the existing polar engine, in a 100 × 100 view box. */
export function uiProgressArc(fraction: number, stroke: number): { track: Stroke; fill: Stroke };  // both `role: 'encoding'`

/** Steps: status per item, and the status of the connector after it —that of the step it leads to (C-4); `null` after the last. */
export function uiSteps(items: readonly StepItem[], current: number, component?: string): readonly { key: string; status: StepStatus; connector: StepStatus | null }[];

/** WAI-ARIA APG transitions for roving focus (REQ-315). Pure. */
export function uiRovingKey(
  state: { index: number; count: number; disabled: readonly boolean[] },
  key: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End',
  orientation: 'horizontal' | 'vertical',
  dir: 'ltr' | 'rtl',
): number;

/** Keeps the first of each key, skips the rest and any empty key (REQ-325, SP019). */
export function uiItems<T extends { key: string }>(items: readonly T[], component: string): readonly T[];

/** A ground's `ui` tokens or the defaults, held to their domain; a `weight` ground's frame is always `css` (REQ-312). */
export function resolveUiTokens(ground: Ground): UiTokens;

/** Seamless tone tile layers for one ramp step: one for hachure, two for cross-hatch, none for weight (DD-022). Build time only. */
export function uiToneTile(spec: ToneSpec): readonly { width: number; height: number; strokes: readonly Stroke[] }[];

/** Accessible-name check (REQ-319, SP018). */
export function uiRequireName(component: string, text: string | undefined, label: string | undefined): void;
```

The surface added during implementation:

```ts
/** Fallbacks of Data Model §2.14: the selected key of a Tabs/Segmented ('first') or RadioGroup ('none'). */
export function uiSelectedKey(items: readonly UiItem[], value: string | null | undefined, fallback: 'none' | 'first'): string | null;

/** Validates a Slider/Rate range once, so it warns SP017 once. */
export function uiRange(range: { min: number; max: number; step?: number }, component?: string): { min: number; max: number; step?: number };  // invalid → 0..100 step 1, SP017

/** Whether a key moves a roving focus. */
export function uiIsRovingKey(key: string): key is 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End';

/**
 * The DOM side of REQ-315: finds the items under `root` by `selector`, reads `dir` from the nearest
 * ancestor, moves focus and, when `activate`, clicks the new item. Structural types: the core takes
 * no DOM library. The three adapters call it.
 */
export function uiRovingFocus(event: { readonly key: string; preventDefault(): void }, root: UiRovingRoot, selector: string, orientation: UiOrientation | 'both', activate: boolean): void;
```

- `uiSteps` also flags the current step.
- A view element's `bind` is `native` or `close`.
- The `ui*View` trees (`uiButtonView`, `uiInputView`, …) are the markup contract of §7.2 as data:
  every attribute, text and node an adapter writes. The canonical render of a fixture is that tree,
  written by a reference writer (`tools/visual-gate/ui-canonical.ts`).

**Additions for the composed components and overlays (feature-004).**

```ts
/** Rows in order of `key`, stable; null/undefined last; numbers before strings; strings by code point after lowercasing. Pure (REQ-474). */
export function uiSortRows<T extends Datum>(rows: readonly T[], key: string | undefined, order?: 'asc' | 'desc'): readonly T[];

/** 1, a gap, a window of 2·siblings + 1 around `current`, a gap, `count` (REQ-476). */
export function uiPageWindow(count: number, current: number, siblings: number): readonly UiPageEntry[];  // number | 'start-gap' | 'end-gap'

/** Pages, the corrected current page and the "start–end of total" numbers (SP017 when current is out of range). */
export function uiPagination(total: number, pageSize: number, current: number, component?: string): UiPagination;  // { count, current, start, end, corrected }

/** Clamp to min/max, round to `precision` decimals; null stays null (REQ-485, SP017 on correction). */
export function uiNumberValue(value: number | null, range: UiNumberRange, component?: string): UiNumberValue;
//  UiNumberRange: { min?, max?, step?, precision? }
//  UiNumberValue: { value: number | null; corrected; atMin; atMax; range }
//  Amended in implementation: `range` is the range as drawn (invalid bounds, step or
//  precision left out), for the `min`/`max`/`step` attributes.

/** `value ± step`, from `min ?? 0` when the value is null, then uiNumberValue. */
export function uiNumberStep(value: number | null, direction: 1 | -1, range: UiNumberRange, component?: string): number;

/** First letters of the first two words, upper-cased; '?' for none. */
export function uiInitials(name: string | undefined): string;

/** APG listbox / menu transitions: next active index, or open/close/select intents (REQ-494, REQ-495). Pure. */
export function uiListKey(state: UiListState, key: string, kind: 'listbox' | 'menu'): UiListResult;
//  UiListState: { active; count; disabled: readonly boolean[]; open }
//  UiListResult: { active; intent?: 'open' | 'close' | 'select' }

/** Typeahead: the first enabled label starting with `buffer` after `from`, wrapping; -1 for none. */
export function uiTypeahead(labels: readonly string[], disabled: readonly boolean[], buffer: string, from: number): number;

export interface UiBox { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
export type UiSide = 'top' | 'end' | 'bottom' | 'start';
export type UiAlign = 'start' | 'center' | 'end';
/** Anchored placement with flip and shift, 2 decimals (REQ-493). Pure. */
export function uiPlace(input: {
  readonly anchor: UiBox;
  readonly floating: { readonly width: number; readonly height: number };
  readonly viewport: { readonly width: number; readonly height: number };
  readonly side: UiSide;
  readonly align: UiAlign;
  readonly offset: number;
  readonly padding: number;
  readonly dir: 'ltr' | 'rtl';
}): { readonly x: number; readonly y: number; readonly side: UiSide; readonly align: UiAlign };

/**
 * The DOM side of an anchored overlay, as uiRovingFocus is for REQ-315: measures the anchor and the
 * overlay, calls uiPlace in the nearest `dir`, writes --sp-ui-x / --sp-ui-y and data-side.
 * Structural types, no DOM library. Client only, on open; again on scroll and resize.
 * Amended in implementation: also re-places when the anchor or the overlay changes size
 * (a ResizeObserver, where the engine has one), as when a web font replaces its fallback.
 */
export function uiAnchor(anchor: UiAnchorTarget, floating: UiAnchorFloating, options: UiAnchorOptions): () => void;  // returns the cleanup
//  UiAnchorOptions: { side; align; offset? (6); padding? (8) }

/**
 * Amended in implementation: opens or closes a <dialog> (showModal/show/close) or a popover
 * (showPopover/hidePopover) as `open` says, only from the other state; without the Popover API the
 * popover is left in flow and nothing is called.
 */
export function uiOverlaySync(element: UiOverlayElement, kind: 'modal' | 'dialog' | 'popover', open: boolean): void;
```

View functions, one per catalog row, as in `0.3.0`: `uiSurfaceView`, `uiGlyphView`, `uiTableView`,
`uiPaginationView`, `uiBreadcrumbView`, `uiAvatarView`, `uiAvatarGroupView`, `uiStatisticView`,
`uiDescriptionsView`, `uiTimelineListView`, `uiCollapseView`, `uiCollapseItemView`, `uiEmptyView`,
`uiResultView`, `uiTextareaView`, `uiInputNumberView`, `uiModalView`, `uiDrawerView`,
`uiPopoverView`, `uiTooltipView`, `uiSelectView`, `uiDropdownMenuView`, `uiToastView`,
`uiToasterView`. The view element's `bind` gains `trigger`, `dialog`, `popover`, `option`,
`menuitem`, `sort`, `page`, `stepper` and `summary` (TD §2); `UiSlot` gains `trigger`, `action` and
`fallback`. *Amended in implementation:* the helpers the adapters share join them:
`uiCollapseGroup` (an accordion's `${id}--accordion`, `SP017` without an id), `uiTriggerView` (the
wrapper of a consumer's trigger), `uiTriggerAria` (the ARIA an adapter sets on it at runtime: a
slotted element is consumer markup), `uiSelectItems` and `uiMenuItems` (the flat lists `uiListKey`
moves over), `uiToastDuration` (a toast's own, its toaster's, else 5000 ms) and `UI_GLYPHS`.

`UI_COMPONENTS` gains the 21 rows of Data Model §5 with a `family: 'ui' | 'composed' | 'overlay'`
field (the 17 existing rows are `ui`) and batches `A1`, `A2`, `B`.

## 3. Shared types

```ts
/** A row of data. Charts reach its fields through accessors. */
export type Datum = Readonly<Record<string, unknown>>;

/** Access to a field: key name or pure function. */
export type Accessor<T = number> = string | ((d: Datum, i: number) => T);

/** Inking mode. `precision` amounts to using NullInker (REQ-021). */
export type InkMode = 'ink' | 'precision';

/** Seed. A string is converted to an integer stably (REQ-003). */
export type Seed = number | string;

/** Name of a registered ground, or a complete ground. */
export type GroundRef = GroundName | Ground;

/** Prepared substrates of the silverpoint ground (REQ-046). */
export type SubstrateName = 'cream' | 'green' | 'blue' | 'ochre';

/** Active item resolved by the interaction engine (REQ-140). */
export interface ActiveItem {
  readonly seriesKey: string;
  readonly index: number;
  readonly datum: Datum;
  readonly value: number;
  /** Coordinates in SVG space, not screen space. */
  readonly point: Readonly<{ x: number; y: number }>;
}
```

### 3.1 Geometry output

```ts
/** Stroke instruction. It carries no color: color comes from CSS (REQ-042). */
export interface Stroke {
  /** SVG path data, already rounded to 2 decimals (REQ-002). */
  readonly d: string;
  /** What this stroke is. Determines whether the Inker may touch it (REQ-022). */
  readonly role: 'encoding' | 'ornament' | 'hatch';
  /** Semantic paint slot; maps to a CSS variable in §10. */
  readonly part: StrokePart;
  /** Relative weight, resolved against the ground's token. */
  readonly weight?: number;
}

export type StrokePart =
  | 'ink' | 'ink-secondary' | 'heighten' | 'rule' | 'grid' | 'axis';

/** Everything a chart needs in order to draw itself. Serializable (REQ-011). */
export interface Geometry {
  readonly viewBox: Readonly<{ x: number; y: number; width: number; height: number }>;
  readonly strokes: readonly Stroke[];
  readonly labels: readonly TextLabel[];
  readonly hitAreas: readonly HitArea[];
}
```

> **Design decision.** `Stroke` carries no color as a direct consequence of Art. 8: since
> theming goes through CSS custom properties and in SVG `stroke="var(--x)"` does **not**
> resolve as a presentation attribute, color is applied by CSS from the `part` attribute.
> The `Inker` emits shape, never paint.

### 3.2 The `Inker` interface

```ts
export interface Inker {
  readonly name: string;
  /** Receives exact geometry and returns the inked geometry. */
  ink(geometry: Geometry, options: InkOptions): Geometry;
}

export interface InkOptions {
  readonly seed: number;
  readonly roughness: number;
  readonly bowing: number;
  readonly hatchAngle: number;
  readonly hatchGap: number;
  readonly fillWeight: number;
  /** Upper bound of nodes the Inker must not exceed. */
  readonly nodeBudget: number;
}

/** Returns the geometry untouched. `precision` mode is exactly this. */
export declare const NullInker: Inker;
```

An `Inker` SHALL honour two invariants, verified by test: it does not alter any `Stroke`
whose `role` is `'encoding'` beyond its intermediate path —the endpoints are preserved—
and it does not emit a `part` different from the one it received.

### 3.3 UI component types (feature-002)

```ts
export type UiSize = 'sm' | 'md' | 'lg';

/** Props every component takes (as CommonChartProps does for charts). */
export interface CommonUiProps {
  /** Frame variant and related ids derive from it (REQ-307, REQ-329). */
  id?: string;
  /** Overrides `id` for the frame variant only. */
  seed?: Seed;
  ground?: GroundRef;
  substrate?: SubstrateName;
  mode?: InkMode;
  /** Default `'md'`. */
  size?: UiSize;
  /** Colours over the ground's own, field by field (§3.4, REQ-460). */
  palette?: Palette;
  className?: string;
}

/** An item of Tabs, Segmented, RadioGroup (REQ-325: keys unique). */
export interface UiItem {
  key: string;
  label: string;
  disabled?: boolean;
}

export interface StepItem {
  key: string;
  title: string;
  description?: string;
  /** Derived from `current` when omitted; `'error'` must be explicit. */
  status?: 'wait' | 'process' | 'finish' | 'error';
}

/** Button emphasis. Not a tone: `tone` names only a level 1-4 of the ground's ramp (A-07). */
export type UiVariant = 'default' | 'primary' | 'danger';
export type AlertKind = 'info' | 'success' | 'warning' | 'error';
```

The status of one Steps item, `StepStatus`, is `'wait' | 'process' | 'finish' | 'error'`; a frame kind, `UiFrameKind`, is `'control' | 'pill' | 'box' | 'card' | 'round'`.

#### Per-component props (own props, beside `CommonUiProps`)

| Component | Props | Value / events |
|---|---|---|
| **Button** | `variant?: UiVariant` (`default`; `danger` also draws the exact ✕ glyph, REQ-310), `type?: 'button' \| 'submit' \| 'reset'` (`button`), `disabled?`, `label?` (accessible name for icon-only), `block?: boolean`, `href?` (renders `<a>`) | `onClick` / `@click` / `(click)` — native |
| **Input** | `label?` (its accessible name, when no `<label for>` names it), `type?: 'text' \| 'search' \| 'email' \| 'url' \| 'tel' \| 'password' \| 'number'`, `placeholder?`, `name?`, `disabled?`, `readOnly?`, `invalid?: boolean` (sets `aria-invalid="true"` and draws the exact ⚠ glyph), `message?: string` (help or error text under the control, `${id}--message`, referenced by `aria-describedby`; REQ-334), `prefix?`/`suffix?` (slots) | value: `string` |
| **Checkbox** | `label`, `name?`, `disabled?`, `indeterminate?: boolean` | value: `boolean` (`checked`) |
| **RadioGroup** | `items: UiItem[]`, `name` (required), `label` (group name), `orientation?: 'horizontal' \| 'vertical'` (`vertical`) | value: `string \| null` (a key) |
| **Switch** | `label`, `name?`, `disabled?` | value: `boolean` |
| **Slider** | `label`, `min?` (`0`), `max?` (`100`), `step?` (`1`), `name?`, `disabled?`, `marks?: number[]` | value: `number` |
| **Rate** | `label`, `count?` (`5`, 1..10; each mark an exact lozenge), `name?`, `disabled?`, `readOnly?` | value: `number` (0..count, integer) |
| **Segmented** | `items: UiItem[]`, `label`, `name?`, `block?` | value: `string` (a key) |
| **Tabs** | `items: UiItem[]`, `label?`, `orientation?` (`horizontal`), `activation?: 'automatic' \| 'manual'` (`automatic`) | value: `string` (the active key); panels are `TabPanel value="key"` children |
| **Steps** | `items: StepItem[]`, `current: number` (0-based), `orientation?` (`horizontal`), `label?` | — (display only in `0.3.0`) |
| **Card** | `title?`, `extra?` (slot), `footer?` (slot), `headingLevel?: 2..6` (`3`) | — |
| **Tag** | `tone?: 1 \| 2 \| 3 \| 4` (tonal level, `1`), `closable?: boolean`, `closeLabel?` (`'Remove'`) | `onClose` / `@close` / `(close)` |
| **Badge** | `count?: number`, `max?` (`99`), `dot?: boolean`, `label?` | — |
| **Divider** | `orientation?` (`horizontal`), `text?`, `align?: 'start' \| 'center' \| 'end'` (`center`) | — |
| **Progress** | `value?: number` (0..100; omitted → indeterminate), `shape?: 'line' \| 'circle'` (`line`), `label` (accessible name), `showValue?` (`true`) | — |
| **Alert** | `kind?: AlertKind` (`info`), `title?`, `closable?`, `closeLabel?` | `onClose` / `@close` / `(close)` |
| **Skeleton** | `lines?` (`3`, 1..8), `avatar?: boolean`, `label?` (`'Loading'`) | — |

**Value binding by framework** (REQ-322):

| | Controlled | Uncontrolled | Change |
|---|---|---|---|
| React | `value` (or `checked` for Checkbox/Switch) | `defaultValue` / `defaultChecked` | `onChange(value)` — the value, not the DOM event |
| Vue | `v-model` (`modelValue`) | omit `v-model`, `default-value` | `update:modelValue`, and `change` after commit (Slider: pointer up / key) |
| Angular | `[(value)]` (`model()` signal), or any forms directive through `ControlValueAccessor` (REQ-323) | `[defaultValue]` | `(valueChange)` |

**Values outside their domain** (Data Model §2.14). A number out of range or off step is clamped
and rounded with `SP017` (REQ-324). An unknown key is not a range error, and is corrected silently: RadioGroup falls back to `null`, Segmented and Tabs to their first enabled key, with no
diagnostic — a key that disappears from `items` is an ordinary state of dynamic data (A-06).

### 3.4 Palettes (feature-004)

On `@silverpoint/core/palettes` (§1.3); the two types are on the main entry as well.

```ts
/** Up to nine colours; unset fields keep the ground's own (REQ-460). Any CSS colour; checkPalette measures hex only. */
export interface Palette {
  readonly substrate?: string;
  readonly ink?: string;
  readonly inkSecondary?: string;
  readonly heighten?: string;
  readonly rule?: string;
  readonly grid?: string;
  readonly text?: string;
  readonly textMuted?: string;
  /** The UI focus ring; `ink` by default. */
  readonly focus?: string;
}

/** Field → custom property, in the fixed order of every emitted `style` (REQ-461). */
export const PALETTE_PROPERTIES: Readonly<Record<keyof Palette, `--sp-${string}`>>;
//  substrate → --sp-substrate, ink → --sp-ink, inkSecondary → --sp-ink-secondary, heighten → --sp-heighten,
//  rule → --sp-rule, grid → --sp-grid, text → --sp-text, textMuted → --sp-text-muted, focus → --sp-ui-focus-color

/** Field-wise merge, later wins; invalid fields dropped with SP024 (REQ-462, REQ-467). */
export function resolvePalette(...layers: readonly (Palette | undefined)[]): Palette | undefined;

/** `--sp-ink:#8A3A24;--sp-text:#4A2216` — the declarations of a palette, in PALETTE_PROPERTIES order; '' for none. */
export function paletteStyle(palette: Palette | undefined): string;

/** WCAG 2 contrast ratio of two hex colours (#rgb or #rrggbb), 1..21. */
export function contrastRatio(foreground: string, background: string): number;

export interface PaletteFinding {
  readonly pair: string;          // 'ink', 'rule', 'text/heighten', … (Data Model §3.9)
  readonly foreground: string;
  readonly background: string;
  readonly ratio: number;         // 2 decimals
  readonly threshold: number;
}
/** Every pair of Data Model §3.9 whose two colours are hex; `substrate` defaults to the palette's, else cream #EDE7DA. */
export function checkPalette(palette: Palette, substrate?: string): readonly PaletteFinding[];
```

`palette?: Palette` is a prop of `CommonChartProps`, `CommonUiProps`, `DashboardProps`,
`ProviderConfig` and `SpTimelineProps`. Presets are `Palette` objects; the prop takes the object,
not a name, so a chart that names no preset ships none (REQ-463, REQ-519). Reflex's string names
map to `PALETTES[name]` for consumers who want them.

*Amended in implementation:* `SP023` measures against the palette's own substrate, else
cream (the core does not know the ground's substrate colour at resolve time); `SP024`'s warning is
development-only, the dropping is not. A value is kept only if it is a CSS colour (an allowlist of
colour syntaxes, applied in `paletteStyle` as well), never a declaration fragment.

*Amended in implementation (DD-037):* `nestProvider(outer, own)` joins
`@silverpoint/core/palettes`: a nested provider's set fields win, the rest are inherited, palettes
merge field by field. Vue exports a `SilverpointProvider` component (props `ground`, `substrate`,
`mode`, `locale`, `palette`; renders its slot and no element) for sections. Angular's
`provideSilverpoint` returns a `Provider` instead of `EnvironmentProviders`, so it is accepted in a
component's `providers` as well as at bootstrap. A dashboard's root carries its own palette, not
the provider's. `ChartHandle.toSVGString()` writes the palette on its `<svg>`.

### 3.5 Composed components, overlays and the timeline (feature-004)

Own props, beside `CommonUiProps` (which includes `palette`). Names per adapter are in §1.3; the
markup contract is §7.4.

#### Composed components

| Component | Props | Value / events |
|---|---|---|
| **Surface** | `as?: string` (element, `div`), `name?: string` (adds `sp-<name>`), `frame?: UiFrameKind`, `tone?: UiToneLevel \| UiToneState` | — (content slot) |
| **Glyph** | `glyph: UiGlyph` | — |
| **Table** | `columns: readonly TableColumn[]`, `data: readonly Datum[]`, `caption?: string`, `sortKey?: string`, `sortOrder?: 'asc' \| 'desc'`, `striped?` (`false`), `hoverable?` (`true`), `bordered?` (`true`), `emptyText?` (`'No data'`), `rowKey?: string` | `sort(key)` — `onSort` / `@sort` / `(sort)` |
| **Pagination** | `total: number`, `pageSize?` (`10`), `siblings?` (`1`), `showTotal?` (`false`), `totalTemplate?` (`'{start}–{end} of {total}'`), `label?` (`'Pagination'`), `previousLabel?` (`'Previous page'`), `nextLabel?` (`'Next page'`), `pageLabel?` (`'Page'`), `disabled?` | value: `number` (`current`, 1-based) |
| **Breadcrumb** | `items: readonly { key?: string; label: string; href?: string }[]`, `label?` (`'Breadcrumb'`) | — |
| **Avatar** | `src?`, `name?`, `initials?`, `alt?`, `shape?: 'circle' \| 'square'` (`circle`), `pixelSize?: number` | — |
| **AvatarGroup** | `label?` | — (avatars as children) |
| **Statistic** | `title: string`, `value: string \| number` (printed as given), `prefix?`, `suffix?`, `trend?: 'up' \| 'down'`, `delta?: string` | — |
| **Descriptions** | `items: readonly { key?: string; label: string; value: string }[]`, `title?`, `columns?` (`3`, 1..6), `bordered?` (`true`), `headingLevel?` (`3`) | — |
| **TimelineList** | `items: readonly TimelineListItem[]`, `label?` | — |
| **Collapse** | `accordion?` (`false`), `bordered?` (`true`) | — (`SpCollapseItem` children) |
| **CollapseItem** | `title: string`, `defaultOpen?`, `open?`, `disabled?` | `toggle(open: boolean)` |
| **Empty** | `description?` (`'No data'`) | — (`extra` slot: actions) |
| **Result** | `status?: 'success' \| 'info' \| 'warning' \| 'error'` (`info`), `title: string`, `subtitle?`, `headingLevel?` (`3`) | — (`extra` slot) |
| **Textarea** | `rows?` (`3`), `placeholder?`, `label?`, `message?`, `invalid?`, `disabled?`, `readOnly?`, `maxLength?`, `showCount?` (`false`), `name?` | value: `string` |
| **InputNumber** | `min?`, `max?`, `step?` (`1`), `precision?: number` (decimals), `placeholder?`, `label?`, `message?`, `invalid?`, `disabled?`, `readOnly?`, `name?`, `decrementLabel?` (`'Decrease'`), `incrementLabel?` (`'Increase'`) | value: `number \| null` |

```ts
export interface TableColumn {
  readonly key: string;
  readonly title?: string;               // the key when omitted
  readonly align?: 'start' | 'center' | 'end';
  readonly sortable?: boolean;
  /** CSS length; written as an inline width on the header cell. */
  readonly width?: string;
}
export interface TimelineListItem {
  readonly key?: string;
  readonly title: string;
  readonly time?: string;
  readonly description?: string;
  readonly status?: 'done' | 'current' | 'pending' | 'error';   // 'done' by default
}
```

*Amended in implementation:* `SpSurface`'s `as` and `name` must be lowercase idents
(`script`, `style`, `iframe`, `object`, `embed`, `template` and `noscript` are refused), and a
`TableColumn.width` a plain length (`px`, `%`, `em`, `rem`, `ch`, `vw`); anything else is dropped
with `SP017`. The table draws its rows as given: the consumer sorts (`uiSortRows`, DD-040), so
paging works. Optional keys (Breadcrumb, Descriptions, TimelineList) are deduplicated only when
given. A link's `href` (Breadcrumb, as `SpButton`'s) keeps only relative URLs and the `http`,
`https`, `mailto` and `tel` schemes; any other is dropped with `SP017`.

#### Overlays

| Component | Props | Value / events |
|---|---|---|
| **Modal** | `title?`, `description?`, `label?` (accessible name without title), `closable?` (`true`), `closeLabel?` (`'Close'`), `width?: string` (`'520px'`), `dismissible?` (`true`: Escape and backdrop click close it) | open: `boolean`; slots `trigger`, `content`, `footer` |
| **Drawer** | as Modal, plus `side?: 'start' \| 'end' \| 'top' \| 'bottom'` (`end`), `extent?: string` (`'380px'` / `'320px'`), `modal?` (`true`) | open: `boolean` |
| **Popover** | `title?`, `label?`, `side?: 'top' \| 'end' \| 'bottom' \| 'start'` (`bottom`), `align?: 'start' \| 'center' \| 'end'` (`center`), `offset?` (`6`), `closable?` (`false`), `width?` (`'320px'`) | open: `boolean`; slots `trigger`, `content` |
| **Tooltip** | `text: string`, `side?` (`top`), `align?` (`center`), `offset?` (`6`), `delay?` (`300` ms) | open: `boolean`; slot `trigger` (the described element) |
| **Select** | `items: readonly (string \| UiItem)[]`, `placeholder?` (`'Select…'`), `label: string`, `disabled?`, `required?`, `name?`, `width?` (`'180px'`) | value: `string \| null`; open: `boolean` |
| **DropdownMenu** | `items: readonly MenuEntry[]`, `label: string` (the trigger's text when no trigger slot), `side?` (`bottom`), `align?` (`start`) | `select(key)`; open: `boolean`; slot `trigger` |
| **Toast** | `title: string`, `description?`, `kind?: 'info' \| 'success' \| 'warning' \| 'error'` (`info`), `duration?` (the toaster's), `closeLabel?` (`'Dismiss'`) | open: `boolean`; slot `action` |
| **Toaster** | `position?: 'bottom-end' \| 'bottom-start' \| 'top-end' \| 'top-start'` (`bottom-end`), `duration?` (`5000`), `label?` (`'Notifications'`) | — (`SpToast` children) |

```ts
export type MenuEntry =
  | { readonly key: string; readonly label: string; readonly shortcut?: string; readonly disabled?: boolean; readonly danger?: boolean }
  | { readonly type: 'separator'; readonly key: string }
  | { readonly type: 'label'; readonly key: string; readonly label: string };
```

Reflex's `left`/`right` become `start`/`end` (REQ-523: logical sides mirror in RTL). A Select's
`required` sets `aria-required="true"` (and, in Angular, the `required` validator through the CVA):
its hidden input is not validated by the browser.

**Open-state binding** (REQ-500), as value binding (REQ-322):

| | Controlled | Uncontrolled | Change |
|---|---|---|---|
| React | `open` | `defaultOpen` | `onOpenChange(open)` |
| Vue | `v-model:open` | `default-open` | `update:open` |
| Angular | `[(open)]` (`model()`) | `[defaultOpen]` | `(openChange)` |

Value binding of Pagination, Textarea, InputNumber and Select follows REQ-322 (`current` for
Pagination: React `current`/`defaultCurrent`/`onChange`, Vue `v-model:current`, Angular `[(current)]`).
*Amended in implementation:* an InputNumber reports what is typed on commit (blur or Enter;
`change` in Vue and Angular), clamped and rounded by `uiNumberValue`, `null` when emptied; its steppers
report `uiNumberStep` at once. Clamping on every keystroke would rewrite a value mid-typing.

#### The timeline

| Component | Props | Events |
|---|---|---|
| **Timeline** | `data: TimelineData` (TimelineJS JSON: `title`, `events`, `eras`, `scale`), `options?: Record<string, unknown>` (`font`, `theme` ignored), `height?: string` (`'600px'`), `inkedFrames?` (`true`), `card?` (`true`), `label?` (accessible name of the region) | `change(uniqueId)`, `loaded(payload)`, `navNext`, `navPrevious`, `zoomIn`, `zoomOut`, `backToStart`; slot `fallback` |

*Amended in implementation:* the region's name is `label`, else the title's headline, else
`SP018`; a `height` that is not a plain length is dropped with `SP017` and `600px` holds.

*Amended in implementation:* in each framework's idiom, the events are React's `onChange`,
`onLoaded`, `onNavNext`, `onNavPrevious`, `onZoomIn`, `onZoomOut` and `onBackToStart` props, Vue's
emits and Angular's outputs, under the names above; the fallback is React's `fallback` prop, Vue's
`fallback` slot and Angular's `<ng-template spFallback>` (`SpTimelineFallback`, exported from the
`timeline` entry). `fallback` joins the core's `UiSlot`; `timelineView` takes `{ failed }` and puts
the slot in the mount once a load has failed, never on the server. TimelineJS is built again when
`data`, `options` or `inkedFrames` change.

*Amended in implementation:* TimelineJS is built in a `<div>` of its own inside the mount,
since it rewrites its container's `className` (`tl-timeline`), and on a copy of `data`
(`structuredClone`), since it writes each slide's `unique_id` into the data it is given: the
consumer's object is never touched, and a frozen one (`TIMELINE_DEMO`) does not stop the build. An
error thrown while TimelineJS is built is a failed load (REQ-515): its container is removed, `SP025`
is warned and the fallback is shown. TimelineJS 3.9.13 has no destroy method: the cleanup removes its
DOM, but its listeners on `document` (keydown) and `window` (resize) stay until the page goes.

## 4. Naming conventions

| Scope | Convention | Example |
|---|---|---|
| React component | `PascalCase`, no prefix | `<LineChart>` |
| Angular selector | `sp-` plus `kebab-case` | `<sp-line-chart>` |
| Vue component | `Sp` plus `PascalCase`; `sp-` plus `kebab-case` in in-DOM templates | `<SpLineChart>` |
| Props and inputs | `camelCase`, identical across all three adapters | `valueKey` |
| Accessors | `Key` suffix when they accept a string | `xKey`, `valueKey` |
| Subpath | `kebab-case` of the component | `@silverpoint/react/line-chart` |
| CSS custom property | `--sp-` plus `kebab-case` | `--sp-ink-secondary` |
| Part attribute | `part="sp-<part>"` | `part="sp-heighten"` |
| Diagnostic code | `SP` plus three digits | `SP001` |

Prop names are **identical** across React, Angular and Vue. It is a maintenance requirement:
the documentation is a single one, and the Art. 3 gate compares two trees that can only
match if the input is the same.

## 5. Props common to every chart

Present in all 33 charts, with identical names across React, Vue and Angular (REQ-094).

```ts
export interface CommonChartProps {
  /**
   * Rows to draw. If omitted, the demo dataset is rendered (REQ-093): accessor props
   * (`…Key`, `keys`, `names`) are ignored, every other prop applies (REQ-098).
   */
  data?: readonly Datum[];

  /** Style ground. Defaults to the app provider's, or `silverpoint`. */
  ground?: GroundRef;
  /** Prepared substrate within the ground (REQ-046). */
  substrate?: SubstrateName;
  /** `ink` by default; `precision` disables inking (REQ-021). */
  mode?: InkMode;
  /** Seed. If omitted, it is derived from `id` stably (REQ-003). */
  seed?: Seed;
  /** Colours over the ground's own, field by field (§3.4, REQ-460). */
  palette?: Palette;

  /** Stable identifier. If omitted, it is generated deterministically. */
  id?: string;
  /** Height of the drawing area in px. Width is the container's unless pinned. */
  height?: number;
  width?: number;

  /** `card` draws the full frame; `bare` only the drawing area (REQ-095). */
  chrome?: 'card' | 'bare';
  /**
   * How areas are filled (REQ-029).
   * `tile` shares one hatch tile per tonal level: it is the default and the one that
   * keeps weight bounded. `per-shape` traces the hatching shape by shape, with more
   * variation and much more weight; meant for a hero chart or for export.
   */
  hatchFill?: 'tile' | 'per-shape';
  title?: string;
  badge?: string;
  value?: string | number;
  unit?: string;
  footerLeft?: string;
  footerRight?: string;

  /** Accessible name. If omitted, it is derived from `title` (REQ-120). */
  label?: string;
  /** Long description for screen readers (REQ-120). */
  description?: string;
  /** Tabular alternative; `hidden` leaves it for assistive technology only (REQ-121). */
  dataTable?: 'visible' | 'hidden' | 'none';

  locale?: string;
  numberFormat?: Intl.NumberFormatOptions;

  className?: string;
}
```

### 5.1 Default values

Part of the contract: changing them observably is a *major* change (§13).

| Prop | Default | Note |
|---|---|---|
| `ground` | `'silverpoint'` | Or the application provider's, if there is one |
| `substrate` | `'cream'` | |
| `mode` | `'ink'` | Unless the media query forces `precision` |
| `seed` | derived from `id` | Stable across renders (REQ-003) |
| `id` | generated deterministically | From the chart name and its mount position |
| `chrome` | `'card'` | |
| `hatchFill` | `'tile'` | `'per-shape'` multiplies path weight by a factor of 10 to 40 |
| `dataTable` | `'hidden'` | Present for assistive technology, visually hidden |
| `height` | `160` | Drawing area, without the frame |
| `width` | container width | Except in the server entry points, where it is mandatory |
| `locale` | the provider's, else `'en'` | Identical on server and client, so hydration matches; pass `navigator.language` to the provider to follow the browser |
| `curve` | `'monotone'` | Line and area charts |
| `orientation` | `'columns'` | `BarChart` |
| `series` | `'all'` | `LineChart` |
| `showLine` | `true` | `ComposedChart` |
| `stacked` | `false` | `StreamChart` |
| `legend` | `true` | `DonutChart` |
| `sizeRange` | `[60, 240]` | `ScatterChart`; `[100, 500]` in `BubbleChart` |

UI components add (`CommonUiProps`, §3.3):

| Prop | Default | Note |
|---|---|---|
| `size` | `'md'` | Heights from the ground's `ui.controlHeight` (Data Model §3.8) |
| `mode` | from provider, else `'ink'` | `precision` forced by REQ-123, after resolution |
| Frame variant | `0` without `seed` and `id` | So an anonymous component renders the same in every adapter |

Palettes, overlays and the timeline add (feature-004):

| Prop | Default | Note |
|---|---|---|
| `palette` | none | The ground's own colours |
| overlay `open` | `false` | `defaultOpen` sets the uncontrolled initial state |
| `SpToaster` `duration` | `5000` ms | A toast's own `duration` wins |
| `SpTimeline` `height` | `'600px'` | |

**Palette precedence** (REQ-462): element → dashboard → provider, field by field (`resolvePalette`;
nested providers merge through `nestProvider`, §3.4). A palette does not take part in the
`precision` override: forced `precision` changes the mode, never the colours, and
`forced-colors: active` is the browser's.

The **resolution precedence** below (REQ-311) is the charts' own: component prop → dashboard → provider →
library default, with the media-query `precision` override applied after resolution. A component
inside a dashboard cell reads the dashboard's configuration exactly as a chart does; it gets no cell
box (a component sizes to its content).

**Resolution precedence** for `ground`, `substrate`, `mode` and `locale`, highest to lowest:
chart prop → dashboard (§7.1) → application provider (§8.1, §8.2) → library default value.
The media query forcing `precision` (REQ-123) is **not a level in that chain**: it is an
override applied after resolution, so no prop, dashboard or provider can undo it. It is an
accessibility requirement, not a preference.

## 6. Token schema of a ground

```ts
export interface Ground {
  readonly name: string;
  /** How it builds tonal value. `wash` is the anticipated exception to Art. 6. */
  readonly tonalMechanism: 'hatch' | 'weight' | 'wash';
  /** Name of the registered Inker that inks it. */
  readonly inker: string;

  readonly substrates: Readonly<Record<string, string>>;
  readonly ink: Readonly<{
    primary: string;
    secondary: string;
    heighten: string;
    rule: string;
    grid: string;
    text: string;
    textMuted: string;
  }>;

  readonly inkOptions: Omit<InkOptions, 'seed' | 'nodeBudget'>;
  /** Hatch density bound, to stay within the node budget. */
  readonly maxHatchDensity: number;
  /** Tonal levels 1-4: hatch steps under `hatch`, stroke-width multipliers under `weight`. */
  readonly tonalRamp: Readonly<Record<1 | 2 | 3 | 4, ToneSpec>>;

  readonly typography: Readonly<{ display: string; mono: string; scale: number }>;
  /** What to draw when there is no data (REQ-007). */
  readonly emptyState: Readonly<{ text: string; rule: boolean }>;
  /** Expansion of degenerate domains (REQ-010). */
  readonly domainPadding: number;
  /** Tokens of the UI components (Data Model §3.8); optional, defaults apply. */
  readonly ui?: UiTokens;
}

export interface UiTokens {
  /** `inked`: build-time pieces laid as masks (DD-022). `css`: an exact border. */
  readonly frame: 'inked' | 'css';
  /** Frame variants generated per kind, 1..6. */
  readonly frameVariants: number;
  /** Control heights in px per size, each ≥ 24 (REQ-317). */
  readonly controlHeight: Readonly<{ sm: number; md: number; lg: number }>;
  /** Corner radius of the exact frame (`precision`, `css`), px. */
  readonly radius: number;
  /** Focus indicator width, px, ≥ 2 (REQ-316). */
  readonly focusWidth: number;
  /** Tonal level per state (DD-026); `alertError` fills an error Alert's box. */
  readonly tone: Readonly<{ selected: ToneStep; primary: ToneStep; danger: ToneStep; disabled: ToneStep; alertError: ToneStep }>;
  /** Tonal level of the hatched backdrop behind a modal overlay (REQ-499). Default `2`. */
  readonly backdrop?: ToneStep;
  /** Level of a table's striped and hovered rows (REQ-475). Default `1`. */
  readonly rowTone?: ToneStep;
}
```

`backdrop` and `rowTone` (feature-004, Data Model §3.8) are optional: `resolveUiTokens` supplies 2
and 1, so a ground written before them needs no change (REQ-044, REQ-312), and the built-in grounds
do not declare them. *Amended in implementation:* `backdrop` is the level of the **hatched**
backdrop; where the backdrop is not hatched —a `weight` ground, `precision`— it is the opaque
substrate, whatever the level. A palette (§3.4) overrides a ground's colours, never its tokens.

```ts
export type ToneSpec =
  | { readonly style: 'hachure' | 'cross-hatch'; readonly gap: number; readonly angle: number }
  /** A `weight` ground: the stroke width of a toned shape's outline, times `--sp-stroke-width`. */
  | { readonly style: 'weight'; readonly weight: number };
```

**Built-in grounds.** `@silverpoint/grounds` registers two, and exports both with their inkers:

| Ground | `tonalMechanism` | Inker | Substrates | Data Model |
|---|---|---|---|---|
| `silverpoint` (default) | `hatch` | `RoughInker` (`'rough'`) | `cream`, `green`, `blue`, `ochre` | §3.1–§3.6 |
| `cyanotype` | `weight` | `WeightInker` (`'weight'`) | `prussian` | §3.7 |

A ground with a single substrate paints it whatever `substrate` names, so `ground="cyanotype"`
needs no `substrate`.

Registering a ground is a declarative call, and it does not touch the code of any chart
(REQ-044):

```ts
import { registerGround } from '@silverpoint/grounds';
registerGround(myGround);
```

## 7. Component catalog

The 33 charts of the first catalog; the 27 of the second are in §7.3. The `REQ` column is the
traceability back to the PRD. All of them accept `CommonChartProps` in addition to their own props.

| REQ | React | Vue | Angular selector | Own props |
|---|---|---|---|---|
| REQ-060 | `LineChart` | `SpLineChart` | `sp-line-chart` | `xKey`, `valueKey`, `secondaryKey?`, `curve`, `series` |
| REQ-061 | `StepChart` | `SpStepChart` | `sp-step-chart` | `xKey`, `valueKey`, `step: 'after' \| 'before' \| 'middle'` |
| REQ-062 | `SparklineRows` | `SpSparklineRows` | `sp-sparkline-rows` | `rows`, `nameKey`, `readoutKey`, `seriesKey`, `pointKey` |
| REQ-063 | `KpiCard` | `SpKpiCard` | `sp-kpi-card` | `valueKey`, `metric`, `delta`, `deltaTone` |
| REQ-064 | `BarChart` | `SpBarChart` | `sp-bar-chart` | `xKey`, `valueKey`, `secondaryKey?`, `orientation: 'columns' \| 'rows'` |
| REQ-065 | `StackedBarChart` | `SpStackedBarChart` | `sp-stacked-bar-chart` | `xKey`, `keys`, `names?` |
| REQ-066 | `ComposedChart` | `SpComposedChart` | `sp-composed-chart` | `xKey`, `barKey`, `lineKey`, `showLine` |
| REQ-067 | `WaterfallChart` | `SpWaterfallChart` | `sp-waterfall-chart` | `stepKey`, `baseKey`, `deltaKey` |
| REQ-068 | `FunnelChart` | `SpFunnelChart` | `sp-funnel-chart` | `stageKey`, `valueKey` |
| REQ-069 | `BulletChart` | `SpBulletChart` | `sp-bullet-chart` | `titleKey`, `actualKey`, `targetKey` |
| REQ-070 | `PyramidChart` | `SpPyramidChart` | `sp-pyramid-chart` | `labelKey`, `widthKey`, `toneKey?` |
| REQ-071 | `CandlestickChart` | `SpCandlestickChart` | `sp-candlestick-chart` | `timeKey`, `openKey`, `highKey`, `lowKey`, `closeKey`, `bounds?` |
| REQ-072 | `AreaChart` | `SpAreaChart` | `sp-area-chart` | `xKey`, `valueKey`, `curve` |
| REQ-073 | `RangeBandChart` | `SpRangeBandChart` | `sp-range-band-chart` | `xKey`, `lowKey`, `highKey` |
| REQ-074 | `StreamChart` | `SpStreamChart` | `sp-stream-chart` | `xKey`, `keys`, `stacked` |
| REQ-075 | `DonutChart` | `SpDonutChart` | `sp-donut-chart` | `nameKey`, `valueKey`, `centerValue?`, `centerLabel?`, `legend` |
| REQ-076 | `RadarChart` | `SpRadarChart` | `sp-radar-chart` | `subjectKey`, `valueKey`, `domain` |
| REQ-077 | `PolarBarChart` | `SpPolarBarChart` | `sp-polar-bar-chart` | `nameKey`, `valueKey` |
| REQ-078 | `RadialArcGroup` | `SpRadialArcGroup` | `sp-radial-arc-group` | `nameKey`, `valueKey` |
| REQ-079 | `RadialRings` | `SpRadialRings` | `sp-radial-rings` | `nameKey`, `valueKey` |
| REQ-080 | `GaugeArc` | `SpGaugeArc` | `sp-gauge-arc` | `percent`, `caption?`, `readout?` |
| REQ-081 | `MeterChart` | `SpMeterChart` | `sp-meter-chart` | `percent`, `caption?`, `readout?` |
| REQ-082 | `ScatterChart` | `SpScatterChart` | `sp-scatter-chart` | `xKey`, `yKey`, `sizeKey?`, `sizeRange` |
| REQ-083 | `BubbleChart` | `SpBubbleChart` | `sp-bubble-chart` | `xKey`, `yKey`, `sizeKey`, `sizeRange` |
| REQ-084 | `HeatmapChart` | `SpHeatmapChart` | `sp-heatmap-chart` | `labelKey`, `valuesKey`, `scaleMax`, `columnLabels?` |
| REQ-085 | `TreemapChart` | `SpTreemapChart` | `sp-treemap-chart` | `labelKey`, `shareKey`, `columns`, `rows` |
| REQ-086 | `SankeyChart` | `SpSankeyChart` | `sp-sankey-chart` | `sourceKey`, `targetKey`, `valueKey` |
| REQ-087 | `ActivityGrid` | `SpActivityGrid` | `sp-activity-grid` | `dateKey`, `countKey`, `levelKey`, `weeks` |
| REQ-088 | `CoxcombChart` | `SpCoxcombChart` | `sp-coxcomb-chart` | `nameKey`, `valueKey`, `startAngle` |
| REQ-089 | `WindRose` | `SpWindRose` | `sp-wind-rose` | `bearingKey`, `valueKey`, `sectors`, `bins` |
| REQ-090 | `VolvelleChart` | `SpVolvelleChart` | `sp-volvelle-chart` | `rings`, `indexRing`, `indexValue` (they apply to the demo's rings too, REQ-098) |
| REQ-091 | `ChordRing` | `SpChordRing` | `sp-chord-ring` | `sourceKey`, `targetKey`, `valueKey`, `maxCategories` |
| REQ-092 | `OrbitChart` | `SpOrbitChart` | `sp-orbit-chart` | `orbits`, `periodKey`, `markerKey` |

Own props that the table leaves implicit:

- **`HeatmapChart.columnLabels?: readonly string[]`** names the columns in order; they head the
  table columns, the keyboard announcement and the readout, and are drawn above the cells.
  Missing names fall back to `#k`; names beyond the drawn columns are ignored with `SP002`.
- **`OrbitChart`**: `data` holds the orbit rows (Data Model §2.10); `orbits` caps the orbits
  shown, from the inside out; `markerKey` reads a row's markers (default `'markers'`) and
  `periodKey` a marker's period (default `'period'`, 0-1 over the cycle).
- **`VolvelleChart`**: `data` holds the rings from the inside out (Data Model §2.12); `rings`
  caps them; `indexRing` (0-based, default 0) and `indexValue` (default: that ring's first
  segment) choose the index angle. Without `data` they address the demo's rings `Day`, `Shift`,
  `Team` (REQ-098).

### 7.1 Composition: Dashboard

| REQ | React | Vue | Angular selector | Own props |
|---|---|---|---|---|
| REQ-200 | `Dashboard` | `SpDashboard` | `sp-dashboard` | `DashboardProps` |
| REQ-200 | `DashboardCell` | `SpDashboardCell` | `sp-dashboard-cell` | `cell?` |

A declarative grid of cards (PRD §6.10). Charts are children; the layout is a data-only object
matched to children by cell id (DD-013). It is not a builder: there are no placement
coordinates, no `order`, no drag or resize.

**Types** (public):

```ts
/** The three container breakpoints; their widths are fixed (TD DD-014). */
export type DashboardBreakpoint = 'sm' | 'md' | 'lg';

/** A value that may differ per breakpoint; a bare number applies to all three. */
export type PerBreakpoint<T> = T | Partial<Record<DashboardBreakpoint, T>>;

/** Serialisable layout (REQ-201). No functions, no DOM, no chart references. */
export interface DashboardLayout {
  /** Columns per breakpoint. Default `{ sm: 1, md: 2, lg: 4 }` (REQ-208). */
  columns?: PerBreakpoint<number>;
  /** Height of one row unit, in px, card chrome included. Default `240`. */
  rowHeight?: number;
  /** Gap between cells, in px. Default `16`. */
  gap?: number;
  /** Cells in reading order (REQ-203). Omitted: every child, span 1. */
  cells?: readonly DashboardCellLayout[];
}

export interface DashboardCellLayout {
  /** Matches `DashboardCell`'s `cell` prop; unique within the dashboard (REQ-205). */
  id: string;
  /** Default `1`. Clamped to the breakpoint's columns with `SP014` (REQ-204). */
  colSpan?: PerBreakpoint<number>;
  /** Default `1`. */
  rowSpan?: PerBreakpoint<number>;
}

/** Link on a category key across the dashboard's charts (REQ-216). */
export interface DashboardLink {
  /** The datum field whose value is matched, e.g. `'hour'`. */
  key: string;
}

/** Name is required by the type: `title` or `label` (REQ-214). */
type DashboardName = { title: string; label?: string } | { title?: undefined; label: string };

export type DashboardProps = DashboardName & {
  /** Stable identifier; seeds of unnamed charts derive from it (REQ-209). Required. */
  id: string;
  layout?: DashboardLayout;
  /** Long description, exposed as the region's description (REQ-214). */
  description?: string;
  /** Heading level of `title`. Default `2`. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Width in px used for nominal cell boxes on the server and at hydration (REQ-207). Default `1200`. */
  ssrWidth?: number;
  /** Linked interaction (REQ-216); client entry points only. */
  link?: DashboardLink;

  /** Inherited by every chart inside, below the chart's own prop (REQ-212). */
  ground?: GroundRef;
  substrate?: SubstrateName;
  mode?: InkMode;
  locale?: string;
  /** Below the chart's own `palette`, above the provider's, field by field (REQ-462). */
  palette?: Palette;

  className?: string;
};

export interface DashboardCellProps {
  /** The layout cell this child fills. Omitted: next in source order, span 1. */
  cell?: string;
}
```

**`id` is required.** Charts may omit theirs because a single chart's derived id is harmless; in a
dashboard, every unnamed chart's seed hangs off this id (REQ-209), so it must be stable and chosen
by the consumer.

**`id` is required.** Every unnamed chart's seed hangs off it (REQ-209), so it must be stable
and chosen by the consumer. **`title` or `label` is required** by the type (REQ-214).

**Resolved model** (internal surface, §2):

```ts
export interface DashboardModel {
  readonly id: string;
  /** In reading order. */
  readonly cells: readonly ResolvedCell[];
  /** The CSS custom properties of the wrapper, e.g. `--sp-dashboard-columns-md: 2`. */
  readonly style: Readonly<Record<string, string>>;
}

export interface ResolvedCell {
  /** The layout cell's id; for a child placed in source order, its source index. */
  readonly id: string;
  /** The child this cell holds, as its index in `childCells`, so the adapter emits it here (I-11). */
  readonly child: number;
  /** Derived chart id: `${dashboard.id}--${cell.id}` (REQ-209). */
  readonly chartId: string;
  readonly span: Readonly<Record<DashboardBreakpoint, { col: number; row: number }>>;
  /** Outer box at `ssrWidth`, 2 decimals (REQ-002, REQ-206). */
  readonly nominal: { readonly width: number; readonly height: number };
  /** The cell's CSS custom properties, e.g. `--sp-cell-col-lg: 2`. */
  readonly style: Readonly<Record<string, string>>;
}

/** Pure; emits SP014 / SP015 through the diagnostics channel. */
export function resolveDashboard(props: DashboardProps, childCells: readonly (string | undefined)[]): DashboardModel;

/** The chart's width and drawing-area height inside a cell box, card chrome subtracted (REQ-206). */
/** `recipe`, when given, is built at a probe height to measure chrome the recipe adds itself (KpiCard's value line). */
export function cellChartBox<P extends CommonChartProps>(cell: { width: number; height: number }, chartProps: P, recipe?: ChartRecipe<P>): { width: number; height: number };

/** Items of `model` whose datum carries `value` under `key` (REQ-216, REQ-217). */
export function linkedItems(model: ChartModel, key: string, value: unknown): readonly number[];

/** What a cell hands its chart: plain data, so it crosses an RSC boundary as a prop (TD §3.3). */
export interface DashboardCellContext {
  readonly chartId: string;
  readonly box: { readonly width: number; readonly height: number };
  readonly config: Readonly<ProviderConfig>;
}

/** Every attribute, text and cell an adapter writes, from `resolveDashboard` (Art. 2). */
export function dashboardView(props: DashboardProps, children: readonly { cell?: string; id?: string }[]): DashboardView;

/** A chart's props inside a cell (size and config precedence) and its width until measured. */
export function inCell<P extends CommonChartProps>(props: P, cell: DashboardCellContext | undefined, recipe: ChartRecipe<P>): { props: P; width: number | undefined };
```

`childCells` is the `cell` prop of each child in source order — the only thing an adapter reads
from its children, and something every framework can read synchronously during render.

**Default values** (part of the contract, like §5.1):

| Prop | Default | Note |
|---|---|---|
| `layout.columns` | `{ sm: 1, md: 2, lg: 4 }` | Collapses 4 → 2 → 1 (REQ-208) |
| `layout.rowHeight` | `240` | 160 drawing area + the default card chrome, rounded up |
| `layout.gap` | `16` | |
| `colSpan`, `rowSpan` | `1` | |
| `headingLevel` | `2` | |
| `ssrWidth` | `1200` | Nominal boxes use the breakpoint `ssrWidth` falls in: `lg` at ≥ 1024, `md` at 640–1023, `sm` below (DD-015) |

**Size precedence** of a chart inside a cell: its own `width`/`height` → the cell box from
`cellChartBox` → the chart defaults.

**By adapter.** React:

```tsx
import { Dashboard, DashboardCell } from '@silverpoint/react/dashboard';
import { KpiCard } from '@silverpoint/react/kpi-card';
import { LineChart } from '@silverpoint/react/line-chart';
import { BarChart } from '@silverpoint/react/bar-chart';

const layout = {
  columns: { sm: 1, md: 2, lg: 4 },
  cells: [
    { id: 'revenue' }, { id: 'users' }, { id: 'churn' }, { id: 'nps' },
    { id: 'traffic', colSpan: { md: 2, lg: 3 }, rowSpan: 2 },
    { id: 'errors' },
  ],
} satisfies DashboardLayout;

<Dashboard id="ops" title="Operations" layout={layout} link={{ key: 'hour' }}>
  <DashboardCell cell="revenue"><KpiCard title="Revenue" … /></DashboardCell>
  …
  <DashboardCell cell="traffic"><LineChart data={rows} xKey="hour" valueKey="hits" title="Traffic" /></DashboardCell>
  <DashboardCell cell="errors"><BarChart data={errs} xKey="hour" valueKey="count" title="Errors" /></DashboardCell>
</Dashboard>
```

`Dashboard` from `/server/dashboard` renders with no client JavaScript and rejects `link` by
type. The client `Dashboard` renders a `"use client"` link boundary only when `link` is given
(REQ-104 holds: no link, no client boundary).

Vue:

```vue
<SpDashboard id="ops" title="Operations" :layout="layout" :link="{ key: 'hour' }">
  <SpDashboardCell cell="traffic"><SpLineChart … /></SpDashboardCell>
</SpDashboard>
```

Angular — signal inputs, `OnPush`, standalone (REQ-101); cell ids are read from
`contentChildren`, available during server rendering. Signal inputs cannot say "`title` or
`label`", so where React and Vue reject a nameless dashboard by type, `sp-dashboard` warns `SP002`
(REQ-214); `id` is a required input. Each `sp-dashboard-cell` keeps its content in a template the
dashboard instantiates inside the cell's `article`, in reading order:

```html
<sp-dashboard id="ops" title="Operations" [layout]="layout" [link]="{ key: 'hour' }">
  <sp-dashboard-cell cell="traffic"><sp-line-chart … /></sp-dashboard-cell>
</sp-dashboard>
```

### 7.2 UI component catalog (feature-002)

17 components (REQ-300..334): `Button`, `Input`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `Rate`, `Segmented`, `Tabs`, `Steps`, `Card`, `Tag`, `Badge`, `Divider`, `Progress`, `Alert`, `Skeleton`. Each takes `CommonUiProps` (§3.3) and the own props of §3.3; names per adapter are in §1.2. The core catalog `UI_COMPONENTS` lists them (name, slug, component, group, states). The 21 composed components and overlays of feature-004 and `SpTimeline` are in §7.4; what this section states of every component holds for them too.

#### Markup contract (normative; parity is checked on it, REQ-327)

Every component root carries `class="sp-ui sp-<name> sp-ground-<ground>"` (the ground class, as a
chart root and a dashboard carry it, is what `styles.css` hangs the `--sp-` palette on),
`data-ground`, `data-substrate`, `data-mode`, `data-size` and, when inked, `data-frame="0..3"`;
with a palette (§3.4), `style` holds `paletteStyle(...)` followed by any style the component
computes and the consumer's own (REQ-461).
Drawn pieces are `aria-hidden` elements with a `part`; an `sp-frame` names its shape with
`data-kind` (`control`, `pill`, `box`, `card`, `round`), an `sp-tone` its level with `data-tone`
(1-4) and its shape with `data-kind`. A native input hidden for sight carries `class="sp-ui-native"`,
the label of one item of a composite `class="sp-ui-item"`, and text over a tone sits in an
`sp-ui-plate`. `ui.css` is written against these names (grounds `src/ui/ui-css.ts`):

| Component | Root | Native / semantic core | Drawn parts |
|---|---|---|---|
| Button | `<button>` (or `<a>` with `href`) | itself | `sp-frame`, `sp-tone` (for `primary`/`danger`), `sp-mark` (✕ glyph, exact, for `danger`) |
| Input | `<span class="sp-ui sp-input">` | `<input>` (`aria-invalid`, `aria-describedby` when `message`), then `<span id="${id}--message">` | `sp-frame`, `sp-mark` (⚠ glyph, exact, when `invalid`) |
| Checkbox | `<label>` | `<input type="checkbox">` visually hidden | `sp-frame` (box), `sp-mark` (tick or dash, exact), `sp-tone` |
| RadioGroup | `<fieldset>` + `<legend>` | `<input type="radio">` per item | per item `sp-frame`, `sp-mark` (dot, exact) |
| Switch | `<label>` | `<input type="checkbox" role="switch">` | `sp-frame` (track), `sp-knob` (exact), `sp-tone` |
| Slider | `<label>` | `<input type="range">` over the drawing | `sp-track`, `sp-fill` (exact length), `sp-thumb` (exact, heightened), `sp-mark` |
| Rate | `<fieldset>` | `<input type="radio">` per value 1..count | per item `sp-mark` (exact lozenge), `sp-tone` when filled |
| Segmented | `<fieldset>` | `<input type="radio">` per item | `sp-frame`, `sp-tone` + `sp-heighten` on the selected |
| Tabs | `<div>` | `role="tablist"` of `<button role="tab">`, `role="tabpanel"` | `sp-rule`, `sp-heighten` on the active tab |
| Steps | `<ol>` | `<li aria-current="step">` on current | `sp-mark` per step (exact), `sp-connector` (exact) with `data-status` (`wait` connectors are dashed, the others solid), `sp-heighten` on current |
| Card | `<article>` (`<section>` without title) | heading at `headingLevel` | `sp-frame`, `sp-rule` under header |
| Tag | `<span>` | close `<button>` when closable | `sp-frame`, `sp-tone` |
| Badge | `<span>` | count as text | `sp-frame` |
| Divider | `<div role="separator">` | — | `sp-rule` |
| Progress | `<div role="progressbar">` | — | `sp-track`, `sp-fill` (exact), value text |
| Alert | `<div role="alert|status">` | close `<button>` when closable | `sp-frame`, `sp-mark` (kind glyph: i, ✓, ⚠, ✕; exact), `sp-tone` for `error` only (ground `ui.tone.alertError`) |
| Skeleton | `<div aria-busy="true">` | a visually-hidden label | `sp-tone` blocks, `aria-hidden` |

Rules: no framework comments or empty text nodes in the emitted markup (DD-017's rule); element
order is reading order; ids are `${id}--${part}` (REQ-329).

**`ink` and `precision`** emit the same elements; only `data-mode` differs.
In `precision` the frame becomes an exact border and the tone is unchanged (DD-022, C-7): hatch
tiles, or line weights under a `weight` ground, stay, since tone is value, not ornament.

**Markup as data.** The contract above is the `ui*View` trees of `@silverpoint/core/ui` (§2.1); the
canonical render of a fixture is that tree.

**Runtime without ground.** The runtime never reads a ground's tokens for markup: `data-frame` is a
slot 0..5 (`uiFrameVariant(seed, id, 6)`) and `data-tone` a level 1-4 or a state (`primary`,
`danger`, `disabled`, `selected`, `alertError`). `ui.css` folds slots onto the variants a ground
draws and maps states to its `ui.tone` levels.

**Markup details.**

- The legends of Segmented and Rate are for assistive technology only (`sp-ui-sr`).
- The radios of Segmented and Rate take `name`, else `${id}--value`, else no name.
- A read-only Rate is `role="radiogroup"` with `aria-readonly`.
- A Tag's close button is named `Remove <text>` unless `closeLabel` is set.
- A Badge's dot is drawn; its `label` is visually hidden text.
- The circle Progress is the core's arc (`uiProgressArc`), with classes on its two paths.
- A slider thumb is `part="sp-thumb sp-heighten"`, and `ui.css` matches parts with `~=`.

### 7.3 Catalog, second series

All 27 accept `CommonChartProps`; the accessor rule of §5 holds (REQ-098, REQ-099). `Obs` = `Observations` (Data Model §2.15); other shapes as named there. **Heighten** is the one
element REQ-442 lets the chart heighten. **Keys** is the keyboard model: `linear` and `grid` are the
existing ones (`interaction/hit-test.ts`), `tree` is the WAI-ARIA tree pattern (REQ-438), and a chart may give its items their own moves (`HitArea.moves`, Data Model §2.25), as the hierarchy charts and the network do.

### Wave 1 — distribution, comparison, change, ranking, uncertainty

| REQ | React | Vue | Angular selector | Own props | Data | Heighten | Keys |
|---|---|---|---|---|---|---|---|
| REQ-400 | `HistogramChart` | `SpHistogramChart` | `sp-histogram-chart` | `valueKey`, `bins?: number \| readonly number[]`, `cumulative?: boolean`, `orientation` | `Obs` | Modal bin (last bin when `cumulative`) | linear |
| REQ-401 | `EcdfChart` | `SpEcdfChart` | `sp-ecdf-chart` | `valueKey`, `groupKey?`, `markers?: readonly number[]` (quantiles drawn as rules) | `Obs` | Median crossing of the first group | grid (group × step) |
| REQ-402 | `BoxPlotChart` | `SpBoxPlotChart` | `sp-box-plot-chart` | `valueKey`, `groupKey?`, `whisker?: number` (IQR multiple, 1.5), `outliers?: boolean`, `orientation` | `Obs` | Median of the group with the highest median | grid (one stop per group's median; its outliers below it, by Down) |
| REQ-403 | `ViolinChart` | `SpViolinChart` | `sp-violin-chart` | `valueKey`, `groupKey?`, `bandwidth?: number`, `quartiles?: boolean`, `orientation` | `Obs` | Median mark of the group with the highest median | linear |
| REQ-404 | `RidgelineChart` | `SpRidgelineChart` | `sp-ridgeline-chart` | `valueKey`, `groupKey`, `bandwidth?`, `overlap?: number` (0–1, 0.5) | `Obs` | Peak of the front ridge | linear |
| REQ-405 | `BeeswarmChart` | `SpBeeswarmChart` | `sp-beeswarm-chart` | `valueKey`, `groupKey?`, `labelKey?`, `radius?: number` (3) | `Obs` | Maximum observation | linear (in value order) |
| REQ-406 | `LollipopChart` | `SpLollipopChart` | `sp-lollipop-chart` | `xKey`, `valueKey`, `orientation`, `sort?: 'none' \| 'ascending' \| 'descending'` | `CategorySeries` | Largest head | linear |
| REQ-407 | `DumbbellChart` | `SpDumbbellChart` | `sp-dumbbell-chart` | `labelKey`, `startKey`, `endKey`, `names?: [string, string]`, `endMarker?: 'dot' \| 'arrow'`, `orientation` | `Paired` | End mark of the largest change | grid (category × start, end) |
| REQ-408 | `SlopeChart` | `SpSlopeChart` | `sp-slope-chart` | `labelKey`, `startKey`, `endKey`, `names?: [string, string]` | `Paired` | Segment of the largest change | grid (category × period) |
| REQ-409 | `BumpChart` | `SpBumpChart` | `sp-bump-chart` | `xKey`, `seriesKey`, `valueKey`, `order?: 'descending' \| 'ascending'` (rank 1 = highest by default), `series?: number` (cap) | `Ranked` | Last point of the rank-1 series | grid (series × x) |
| REQ-410 | `ErrorBarChart` | `SpErrorBarChart` | `sp-error-bar-chart` | `labelKey`, `estimateKey`, `lowKey`, `highKey`, `reference?: number`, `orientation` | `Estimates` | Estimate furthest from `reference` (or largest) | linear |
| REQ-411 | `IntervalChart` | `SpIntervalChart` | `sp-interval-chart` | `laneKey`, `startKey`, `endKey`, `labelKey?`, `axis?: 'number' \| 'date'` | `Intervals` | Longest interval | grid (lane × order) |
| REQ-412 | `DivergingBarChart` | `SpDivergingBarChart` | `sp-diverging-bar-chart` | `labelKey`, `levels: readonly string[]`, `neutral?: number \| null` (index; `null` = none), `percent?: boolean` (true) | `Likert` | Largest positive share | grid (row × level) |
| REQ-413 | `ConnectedScatterChart` | `SpConnectedScatterChart` | `sp-connected-scatter-chart` | `xKey`, `yKey`, `labelKey?`, `arrows?: boolean` | `PathPoints` | Last point | linear (path order) |

### Wave 2 — part-to-whole, hierarchy, multivariate, polar

| REQ | React | Vue | Angular selector | Own props | Data | Heighten | Keys |
|---|---|---|---|---|---|---|---|
| REQ-414 | `WaffleChart` | `SpWaffleChart` | `sp-waffle-chart` | `nameKey`, `valueKey`, `cells?: number` (100), `columns?: number` (10) | `SectorSeries` | The largest category's cells, emitted as **one** `<path>` (I-4 counts elements) | linear (one stop per category) |
| REQ-415 | `MarimekkoChart` | `SpMarimekkoChart` | `sp-marimekko-chart` | `columnKey`, `segmentKey`, `valueKey` | `Mosaic` | Largest cell | grid (column × segment) |
| REQ-416 | `SquarifiedTreemap` | `SpSquarifiedTreemap` | `sp-squarified-treemap` | `idKey`, `parentKey`, `valueKey`, `labelKey?`, `depth?: number` (levels drawn), `rootId?` | `Hierarchy` | Largest leaf | tree |
| REQ-417 | `SunburstChart` | `SpSunburstChart` | `sp-sunburst-chart` | `idKey`, `parentKey`, `valueKey`, `labelKey?`, `depth?: number`, `rootId?` | `Hierarchy` | Largest first-level arc | tree |
| REQ-418 | `TreeChart` | `SpTreeChart` | `sp-tree-chart` | `idKey`, `parentKey`, `labelKey?`, `valueKey?`, `orientation?: 'horizontal' \| 'vertical'` | `Hierarchy` | Root | tree |
| REQ-419 | `ParallelCoordinatesChart` | `SpParallelCoordinatesChart` | `sp-parallel-coordinates-chart` | `labelKey?`, `dimensions: readonly string[]`, `domains?: Record<string, [number, number]>` | `WideRows` | Polyline of the first row | grid (row × dimension) |
| REQ-420 | `PolarLineChart` | `SpPolarLineChart` | `sp-polar-line-chart` | `angleKey`, `valueKey`, `period?: number` (closes the line), `startAngle?` | `PolarPoints` | Maximum point | linear |
| REQ-421 | `PolarScatterChart` | `SpPolarScatterChart` | `sp-polar-scatter-chart` | `angleKey`, `radiusKey`, `sizeKey?`, `period?: number` (360) | `PolarPoints` | Point of largest radius | linear (angle order) |

### Wave 3 — fields and networks

| REQ | React | Vue | Angular selector | Own props | Data | Heighten | Keys |
|---|---|---|---|---|---|---|---|
| REQ-422 | `DensityBinChart` | `SpDensityBinChart` | `sp-density-bin-chart` | `xKey`, `yKey`, `binShape?: 'hexagon' \| 'rect'`, `binSize?: number` (px, 14) | `PointCloud` | Densest bin | grid |
| REQ-423 | `ContourChart` | `SpContourChart` | `sp-contour-chart` | `source?: 'points' \| 'grid'` (`'points'`), `xKey`, `yKey`, `valueKey?` (grid), `levels?: number \| readonly number[]`, `filled?: boolean` | `PointCloud` \| `GridField` | Highest band | linear (level order) |
| REQ-424 | `DelaunayChart` | `SpDelaunayChart` | `sp-delaunay-chart` | `xKey`, `yKey`, `labelKey?`, `mesh?: 'delaunay' \| 'voronoi'` | `PointCloud` | Point of highest degree | linear (data order) |
| REQ-425 | `VectorFieldChart` | `SpVectorFieldChart` | `sp-vector-field-chart` | `xKey`, `yKey`, `uKey`, `vKey`, `scale?: number` | `VectorField` | Largest magnitude | grid |
| REQ-426 | `NetworkChart` | `SpNetworkChart` | `sp-network-chart` | `sourceKey`, `targetKey`, `valueKey?`, `nodes?: readonly NetworkNode[]`, `iterations?: number` (300) | `Flows` + `nodes` | Node of highest degree | own moves: Right/Left walk the nodes, Down the links a node starts, Up back to it |

Own props the tables leave implicit:

- **`bins`** — a number asks for that many equal-width bins over the niced extent; an array gives the
  thresholds. Not increasing → default + `SP021`.
- **`bandwidth`** — in data units. Omitted, Silverman's rule (REQ-432). Shared by all groups of a
  chart so the shapes are comparable.
- **`rootId`** (REQ-439) — controlled. The chart draws that node as root and emits `onRootChange`;
  it never changes its own root.
- **`NetworkNode`** — `{ id: string; label?: string; group?: string; x?: number; y?: number }`. When
  every node has finite `x` and `y`, no layout runs (REQ-436). `nodes` is data: with the demo it is
  ignored, as the accessors are (REQ-098).
- **`levels`** — data too wherever it says how the data's values are read: `DivergingBarChart`'s
  level columns and `ContourChart`'s thresholds (in the data's units, or a count of levels over its
  peak) are ignored with the demo, like `…Key`, and `data`'s documentation lists them (REQ-099).
- **`axis: 'date'`** on `IntervalChart` — `start`/`end` are ISO `YYYY-MM-DD`, day arithmetic in UTC
  (`charts/shared/dates.ts`), never the host time zone.

### 7.4 Composed components, overlays and the timeline (feature-004)

21 catalog rows (REQ-470..REQ-503): batch **A1**, display — `Surface`, `Glyph`, `Table`,
`Breadcrumb`, `Avatar` (with `AvatarGroup`), `Statistic`, `Descriptions`, `TimelineList`, `Empty`,
`Result`; batch **A2**, stateful — `Pagination`, `Collapse` (with `CollapseItem`), `Textarea`,
`InputNumber`; batch **B**, overlays — `Modal`, `Drawer`, `Popover`, `Tooltip`, `Select`,
`DropdownMenu`, `Toast` (with `Toaster`). `SpTimeline` (REQ-510..REQ-515) is not a row of
`UI_COMPONENTS`: it sits on a subpath of its own, with surface fixtures of its own. Props are in §3.5, names per adapter in §1.3. Each
takes `CommonUiProps`, `palette` included.

#### Markup contract additions (normative, REQ-516)

Every root carries the `0.3.0` root contract of §7.2 (`sp-ui sp-<slug> sp-ground-<ground>`,
`data-ground`, `data-substrate`, `data-mode`, `data-size`, `data-frame`) and, with a palette,
`style` holding `paletteStyle(...)` followed by any style the component computes and the consumer's own.

| Component | Root | Native / semantic core | Drawn parts |
|---|---|---|---|
| Surface | the `as` element (Angular: the consumer's element, `[spSurface]`) | itself | `sp-frame` (`frame`), `sp-tone` (`tone`) |
| Glyph | `<svg part="sp-mark" data-glyph viewBox="0 0 16 16" aria-hidden>` | — | the exact path |
| Table | `<div class="sp-ui sp-table">` with `data-striped`, `data-hoverable` | `<div class="sp-ui-table-scroll"><table class="sp-ui-table">`, `<caption>`, `<th scope="col" data-align aria-sort>`, sortable headers hold `<button class="sp-ui-sort">`; a cell's text sits on a `.sp-ui-plate` (*amended in implementation*) | `sp-frame` (card, when `bordered`), sort `sp-mark`, row tone by `ui.css` |
| Pagination | `<nav aria-label>` | `<ul class="sp-ui-pages">` of `<li>`; pages `<button class="sp-ui-page" aria-label="Page n">`; the current `<span aria-current="page">` | `sp-frame` (control) per page, `sp-heighten` on the current, chevron `sp-mark`s |
| Breadcrumb | `<nav aria-label>` | `<ol class="sp-ui-crumbs">`, `<a>` / `<span aria-current="page">` | the `/` separators as `::before` in `--sp-rule` |
| Avatar | `<span data-shape>` (`role="img" aria-label` with initials) | `<img alt>` or `<span class="sp-ui-avatar-initials" aria-hidden>` | `sp-frame` (`round` / `box`) |
| AvatarGroup | `<div class="sp-ui sp-avatar-group" role="group">` | — | — |
| Statistic | `<div>` | title, value, affixes as `<span>` | trend `sp-mark` (`arrowUp`/`arrowDown`) |
| Descriptions | `<section data-bordered>` | `<h3>` title, `<dl>` of `<div><dt><dd>` | `sp-frame` (card, when `bordered`) |
| TimelineList | `<ol aria-label>` | `<li data-status aria-current="step"?>` | per item `sp-frame` (round); `sp-tone` (selected) for `done`, `sp-heighten` for `current`, cross `sp-mark` for `error`; connectors as `::before`, dashed for `pending` |
| Collapse | `<div>` | `SpCollapseItem` = `<details name?><summary>` + body | `sp-frame` (card, when `bordered`), chevron `sp-mark` |
| Empty | `<div>` | `<p>` description | toned tray (`sp-tone` 1 + `sp-frame` control, `aria-hidden`) |
| Result | `<div role="status\|alert" data-status>` | heading at `headingLevel`, `<p>` subtitle | `sp-frame` (round) + status `sp-mark` |
| Textarea | `<span class="sp-ui sp-input sp-textarea">` | `<textarea class="sp-ui-control">`, counter, `<span id="${id}--message">` | `sp-frame` (control), warning `sp-mark` when `invalid` |
| InputNumber | `<span class="sp-ui sp-input sp-input-number">` | `<button class="sp-ui-stepper" aria-label tabindex="-1">` − `<input type="number" inputmode="decimal">` + (the steppers leave the tab order: the arrows on the input step, as APG's spinbutton; *amended in implementation*) | `sp-frame` (control), `dash` / `plus` `sp-mark`s |
| Modal | `<dialog id="${id}--dialog" class="sp-ui sp-modal" aria-labelledby\|aria-label data-state>` | header `<h2 id="${id}--title">`, `<p id="${id}--description">`, body, footer; close `<button class="sp-ui-icon-button">` | `sp-frame` (card), `sp-rule` under the header; `::backdrop` toned by `ui.css` |
| Drawer | `<dialog class="sp-ui sp-drawer" data-side>` | as Modal | as Modal |
| Popover | `<div class="sp-ui sp-popover" popover="auto" id="${id}--popover" role="dialog" aria-labelledby?>` | header, body | `sp-frame` (card) |
| Tooltip | `<div class="sp-ui sp-tooltip" popover="manual" role="tooltip" id="${id}--tooltip">` | text | `sp-frame` (control) |
| Select | `<span class="sp-ui sp-select">` | trigger `<button role="combobox" aria-haspopup="listbox" aria-expanded aria-controls aria-activedescendant? aria-label>` with the value; `<div class="sp-ui-select-content" popover="auto">` holding `<div role="listbox" id="${id}--listbox">` of `<div role="option" id="${id}--option-<key>" aria-selected aria-disabled?>`; a hidden `<input type="hidden" name>` when `name` | `sp-frame` (control) on the trigger, `sp-frame` (card) on the list, `sp-heighten` on the active option, tick `sp-mark` on the chosen, chevron `sp-mark` |
| DropdownMenu | `<span class="sp-ui sp-dropdown-menu">` | trigger `aria-haspopup="menu" aria-expanded aria-controls`; `<div popover="auto" role="menu" id="${id}--menu">` of `<div role="menuitem" tabindex="-1" data-danger? aria-disabled?>`, `role="separator"`, `role="presentation"` labels | `sp-frame` (card), `sp-heighten` on the active item |
| Toast | `<li class="sp-ui sp-toast" role="listitem" data-kind data-state>` | `<div class="sp-ui-toast-body" role="status\|alert">` with the kind glyph, title and description; action, close `<button>` | `sp-frame` (card), kind `sp-mark` |
| Toaster | `<section class="sp-ui sp-toaster" aria-label data-position>` holding `<ol class="sp-ui-toaster-list" role="list">` | — | — |
| Timeline | `<section class="sp-ui sp-timeline" aria-label data-kl-inked data-kl-card>` | `<span class="sp-kl-probe" aria-hidden>` probes, `<div class="sp-kl-mount">` | `sp-frame` (card, when `card`) |

Rules (as in `0.3.0`): no framework comments or empty text nodes; element order is reading order;
every id is `${id}--${part}`; overlays emit `data-state="open|closed"`, never the `open` attribute
(the browser sets it on `showModal()`); placement is written on the overlay as `--sp-ui-x`,
`--sp-ui-y` and `data-side` after open, never in the server markup (REQ-502). An accordion's
`<details>` share the `name` `${id}--accordion` (`uiCollapseGroup`; `SP017` without an `id`).
`data-kl-inked` is `"false"` until `timelineInk` has run. The DOM TimelineJS builds inside
`sp-kl-mount` is not part of the contract (Art. 3).

*Amended in implementation:* a toast's live role is on `.sp-ui-toast-body`, not the `<li>`,
which may not take one (axe `aria-allowed-role`); the dialog's id is `${id}--dialog`.
*Amended in implementation:* a disabled `SpCollapseItem`'s `<summary>` carries
`tabindex="-1"` beside `aria-disabled="true"`, since `<summary>` has no `disabled` attribute and Tab
must skip it (REQ-522). The toaster's list is `<ol class="sp-ui-toaster-list" role="list">` and a
toast is `<li role="listitem">`: in Angular the `<sp-toast>` host sits between them, and only explicit
roles let a list keep its items across it (axe `list` / `listitem`).

## 8. API by adapter

### 8.1 React

```tsx
import { LineChart, SilverpointProvider } from '@silverpoint/react';

<SilverpointProvider ground="silverpoint" substrate="cream" mode="ink">
  <LineChart
    data={rows}
    xKey="hour"
    valueKey="hits"
    title="Throughput per hour"
    unit="requests"
    onActiveChange={setActive}
  />
</SilverpointProvider>
```

**Server and client boundaries** (REQ-103, REQ-104). There are two entry points per chart:

| Import | Marker | Interaction | Use |
|---|---|---|---|
| `@silverpoint/react/line-chart` | `"use client"` | Yes | Default |
| `@silverpoint/react/server/line-chart` | No marker | No | RSC; standing alone it needs `id`, `width` and `height` (`SP002` / `SP003` without them); inside a `Dashboard` the cell supplies them |

The server variant emits pure SVG with no client JavaScript. It accepts neither
`onActiveChange` nor `dataTable: 'visible'` with keyboard navigation; the type prevents it.

**Imperative API** through `ref`, deliberately minimal:

```ts
export interface ChartHandle {
  getGeometry(): Geometry;
  toSVGString(): string;
}
```

**UI components (§7.2).** Function components; `forwardRef` to the native element (`SpButton`, `SpInput` and the hidden inputs); `onChange` receives the value. `SpTabs` renders `SpTabPanel` children matched by `value`. Display components also have server entries (§1.2).

**Composed components, overlays and the timeline (§7.4).** Function components; `forwardRef` to the
native element (`<textarea>`, the number `<input>`, the Select's trigger, the `<dialog>`). Overlay
triggers are a `trigger` prop (`ReactElement`) that the overlay clones with its ARIA and handlers,
as the dashboard clones its charts. `"use client"` on every overlay, Pagination, Textarea,
InputNumber, sortable Table, Collapse with `onToggle`, and `SpTimeline`. `SilverpointProvider` takes
`palette`, and a nested provider inherits what it does not set (`nestProvider`, §3.4).
*Amended in implementation:* Pagination, Collapse, CollapseItem, Textarea and InputNumber
are client components only, with no `server/ui/*` entry, as `0.3.0`'s Input: a disabled
CollapseItem is held shut by a handler. *Amended in implementation:* the overlays are
client components only too, and an overlay finds its trigger as the element rendered just before
it, so no ref is merged into the consumer's. The A1 display components keep server entries; the
server `SpTable` renders the same markup and takes no `onSort`.

### 8.2 Angular

Standalone components with signal inputs and `OnPush` (REQ-101).

```ts
import { SpLineChart } from '@silverpoint/angular/line-chart';
```

In Vue the subpath mirrors React's:

```ts
import { SpLineChart } from '@silverpoint/vue/line-chart';
import { provideSilverpoint } from '@silverpoint/angular';

bootstrapApplication(App, {
  providers: [provideSilverpoint({ ground: 'silverpoint', substrate: 'cream' })],
});
```

```html
<sp-line-chart
  [data]="rows()"
  xKey="hour"
  valueKey="hits"
  title="Throughput per hour"
  unit="requests"
  (activeChange)="active.set($event)" />
```

Inputs are declared with `input()` and are read-only inside the component. The component
SHALL NOT expose public methods beyond `getGeometry()` and `toSVGString()`, so as to keep
symmetry with `ChartHandle`.

**UI components (§7.2).** Standalone, signal inputs, `OnPush`, zoneless-safe (REQ-101). Value components share the `SpUiControl` base (`ui/base`), expose `value = model<T>()` and implement `ControlValueAccessor` (REQ-323). `SpButton` is an attribute component on the consumer's native element (`button[spButton]`, `a[spButton]`), so the host is the native control (DD-024). `SpInput` is an **element**, `<sp-input>`, not `input[spInput]`: a native `<input>` can hold neither the frame nor the message. Named slots are templates: `<ng-template spExtra>`, `spFooter`, `spPrefix`, `spSuffix`. Panels read their tabs through the `SP_TABS` token. A Tag reads its projected text after render, for its close button's name.

**Composed components, overlays and the timeline (§7.4).** Standalone, signal inputs, `OnPush`;
`open = model<boolean>()`; triggers are projected with an `spTrigger` directive on the consumer's
element (`<button spButton spTrigger>`); footers and actions as `<ng-template spFooter>`, `spAction`,
`spExtra`, `spFallback`. `SpTextarea`, `SpInputNumber` and `SpSelect` extend `SpUiControl`
(ControlValueAccessor). The surface is the attribute component `[spSurface]` (DD-024).
`provideSilverpoint` takes `palette` and returns a `Provider` (*amended in implementation*),
so a component's `providers` may nest one.
*Amended in implementation:* `SpTrigger`, the base `SpUiOverlay` and the helpers
`uiOverlayNative` and `uiListKeys` live on a new entry, `@silverpoint/angular/ui/overlay`, apart
from `ui/base`: Angular's partial declarations are not tree-shaken, and in `ui/base` they put
every component over its REQ-330 budget (`SpDivider` at 8,217 B of 8 kB). Each overlay subpath
re-exports `SpTrigger`. A Modal's or Drawer's footer is `<ng-template spFooter>` (`SpCardFooter`,
re-exported); a toast's action is `<ng-template spAction>` (`SpToastAction`); the timeline's
fallback `<ng-template spFallback>` (`SpTimelineFallback`). `SpTrigger` writes its ARIA on the
server as well. The Select and the Menu listen on their host for the keys and clicks of their tree.

### 8.3 Vue

Components authored with `<script setup>`, typed props and typed emits (REQ-108).

```ts
import { SpLineChart, provideSilverpoint } from '@silverpoint/vue';

// main.ts
app.use(provideSilverpoint({ ground: 'silverpoint', substrate: 'cream' }));
```

```vue
<template>
  <SpLineChart
    :data="rows"
    x-key="hour"
    value-key="hits"
    title="Throughput per hour"
    unit="requests"
    @active-change="active = $event" />
</template>
```

Props are the same `CommonChartProps` as every other adapter; in templates they may be
written in `kebab-case`, which Vue maps to the `camelCase` declaration. Emits are typed,
so `@active-change` carries `ActiveItem | null` and nothing else.

**Server rendering.** The adapter renders under `@vue/server-renderer` with no DOM access,
which is what the string gate of DD-003 consumes and what REQ-109 verifies after
hydration. There is no Nuxt-specific code: a Nuxt app consumes the package like any other
Vue app, and Nuxt is not a validated integration in the `0.x` line.

**Imperative API** by template ref, identical to `ChartHandle`:

```ts
const chart = ref<InstanceType<typeof SpLineChart>>();
chart.value?.getGeometry();
```

**UI components (§7.2).** `<script setup>` with typed props and emits (REQ-108), `defineModel` for the value, slots `prefix`, `suffix`, `extra` and `footer`.

**Composed components, overlays and the timeline (§7.4).** Slots `trigger`, `footer`, `action`,
`extra`, `fallback`; `v-model`, `v-model:open`, `v-model:current`. `provideSilverpoint` takes
`palette`; *amended in implementation:* a `SilverpointProvider` component (props `ground`,
`substrate`, `mode`, `locale`, `palette`; renders its slot and no element) provides a section, and
inherits what it does not set. *Amended in implementation:* a `trigger` slot's first
element is cloned with the ARIA and the toggle; DropdownMenu emits `select(key)`, Select
`update:modelValue(key)`.

### 8.4 Ribbon generator

`ChordRing` (REQ-091) needs a generator of ribbons between angular positions that the arc
engine does not cover. The core exposes it as an internal part and the Technical Design
decides whether it leans on `d3-chord` or is implemented by hand; either way, the decision
does not alter any signature in this specification.

## 9. Events and interaction

| React | Vue | Angular | Payload | When |
|---|---|---|---|---|
| `onActiveChange` | `@active-change` | `activeChange` | `ActiveItem \| null` | The pointer enters or leaves an item, or keyboard focus moves (REQ-141) |
| `onSelect` | `@select` | `select` | `ActiveItem` | Click, `Enter` or `Space` on an item |
| `onLinkChange` | `@link-change` | `linkChange` | `{ key: string; value: unknown } \| null` | On a `Dashboard` with `link`: the linked value changes (REQ-216); `null` when the source clears (REQ-218) |
| `onRootChange` | `@root-change` | `rootChange` | `string \| null` — the node id, `null` for the data root | `SunburstChart`, `SquarifiedTreemap`: a node is activated (click, Enter, Space); the centre or the current root's frame emits its parent (REQ-439) |

`onActiveChange` and `onSelect` keep their meaning. For a derived mark, `ActiveItem.value` is the
derived value (the bin count, the median) and `ActiveItem.datum` is a frozen summary object
(`{ x0, x1, count }`, `{ min, q1, median, q3, max, outliers }`, `{ id, path, value, share }`), never
the raw rows. The mapping from an activated item to the emitted id is the core's (`rootChangeOf`, on `/catalog`); no adapter holds a root (REQ-108).

Charts inside a linked dashboard keep their own `onActiveChange`; a linked mark is **not** an
active item and fires no `onActiveChange` in the other charts.

`onActiveChange` emits `null` when leaving the area or losing focus, leaving no residual
state (REQ-143). The active item is resolved by the core as a pure function of position
and geometry, without consulting the DOM (REQ-140).

On touch input, resolution is by proximity, with a minimum target of 24 px (REQ-144).

**Custom readout.** `tooltip` accepts a consumer-supplied renderer (REQ-142); if it is
omitted, the included one is used.

```tsx
<LineChart tooltip={(active) => <MyReadout item={active} />} />
```

```html
<sp-line-chart><ng-template spTooltip let-active>…</ng-template></sp-line-chart>
```

```vue
<SpLineChart><template #tooltip="{ active }">…</template></SpLineChart>
```

**UI components.** Value events fire only on user input, never on a prop change, and never for a disabled component or
item (REQ-326). Composite keyboard transitions come from `uiRovingKey` (REQ-315); `Tabs` with
`activation="automatic"` selects on focus move, `manual` on Enter/Space.

| React | Vue | Angular | Payload | When |
|---|---|---|---|---|
| `onChange(value)` | `update:modelValue`, then `change` after commit (Slider: pointer up / key) | `(valueChange)` | the component's value (§3.3) | User input on a value component |
| `onClose` | `@close` | `(close)` | — | A closable `Tag` or `Alert` is dismissed |
| `onClick` | `@click` | `(click)` | native event | `Button`, native |

**Composed components, overlays and the timeline (§7.4).**

| React | Vue | Angular | Payload | When |
|---|---|---|---|---|
| `onOpenChange(open)` | `update:open` | `(openChange)` | `boolean` | An overlay opens or closes by user action or by the platform (Escape, a light dismiss) (REQ-500) |
| `onSort(key)` | `@sort` | `(sort)` | `string` | A sortable `Table` header is pressed |
| `onToggle(open)` | `@toggle` | `(toggle)` | `boolean` | A `CollapseItem` is toggled; its `open` binds as a value (React `open`/`defaultOpen`, Vue `v-model:open`, Angular `[(open)]`) |
| `onSelect(key)` | `@select` | `(select)` | `string` | A `DropdownMenu` item is chosen |
| `onChange`, `onLoaded`, `onNavNext`, `onNavPrevious`, `onZoomIn`, `onZoomOut`, `onBackToStart` | the same names as emits | the same names as outputs | TimelineJS's payload (`change`: the slide's `unique_id`) | `SpTimeline` forwards TimelineJS's events (`TIMELINE_EVENTS`) |

Value and open events fire on user input only, never on a prop change, never when disabled
(REQ-326). Overlay keyboard: `uiListKey` / `uiTypeahead` (REQ-494, REQ-495), the typeahead buffer
reset 500 ms after the last key by the adapter. `SpModal` with `dismissible: false` cancels the
dialog's `cancel` event. Toasts pause their timer on `pointerenter` and `focusin`. F8 moves focus to
the toaster region. *Amended in implementation:* a paused toast counts its whole duration
again once the pointer and focus have left it (no clock is read, Art. 4); F8 makes the region
focusable (`tabindex="-1"`) as it moves focus there, never in the server markup.
*Amended in implementation:* a tooltip listens for Escape on its document, not on its
trigger, so a tooltip shown by hover is dismissed without moving the pointer or focus (WCAG 1.4.13).

## 10. DOM and CSS contract

### 10.1 `part` attributes

Every emitted stroke carries `part`, and it is the only stable coupling point between the
SVG and the stylesheet. Overriding a variable re-themes without re-rendering (REQ-042).
The charts of §7.3 emit only these `part` and `data-role` values and read only the `--sp-`
properties of §10.2 (REQ-450): every ground, substrate and the Tailwind preset style them unchanged.

| `part` | CSS property applied | Variable |
|---|---|---|
| `sp-ink` | `stroke`, `fill` | `--sp-ink` |
| `sp-ink-secondary` | `stroke`, `fill` | `--sp-ink-secondary` |
| `sp-heighten` | `fill` | `--sp-heighten` |
| `sp-rule` | `stroke` | `--sp-rule` |
| `sp-grid` | `stroke` | `--sp-grid` |
| `sp-axis` | `fill` | `--sp-text-muted` |

UI components (§7.2) add `sp-frame`, `sp-tone`, `sp-mark`, `sp-knob`, `sp-track`, `sp-fill`, `sp-thumb` and `sp-connector`; `sp-rule` and `sp-heighten` keep their meaning. The components of §7.4 add no new value: `sp-mark` covers the ten new glyphs.

The dashboard composition (§7.1) adds, on HTML elements: `dashboard` (the `section`),
`dashboard-title` (the heading), `dashboard-description`, `dashboard-grid` (the grid inside the
section: a container query styles descendants, never the container), `dashboard-cell` (each
`article`), and
`linked` on a chart item under a linked mark (client only, REQ-219).

Besides `part`, a `path` carries `data-role`, `data-paint`, and when set `data-dash` and
`data-weight`. `data-weight="1".."4"` is the tonal weight of a `weight` ground (REQ-028); the
stylesheet sets its `stroke-width` to `calc(var(--sp-stroke-width) * var(--sp-weight-N))`.

### 10.2 Public CSS custom properties

```css
.sp-ground-silverpoint[data-substrate='cream'] {
  --sp-substrate:      #EDE7DA;
  --sp-ink:            #5A5E65;
  --sp-ink-secondary:  #685C4D;
  --sp-heighten:       #FFFFFF;
  --sp-rule:           #737A82;
  --sp-grid:           #737A82;
  --sp-text:           #3F4348;
  --sp-text-muted:     #5A5E65;  /* = --sp-ink in this ground, see Data Model §3.2 */
  --sp-font-display:   'EB Garamond', 'Iowan Old Style', Georgia, serif;
  --sp-stroke-width:   0.9;
  --sp-hatch-gap:      7;
  --sp-radius:         2px;
}
```

```css
.sp-ground-cyanotype {
  --sp-substrate:      #1B3F6B;  /* prussian, the ground's only substrate */
  --sp-ink:            #E2EAF2;
  --sp-ink-secondary:  #DCCBA8;
  --sp-heighten:       #0C2240;  /* a reserve: the heightened element is the deepest blue */
  --sp-rule:           #8AA8C7;
  --sp-grid:           #8AA8C7;
  --sp-text:           #F4F6F8;
  --sp-text-muted:     #B8CBDE;
  --sp-stroke-width:   0.9;
  --sp-weight-1:       1.5;
  --sp-weight-2:       2.25;
  --sp-weight-3:       3;
  --sp-weight-4:       4;
}
```

The exact values of the substrates are fixed by the Data Model. Any variable not
listed here is internal and may change in a minor version.

The dashboard composition adds `--sp-dashboard-gap` (default `16px`, overrides `layout.gap`), and
the variables the adapter writes from the resolved model: `--sp-dashboard-columns-sm/md/lg`,
`--sp-dashboard-row-height` and `--sp-dashboard-layout-gap` (the value `--sp-dashboard-gap` falls back
to, so the public property still overrides it from CSS) on the wrapper, `--sp-cell-col-sm/md/lg` and `--sp-cell-row-sm/md/lg` on each cell. Container
breakpoints are fixed in the stylesheet: `sm` < 640 px ≤ `md` < 1024 px ≤ `lg` (DD-014).

UI components add these public properties (`@silverpoint/grounds/ui.css`):

| Property | Default (from the ground's `ui` tokens) | Note |
|---|---|---|
| `--sp-ui-height-sm` / `-md` / `-lg` | 24 / 32 / 40 px | Control heights (≥ 24 px, REQ-317) |
| `--sp-ui-radius` | ground `ui.radius` | Frame corner radius in `precision` |
| `--sp-ui-focus-width` | 2 px | REQ-316 |
| `--sp-ui-focus-color` | `var(--sp-ink)` | Must keep 3:1 (REQ-313) |
| `--sp-ui-gap` | 8 px | Spacing inside composites |

The components of §7.4 add:

| Property | Default | Note |
|---|---|---|
| `--sp-avatar-size` | 40 px (28 / 56 for `sm` / `lg`) | Avatar box |
| `--sp-descriptions-columns` | `3` | Written by the core from `columns` |
| `--sp-textarea-rows` | `3` | Written by the core from `rows` |
| `--sp-modal-width`, `--sp-drawer-size`, `--sp-popover-width`, `--sp-select-width` | 520 px, 380 / 320 px, 320 px, 180 px | Written by the core from the props |
| `--sp-ui-x`, `--sp-ui-y` | — | Placement, written by `uiAnchor` on open |

A palette (§3.4) sets the same `--sp-` properties as an inline declaration on the root it is given
to (`paletteStyle`), so it wins over the ground's sheet and over `ui.css`'s `:where()` default of
`--sp-ui-focus-color`; no new property is added for it.

**There is no monospace variable.** The system uses a single family: monospace is an
invention of the typewriter and has no place in a Renaissance ground. What motivated its
use —aligning figures— is solved by EB Garamond's `tnum` feature, verified present. Small
caps lines are set with `text-transform: uppercase` and open tracking, which is
deterministic in any engine; the Google Fonts build of EB Garamond does not include `smcp`.

### 10.3 Accessibility contract

| Element | Contract |
|---|---|
| SVG root | `role="img"`, `aria-labelledby` pointing at the name and, if present, the description (REQ-120) |
| Tabular alternative | Associated `<table>`, visible or visually hidden according to `dataTable` (REQ-121) |
| Data points | Traversable with `Tab` and arrow keys; each announces series, category and value (REQ-122) |
| Forced mode | `prefers-contrast: more` or `forced-colors: active` force `precision` (REQ-123) |
| Motion | `prefers-reduced-motion: reduce` omits the entrance animation (REQ-125) |
| Dashboard wrapper | `<section part="dashboard" aria-labelledby="{id}-title">`, `aria-describedby` when `description` is given; `aria-label` when only `label` is (REQ-214) |
| Dashboard heading | `<h{headingLevel} id="{id}-title">` |
| Dashboard cell | `<article part="dashboard-cell">` labelled by its chart's accessible name (REQ-214) |
| Dashboard order | DOM order = reading order at every breakpoint (REQ-203); the dashboard adds no tab stop (REQ-215) |
| Linked marks | `aria-hidden`; no live-region update (REQ-218) |

UI components (§7.2) additionally follow REQ-314..REQ-320, REQ-334 and the markup table. The drawing never takes focus and never carries a name; the native or semantic element does. The components of §7.4 follow REQ-473..REQ-503, REQ-522 and their markup table, on the same terms.

Parity holds for the markup the library emits. With the Angular attribute components (DD-024)
the host is the consumer's own `<button>` or `<input>`: attributes the consumer adds to it are
theirs, outside the contract and outside the gate (A-03).

`dataTable: 'none'` is only legitimate when the consumer supplies their own accessible
alternative; the documentation says so and development mode warns about it.

### 10.4 Tailwind preset (`@silverpoint/tailwind`, optional)

For a consumer who already uses Tailwind (REQ-047). It names the public variables of §10.2; the
values stay in `@silverpoint/grounds`, so the utilities follow the chart's ground, substrate and any
override. It has no dependencies and no peers: Tailwind is never required (Art. 8, REQ-043).

```css
/* Tailwind 4 */
@import 'tailwindcss';
@import '@silverpoint/tailwind/theme.css';
```

```js
// Tailwind 3.4
export default { presets: [require('@silverpoint/tailwind')] };
```

| Utility family | Tokens | Variable |
|---|---|---|
| Colour (`bg-`, `text-`, `border-`, …) | `sp-substrate`, `sp-ink`, `sp-ink-secondary`, `sp-heighten`, `sp-rule`, `sp-grid`, `sp-text`, `sp-text-muted` | `--sp-<token>` |
| Font | `font-sp-display` | `--sp-font-display` |
| Radius | `rounded-sp` | `--sp-radius` |

Under Tailwind 3.4 a variable colour takes no opacity modifier (`bg-sp-ink/50`); under 4 it does.

Palettes (§3.4) add nothing to the preset: eight of a palette's nine fields set the colour
properties it already maps, so its utilities follow a palette as they follow a ground (the ninth,
`focus`, sets `--sp-ui-focus-color`, which the preset does not name).

## 11. Catalog of errors and warnings

Stable codes, part of the public surface. Those with `warn` severity are stripped from the
production bundle; those with `error` severity are always thrown.

| Code | Severity | Requirement | Condition |
|---|---|---|---|
| `SP001` | warn | REQ-007 | Empty dataset; the ground's empty state is drawn |
| `SP002` | warn | REQ-008 | A value cannot be drawn as given — `null`, not finite, or outside the chart's data contract — so it is corrected or omitted. The generic message names no remedy; each chart states what happened and its own remedy in the diagnostic's specifics |
| `SP003` | warn | REQ-009 | Zero-dimension container; the render is deferred |
| `SP004` | warn | REQ-010 | Degenerate scale domain; it is expanded with `domainPadding` |
| `SP005` | error (dev) / warn (prod) | REQ-025 | More than one item marked with heightening; the first one is applied |
| `SP006` | warn | REQ-026 | Inker not registered; falls back to `NullInker` |
| `SP007` | warn | REQ-045 | Ground not registered; falls back to `silverpoint` |
| `SP008` | warn | REQ-096 | Data volume above the family's threshold |
| `SP009` | error | REQ-097 | A non-derivable scale bound is missing; the message names the property |
| `SP010` | warn | REQ-091 | `ChordRing` above 12 categories |
| `SP011` | warn | NFR §7 | Path byte budget exceeded; `hatchFill: 'tile'` or a larger gap is suggested |
| `SP012` | error (CI) | REQ-127 | A ground does not reach the minimum contrast |
| `SP014` | warn | REQ-204 | A dashboard cell spans more columns than a breakpoint has; clamped |
| `SP015` | warn | REQ-205 | A dashboard's layout and children disagree (unknown cell, unplaced child, duplicate id); unmatched children rendered in source order, span 1 |
| `SP016` | warn | REQ-217 | A chart in a linked dashboard has no field named by `link.key` |
| `SP017` | warn | REQ-324 | A Slider, Rate or Progress value or a Steps `current` is out of range or off step, or a Slider/Rate range is invalid; clamped, rounded or defaulted |
| `SP018` | warn | REQ-319 | An `SpButton` or `SpBadge` has no accessible name (no text, no `label`) |
| `SP019` | warn | REQ-325 | Items of a Tabs, Segmented, RadioGroup or Steps share a key; later ones skipped |
| `SP013` | warn | REQ-032 | The `@silverpoint/fonts` face failed to load; rendering fell back to the system stack and golden images will no longer match |
| `SP020` | warn | REQ-437 | Invalid hierarchy: duplicate `id`, missing `parent`, cycle, or several roots; offending rows dropped (a synthetic root added for several roots). Names the first offending `id` |
| `SP021` | warn | REQ-433 | A statistic parameter is invalid (`bins`, `bandwidth`, `whisker`, `levels`, `overlap`, `iterations`); the default is used |
| `SP022` | warn | REQ-434 | A group is too small for its statistic; its observations are drawn as points |
| `SP023` | warn | REQ-466 | A palette's hex field is below its contrast threshold against its substrate (the palette's own `substrate`, else cream; *amended in implementation*) |
| `SP024` | warn | REQ-467 | A palette has an unknown field, or a value that is not a CSS colour; the field is dropped (the warning is development-only, the dropping is not) |
| `SP025` | warn | REQ-515 | `@knight-lab/timelinejs` could not be loaded, or threw while it was built (*amended in implementation*); `SpTimeline` renders its fallback |

`SP002` keeps its meaning for charts and is not reused by the UI components (each diagnostic names its own REQ).
`SP017`, `SP018` and `SP019` widen to the components of §7.4 (REQ-486, REQ-501, REQ-487): `SP017`
also covers an InputNumber's value and a Pagination's `current` out of range; `SP018` a Modal,
Drawer or Popover with neither `title` nor `label`; `SP019` shared keys among a Table's columns or
the items of a Breadcrumb, TimelineList, Select or DropdownMenu. *Amended in implementation:* `SP017` also reports the props the core refuses as given and drops (`SpSurface`'s
`as` and `name`, a column `width`, an `href`'s scheme, a timeline `height`, an accordion without
`id`), and `SP018` a timeline with neither `label` nor a title headline.
That is 25 codes (22 before feature-004).
`SP008` (volume) carries the second catalog's ceilings too (REQ-443, §12).

Every diagnostic includes the chart name, the property involved and the `REQ-NNN` that
motivates it.

## 12. Limits and budgets

| Limit | `0.x` value | Behaviour on exceeding it |
|---|---|---|
| Points per series, cartesian families | 500 | `SP008` |
| Sectors, polar families | 60 | `SP008` |
| Categories, `ChordRing` | 12 | `SP010` |
| Path data per chart | 40 KB | `SP011` |
| Weight of `@silverpoint/core` + `react` with one chart | 45 KB min+gzip | CI fails (REQ-164) |
| Geometry computation, 100 points | 2 ms | The CI benchmark fails |
| `dashboard` subpath, per adapter, over its one-chart build | 2 KB min+gzip for React and Vue, 3 KB for Angular | CI fails (REQ-220) |
| Cells per dashboard | 24 (advisory) | No diagnostic; documented guidance, rendered anyway |
| Dashboard layout resolution, 24 cells | 0.5 ms | The CI benchmark fails |
| Reference 12-card dashboard, server HTML | 480 KB | `tools/path-weight` fails the PR |
| One component's subpath over the shared UI runtime | 3 KB min+gzip | CI fails (REQ-330) |
| Shared UI runtime (core `ui/*` + adapter base), per adapter | 8 KB min+gzip | CI fails (REQ-330) |
| `@silverpoint/grounds/ui.css` | 24 KB gzip | CI fails (REQ-330) |
| Items per Tabs / Segmented / RadioGroup / Steps | 12 (advisory) | No diagnostic; documented |
| Keyboard transition in the core | 0.05 ms | The CI benchmark fails |
| Observations, binned and density charts | 10 000 | `SP008` (REQ-443) |
| Drawn points: beeswarm, polar scatter, connected scatter, Delaunay | 500 | `SP008` |
| Intervals | 200 | `SP008` |
| Hierarchy nodes | 500 | `SP008` |
| Network nodes / links | 150 / 600 | `SP008` |
| Field grid (contours, vector field) | 60 × 60 | `SP008` |
| Groups in box, violin, ridgeline | 12 (advisory) | No diagnostic; documented |
| Statistic over 1 000 observations | 4 ms | The CI benchmark fails (REQ-445) |
| 60 × 60 field | 8 ms | The CI benchmark fails |
| 150-node network layout (300 iterations) | 16 ms | The CI benchmark fails |
| `core` + `react` with one chart of §7.3 | 45 KB min+gzip, as any chart | CI fails (REQ-164) |
| One-chart build of any of the 60 charts, against `0.6.0` (`one-chart-0.6.0.json`) | Within 2 KB (2,000 B) of uncompressed minified bytes (gzip moves when the bundler only reorders modules). *Amended in implementation (feature-004):* re-baselined from `0.3.0` and 0.25 KB, to hold the palette on the chart path | CI fails (REQ-444, REQ-519) |
| `@silverpoint/core/catalog`, everything | 75 kB min+gzip | CI fails |
| One component's subpath of §7.4 over the shared UI runtime | 3 KB min+gzip | CI fails (REQ-518) |
| Overlay runtime over the shared UI runtime, per adapter | 4 KB min+gzip | CI fails (REQ-518) |
| `@silverpoint/grounds/ui.css`, with the components of §7.4 | 24 KB gzip | CI fails |
| `@silverpoint/grounds/timeline.css` | 6 KB gzip | CI fails |
| `SpTimeline` wrapper, without TimelineJS | 3 KB min+gzip | CI fails (REQ-518) |
| One-chart build with a `palette` | Holds none of the presets it does not import | CI fails (REQ-519) |
| Table rows | 1,000 (advisory) | No diagnostic; documented: page with `SpPagination` |
| Select and menu items | 50 (advisory) | No diagnostic |
| MCP request body, rows in `data`, any string | 256 KB, 5,000, 1,000 characters | `limit_exceeded` (§14.8, REQ-560) |

*Amended in implementation:* the increments are size-limit rows with absolute limits, as
REQ-330's are: 64 rows, the 21 new subpaths × 3 adapters and Angular's `ui/overlay` entry. A
component's subpath is held at 11 kB (the 8 kB UI runtime and its 3 kB), an overlay's at 15 kB (and
4 kB of overlay runtime). Angular's overlay runtime is an entry of its own, `ui/overlay`, at 12 kB;
React and Vue keep theirs inside each overlay's bundle, so their 4 KB is held by the overlay rows.
*Amended in implementation:* `SpTimeline`'s 3 KB is written the same way, 11 kB per adapter
with TimelineJS left out (`ignore`), on `@silverpoint/<adapter>/timeline`.
*Amended in implementation (user decisions 2026-10-18 and 2026-10-19, OQ-C3):* REQ-444's
no-growth check is re-baselined from `one-chart-0.3.0.json` to `tools/bundle-budget/one-chart-0.6.0.json`
(244 entries, measured on a `0.6.0` worktree) with a 2 KB allowance, which holds the palette on the
chart path (the delta proposed 1 KB); the REQ-444 row above states it.

## 13. Versioning and deprecation

SemVer over the public surface of §2.

- **Major**: removing or renaming a prop, a component, an `SPNNN` code, a `--sp-` variable
  or a `part`; changing a default value observably.
- **Minor**: adding charts, components, subpaths, stylesheets, optional props and tokens, grounds, palette presets, new codes, and an optional peer imported by one subpath only (feature-004 is `minor`, shipped as `0.7.0`).
- **Patch**: fixes that do not alter the normalised SVG output. A change that does alter
  it **is not a patch**, even if it is a visual improvement: it breaks the golden images of
  consumers using the same gate.

Deprecation: a prop marked `@deprecated` warns for at least two minor versions before
being removed in the next major. The eight packages (the seven of §1 and `@silverpoint/mcp`) are always published with the same
version.

## 14. Agent access (feature-005)

An agent reads silverpoint through one generated document, the agent catalog, and through the
`@silverpoint/mcp` server and the skills that are views of it (PRD §6.14). This is the library's
one network surface: public, read-only and stateless.

### 14.1 Package and entry points

| Package | Entry | Exports |
|---|---|---|
| `@silverpoint/mcp` (new) | `.` | `createServer(options?)` → an MCP `McpServer` with every tool, resource and prompt; `AGENT_CATALOG` (the parsed catalog); `type AgentCatalog` and the types of Data Model §2.28 |
| `@silverpoint/mcp` | `./http` | `handler(request: Request): Promise<Response>` — stateless Streamable HTTP (Web `Request`/`Response`, so any serverless runtime) |
| `@silverpoint/mcp` | `bin: silverpoint-mcp` | stdio transport: `npx @silverpoint/mcp` |
| `@silverpoint/mcp` | `./agent-catalog.json` | the catalog file itself |

`@silverpoint/mcp` depends on `@silverpoint/core` and `@silverpoint/grounds` (`workspace:*`, so always
the same version) and on the MCP TypeScript SDK; it has no peer dependencies and no framework. It is
never imported by the adapters, and no adapter imports it.

### 14.2 The agent catalog (summary; shape in Data Model §2.28)

```jsonc
{
  "schema": 1,
  "version": "0.8.0",                       // the library version described
  "reflex": { "version": "0.8.0", "wraps": "0.8.0", "stale": false },
  "frameworks": ["react", "vue", "angular", "reflex"],
  "common": { "chart": [/* PropEntry */], "ui": [/* PropEntry */] },
  "charts": [
    {
      "slug": "sankey-chart", "family": "flows", "summary": "Flows between stages, widths by value.",
      "data": { "shape": "links", "fields": [{ "role": "source", "type": "string" }, …] },
      "intents": ["flow", "part-to-whole"],
      "names": { "react": "SankeyChart", "vue": "SpSankeyChart", "angular": "sp-sankey-chart", "reflex": "sankey_chart" },
      "imports": { "react": "@silverpoint/react/sankey-chart", "vue": "@silverpoint/vue/sankey-chart",
                   "angular": "@silverpoint/angular/sankey-chart", "reflex": "reflex_silverpoint_react" },
      "props": [{ "name": "sourceKey", "reflex": "source_key", "type": "Accessor<string>", "optional": true, "default": "'source'", "doc": "…" }],
      "demo": "SANKEY_CHART_DEMO"
    }
  ],
  "components": [ /* slug, family (ui|composed|overlay), group, names, imports, props, binding, events, slots */ ],
  "dashboard": { … }, "grounds": [ … ], "palettes": { "fields": [ … ], "presets": { … } },
  "timeline": { … }, "diagnostics": [ { "code": "SP011", "severity": "warn", "req": "REQ-097", "what": "…", "todo": "…" } ],
  "stylesheets": { "always": ["@silverpoint/fonts/fonts.css", "@silverpoint/grounds/styles.css"], "ui": ["@silverpoint/grounds/ui.css"], "timeline": [ … ] }
}
```

### 14.3 Tools (REQ-539)

Every result is `structuredContent` (matching the tool's output schema) plus a short text summary,
and carries `version` (REQ-550). Errors are tool errors (`isError: true`) with `{ code, message,
suggestions? }`; codes: `unknown_name`, `invalid_input`, `limit_exceeded`, `render_failed`
(REQ-549, REQ-560).

| Tool | Input | Output |
|---|---|---|
| `get_version` | — | `{ version, reflex: { version, wraps, stale }, protocol }` |
| `list_charts` | `{ family?, intent?, shape? }` | `{ charts: [{ slug, family, summary, intents, shape }] }` |
| `get_chart` | `{ slug, framework? }` | the chart's catalog entry; with `framework`, only that framework's names, import and prop spelling |
| `list_components` | `{ family?: 'ui' \| 'composed' \| 'overlay', group? }` | `{ components: [{ slug, family, group, summary }] }` |
| `get_component` | `{ slug, framework? }` | the component's catalog entry, as `get_chart` |
| `recommend_chart` | `{ shape: DataShape, fields?: FieldDesc[], intent: Intent, rows?: number }` | `{ recommendations: [{ slug, score, reasons: string[] }] }`, ≤ 5, deterministic (REQ-540) |
| `generate_code` | `{ target: { chart } \| { component }, framework, fields?: Record<role, string>, props?: object, ground?, substrate?, mode?, palette? }` | `{ imports: string[], stylesheets: string[], code: string, notes: string[] }` (REQ-541, REQ-547) |
| `validate_props` | `{ chart, props, width?, height? }` | `{ valid: boolean, diagnostics: [{ code, severity, req, message, todo }], unknownProps: string[] }` (REQ-542) |
| `render_chart` | `{ chart, props?, data?, width? (320..1600, 480), height?, id?, ground?, substrate?, mode?, palette?, embedFonts?: boolean }` | `{ svg: string, width, height, diagnostics[] }` (REQ-543) |
| `check_palette` | `{ palette: Palette \| presetName, substrate? }` | `{ findings: PaletteFinding[] }` (REQ-545) |
| `search_catalog` | `{ query: string, limit? (≤ 20) }` | `{ hits: [{ kind: 'chart' \| 'component' \| 'prop' \| 'diagnostic' \| 'guide', slug, title, snippet }] }` — token match over names, summaries, docs; no embeddings |

`DataShape` ∈ `series` (x → one or more values), `categories` (label → value), `parts` (label →
share of a whole), `matrix` (row × column → value), `hierarchy` (parent/child or nested), `links`
(source → target → value), `points` (x, y, size?), `distribution` (samples of one variable),
`intervals` (low/high or OHLC), `events` (date → item), `single` (one figure, optional target),
`field` (a 2-D scalar or vector field). `Intent` ∈ `trend`, `compare`, `rank`, `part-to-whole`,
`distribution`, `correlation`, `flow`, `hierarchy`, `change`, `uncertainty`, `progress`,
`schedule`, `kpi`, `network`. The rule table is Data Model §2.31.

`generate_code` emits, per framework: the stylesheet imports of `stylesheets`; the component
import from its subpath; the element with the accessor props mapped from `fields`; `title` and
`label`; `ground`, `substrate`, `mode`, `palette` when given. Reflex code is a page function with
`rx` imports and builder calls; state-driven values are left as `State.<name>` placeholders named in
`notes`. Overlays get a native `<button type="button">` (Angular `spTrigger`, Reflex `trigger="…"`) as `trigger` while delta-014 is
open (REQ-547).

### 14.4 Resources (REQ-546)

| URI | Content |
|---|---|
| `silverpoint://catalog` | `agent-catalog.json` (`application/json`) |
| `silverpoint://charts/{slug}` | one chart entry (template resource, listable) |
| `silverpoint://components/{slug}` | one component entry |
| `silverpoint://diagnostics` | the 25 codes |
| `silverpoint://guides/{topic}` | the `silverpoint` skill's references as Markdown: `choosing-charts`, `grounds-and-palettes`, `dashboard`, `ui-components`, `overlays`, `timeline`, `react`, `vue`, `angular`, `reflex` |

### 14.5 Prompts (REQ-548, SHOULD)

| Prompt | Arguments | Sequence it asks for |
|---|---|---|
| `choose-chart` | `description` (the data and the question) | `recommend_chart` → `render_chart` of the top two → `generate_code` |
| `build-dashboard` | `framework`, `charts` (a list of needs) | per need `recommend_chart`; then the dashboard layout from the catalog; `generate_code` per cell |

### 14.6 Skills (REQ-552..555)

```
skills/silverpoint/                      (this repository; generated + hand-written)
  SKILL.md                               frontmatter: name, description; body ≤ 500 lines (hand-written + version stamp)
  references/
    choosing-charts.md                   families, shapes, intents, the recommender's table (generated)
    charts/<family>.md                   per chart: summary, data shape, props table, example per framework (generated)
    components.md, overlays.md           (generated tables + hand-written usage)
    grounds-and-palettes.md, dashboard.md, timeline.md
    react.md, vue.md, angular.md         imports, stylesheets, SSR, binding idioms (hand-written)
    pitfalls.md                          (hand-written: delta-014, accessors are field names, tone is density…)
.claude-plugin/marketplace.json          one plugin, "silverpoint", source ./
.claude-plugin/plugin.json               the skill + mcpServers (inline) → https://silverpointweb.vercel.app/mcp

reflex-silverpoint-react/skills/reflex-silverpoint/
  SKILL.md                               builders, State patterns, provider and palettes, the version it wraps
  references/
    charts/<family>.md                   snake_case props tables and examples (generated from reflex-catalog.json)
    components.md, overlays.md, timeline.md, dashboard.md, palettes.md
    state-and-events.md                  controlled/uncontrolled, event payloads, rx.foreach-free data (hand-written)
reflex-silverpoint-react/.claude-plugin/marketplace.json   plugin "reflex-silverpoint": the skill + the same MCP
```

Skill descriptions (frontmatter), verbatim:

- `silverpoint`: "Build charts, dashboards and UI with the silverpoint library (React, Vue, Angular):
  choose the chart, write correct props, grounds and palettes. Use whenever code imports
  @silverpoint/* or the user mentions silverpoint charts."
- `reflex-silverpoint`: "Build silverpoint charts, dashboards and UI in Python with Reflex through
  reflex-silverpoint-react. Use whenever code imports reflex_silverpoint_react or the user wants
  silverpoint in Reflex."

### 14.7 Official site (REQ-564, REQ-565; `silverpoint_web`)

| Path | Content |
|---|---|
| `/mcp` | rewrite to the MCP deployment (`vercel.json`), excluded from the SPA catch-all |
| `/agent-catalog.json` | the catalog (REQ-537) |
| `/llms.txt` | the llms.txt index: what silverpoint is, links to `/llms-full.txt`, the docs pages and the MCP |
| `/llms-full.txt` | the catalog as Markdown: every chart and component with props, per framework |
| `/docs/ai` | "Use with AI": MCP URL, client configs (Claude Code `claude mcp add`, Claude connectors, Cursor, VS Code), skill install, `npx @silverpoint/mcp` |

### 14.8 Limits

| Limit | Value | On exceeding it |
|---|---|---|
| Request body | 256 KB | `limit_exceeded` |
| Rows in `data` | 5,000 | `limit_exceeded` |
| Any string | 1,000 characters | `limit_exceeded` |
| Render path data | `PATH_BYTE_BUDGET` (40,000 bytes) | `limit_exceeded` (the core's own budget) |
| `render_chart` width × height | 320..1600 × 120..1200 px | `invalid_input` |
| `search_catalog` limit | 20 | clamped |
| Calls per client address | 60 / min (SHOULD) | HTTP 429 |

*Amended in implementation:*

- `render_chart` takes no `format`: the PNG output (REQ-544) is deferred (PRD §6.14). The SVG holds
  the grounds' `styles.css`, minified, as a `<style>` that is the root's first child; with
  `embedFonts`, the EB Garamond 400 face as a data URI. `props` may not carry `data`, size, `id` or
  appearance (they are inputs of their own) nor an undeclared prop (`unknown_name`), where
  `validate_props` lists it. Without a width, `validate_props` and `render_chart` use 480.
- `check_palette` also returns the substrate it measured against; `substrate` is a hex or a
  built-in ground's substrate name.
- Enum-like inputs (`framework`, `family`, `shape`, `intent`, `ground`…) are strings in the schemas,
  checked by the tools, so a typo is a `unknown_name` error with suggestions, not a protocol error.
  Names resolve by slug or by any framework's name, case and separators ignored.
- `./http`'s `handler` answers POST; GET and DELETE answer 405 with `allow`, OPTIONS the CORS
  preflight (any origin: the endpoint is public, read-only, without credentials). Responses are JSON,
  without a session id. The body limit holds before the body is parsed: 413 from `content-length`,
  or while streaming a body without one; a body that is not JSON is a -32700 parse error.
- `silverpoint://guides/{topic}` is served from a module generated beside the skill, so the server
  reads no file at run time; an unknown resource name carries the closest names in its error.
- The skill adds `references/reflex.md` (the builders and two examples, pointing to the
  `reflex-silverpoint` skill) and `references/diagnostics.md` (the 25 codes); the chart references
  are one file per family, among the nine families of Data Model §2.29.
- The plugin declares its server inline in `plugin.json`; a root `.mcp.json` would also connect
  every session opened in the repository. Installed with
  `/plugin marketplace add ecrespo/silverpoint` and `/plugin install silverpoint@silverpoint`.
- The documentation site of this repository has the page of §14.7's `/docs/ai` as `/#/ai`, "Use
  with AI", its tool table read from the server (REQ-569). `/mcp`, `/agent-catalog.json` and the
  `llms` files belong to the official site, `silverpoint_web`.
- The calls-per-address limit (SHOULD) is not implemented: no shared store is configured (REQ-561).

---

## Change History

| Version | Date | Changes |
|---|---|---|
| 1.12 | 2026-10-20 | Feature-005: agent access — §1 adds `@silverpoint/mcp`; new §14 (the package and its entry points, the agent catalog, eleven tools, resources, prompts, the skill and plugin layout, the official site's paths, the endpoint's limits); §12 the MCP limits; §13 eight packages; folds the amendments made in implementation (no PNG, inline plugin server, the `/#/ai` page) in the ledger of `changes/feature-005-agent-access/` |
| 1.0 | 2026-09-13 | Initial version |
| 1.2 | 2026-09-13 | Palette replaced with the one verified against the contrast thresholds (Data Model §3.2) |
| 1.1 | 2026-09-13 | `@silverpoint/fonts` and the `hatchFill` prop are introduced; rounding to 2 decimals; `--sp-font-mono` is removed; `SP011` switches to measuring bytes |
| 1.5 | 2026-09-13 | Vue adapter added: package, naming, a Vue column across the 33-row catalog, §8.3, and Vue emits in §9 |
| 1.4 | 2026-09-13 | §1.1 added: bundler consumption guarantees for Vite and Next.js (REQ-033, REQ-034) |
| 1.3 | 2026-09-13 | Converted to English; diagnostic SP013 added for typeface load failure (Analyze finding A-05) |
| 1.11 | 2026-10-20 | Feature-004: palettes, composed components, overlays and the timeline — §1 and new §1.3 (`@silverpoint/core/palettes`, `/timeline`, `TIMELINE_DEMO` on `/ui-demos`, `grounds/timeline.css`, 21 new `ui/<name>` subpaths × 3 adapters, `timeline` subpath, Angular `ui/overlay`, the optional `@knight-lab/timelinejs` peer), §2 and §2.1 surface (list keyboard, placement, `uiAnchor`, `uiOverlaySync`, view functions and helpers), new §3.4 `Palette` and §3.5 props, `palette` on `CommonChartProps`, `CommonUiProps` and `DashboardProps`, §5.1 defaults and palette precedence, §6 `backdrop` and `rowTone` tokens, new §7.4 catalog and markup contract, §8.1–8.3 adapters (Vue `SilverpointProvider`, Angular `provideSilverpoint` returns a `Provider`), §9 open-state and timeline events, §10.1–10.4, `SP023`–`SP025` (22 → 25 codes), §12 budgets (REQ-518, REQ-519; REQ-444 re-baselined to `0.6.0` with 2 KB), §13; folds the amendments made in implementation in the ledger of `changes/feature-004-composed-components/` |
| 1.10 | 2026-10-10 | Feature-003: the second catalog — §1 (27 subpaths per adapter, `@silverpoint/core/catalog`), new §7.3 (27 charts with heighten and keyboard model per chart, `NetworkNode`, `levels` and `nodes` as data), §9 `onRootChange`, `SP020`–`SP022` (19 → 22 codes), §12 ceilings, benchmarks and the REQ-444 no-growth budget |
| 1.9 | 2026-09-29 | Feature-002: the 17 `Sp` UI components — §1.2 (subpaths `ui`, `ui-demos`, `ui.css`, `server/ui`, `angular/env`; `@angular/forms` peer), §2.1 core surface, §3.3 types and props, §5.1 defaults, `Ground.ui` (§6), new §7.2 catalog and markup contract, §8 adapters, §9 events, §10 parts/properties/accessibility, `SP017`–`SP019` (16 → 19 codes), §12 budgets; includes the Phase 3–5 amendments (Angular `<sp-input>` element, `SpInput.label`, React server entries, `uiRovingFocus` and further core surface) |
| 1.8 | 2026-09-26 | Delta-013: `@silverpoint/tailwind` in §1 and §10.4 |
| 1.7 | 2026-09-26 | Delta-012: `ToneSpec` gains the `weight` variant and `Ground` shows its `tonalRamp`; the built-in grounds table adds `cyanotype` with `WeightInker`; a toned shape's tonal weight level is written as `data-weight` (§10.1) with `--sp-weight-1..4` (§10.2) — an internal stroke field, distinct from `Stroke.weight`; REQ-220's allowance is 3 KB for Angular (§12) |
| 1.6 | 2026-09-25 | Deltas folded: `locale` default identical on server and client (003); `HeatmapChart.columnLabels` (006); `SP002` covers every value a chart cannot draw as given (007); how `OrbitChart` and `VolvelleChart` props read their data (009, 010); view props apply to the demo (011). §7.1 Dashboard composition with `onLinkChange`, parts, CSS variables, accessibility contract, `SP014`–`SP016` and budgets (feature-001). The media query forcing `precision` is stated as an override after resolution (Analyze A-06) |

## Constitution check

- **Art. 2** — §1 and §8 maintain the boundary: the adapters only consume `Geometry`, and
  the ribbon generator (§8.4) lives in the core.
- **Art. 4** — `seed` is a public prop in §5 and is derived from `id` when omitted.
- **Art. 5** — §10.3 fixes the accessibility contract, and §5 establishes that the media
  query forcing `precision` cannot be overridden by prop.
- **Art. 6** — §6 requires every ground to declare its `tonalMechanism`.
- **Art. 7** — §6 defines the ground as a declarative object and `registerGround` as the
  only way to register one.
- **Art. 8** — §3.1 and §10 implement the consequence of not depending on Tailwind: the
  `Inker` emits shape without paint, and color enters through CSS by way of `part`.
- **Art. 3** (v1.5) — §7.1 requires a dashboard `id` and derives chart ids from it, so the
  wrapper and every chart inside are comparable across adapters.
- **Art. 2** (feature-002) — §2.1 puts every UI function in the core; adapters bind props and events.
- **Art. 3** (feature-002) — the markup contract of §7.2 is what the gate compares.
- **Art. 4** (feature-002) — `uiFrameVariant` and the id rule; no framework id hook in emitted ids.
- **Art. 5** (feature-002) — native controls, roles, APG keyboard, exact focus.
- **Art. 8** (feature-002) — no dependency added; `ui.css` opt-in; budgets in §12.
- **Art. 2** (feature-003) — the statistics stay internal and in the core; `rootChangeOf` is the
  core's, the adapters only emit it.
- **Art. 3** (feature-003) — no new `part`; the 27 charts render through each adapter's existing
  chart path, so their markup contract is the first 33's.
- **Art. 5 / Art. 6** (feature-003) — §7.3 names each chart's keyboard model, derived
  `ActiveItem` and single heightened element.
- **Art. 8** (feature-003) — no dependency added; §12 holds the one-chart budget and the no-growth check.
- **Art. 2** (feature-004) — every function of §2.1, §3.4 and `/timeline` is in the core; adapters
  bind props, events and the platform calls (`showModal`, `showPopover`).
- **Art. 3** (feature-004) — the markup contract of §7.4 is what the gate compares; the TimelineJS
  DOM is not markup the library emits.
- **Art. 4** (feature-004) — ids from `id`; placement and timers off the render path; a paused toast
  reads no clock.
- **Art. 5** (feature-004) — native `<dialog>`, `<details>`, `<table>`, `<textarea>`,
  `<input type="number">`; APG for the rest.
- **Art. 8** (feature-004) — no dependency; one optional peer on one subpath; budgets in §12.
- **Requested exception:** none.
