# API Spec delta — palettes, composed components, overlays and the timeline

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 2, approved 2026-10-18 by Ernesto Crespo (drafted the same day) |
| **Amends** | [API Spec](../../specs/api-spec.md) v1.10 → v1.11: §1, §2, §3, §5.1, §6, §7.2, new §7.4, §8.1–8.3, §9, §10.1–10.4, §11, §12 |
| **SemVer** | `minor` — new subpaths, components, an optional prop on every chart and component, a stylesheet, an optional peer, codes (§13). Ships as `0.7.0` |

## 1. Packages and entry points (§1)

No new package (DD-021 holds). One new optional peer, on one subpath.

| Package | Subpath | Exports |
|---|---|---|
| `@silverpoint/core` | `.` (main) | `type Palette`, `type PaletteFinding` (types only) |
| `@silverpoint/core` | `@silverpoint/core/palettes` (new) | `paletteStyle`, `resolvePalette`, `checkPalette`, `contrastRatio`, `PALETTE_PROPERTIES`, `PALETTE_PAIRS`; `silverpoint`, `sanguine`, `sepia`, `ironGall`, `verdigris`, `indigo`, `PALETTES` (one record of the six), `PALETTE_NAMES`. *Amended in implementation (user decision, 2026-10-18):* the functions moved here from the main entry, which they pushed past its 45 kB budget (REQ-164); an unused preset tree-shakes out |
| `@silverpoint/core` | `@silverpoint/core/ui` | Adds the view functions, types and core functions of §2 |
| `@silverpoint/core` | `@silverpoint/core/ui-demos` | `UI_DEMOS` gains one entry per state of the new rows (Data Model §5); `TIMELINE_DEMO` (Data Model §4) |
| `@silverpoint/core` | `@silverpoint/core/timeline` (new) | `timelineView`, `timelineInk` (the probe reader, DOM structural types), `TIMELINE_FRAMES`, `TIMELINE_TONES`, types (`SpTimelineProps`, `TimelineData`). *Amended in implementation (T-208):* the demo data is `TIMELINE_DEMO` on `@silverpoint/core/ui-demos`, not `TIMELINE_EVENTS` here, so no application ships it (REQ-330). *Amended in implementation (T-221):* the client half is here too, so the three adapters share it: `timelineMount` (inks the surface, loads TimelineJS through the adapter's `load`, builds it in the mount, forwards its events, warns `SP025` and calls `failed` on a failed load; its cleanup cancels a pending load and removes only TimelineJS's DOM), `timelineOptions` (drops `font` and `theme`) and `TIMELINE_EVENTS` (TimelineJS's seven event names, each with the name the adapters forward it under) |
| `@silverpoint/grounds` | `@silverpoint/grounds/ui.css` | Adds the rules of the new components (§7) |
| `@silverpoint/grounds` | `@silverpoint/grounds/timeline.css` (new) | The TimelineJS skin (REQ-511). Opt-in |
| `@silverpoint/react` | `ui/<name>`, `server/ui/<name>`, `ui` barrel | `SpSurface`, `SpGlyph`, `SpTable`, `SpPagination`, `SpBreadcrumb`, `SpAvatar`, `SpAvatarGroup`, `SpStatistic`, `SpDescriptions`, `SpTimelineList`, `SpCollapse`, `SpCollapseItem`, `SpEmpty`, `SpResult`, `SpTextarea`, `SpInputNumber`, `SpModal`, `SpDrawer`, `SpPopover`, `SpTooltip`, `SpSelect`, `SpDropdownMenu`, `SpToast`, `SpToaster` |
| `@silverpoint/react` | `@silverpoint/react/timeline` (new) | `SpTimeline` |
| `@silverpoint/vue` | `ui/<name>`, `ui`, `timeline` | The same names |
| `@silverpoint/angular` | `ui/<name>`, `ui`, `timeline` (secondary entry points) | `sp-surface`, `sp-glyph`, `sp-table`, `sp-pagination`, `sp-breadcrumb`, `sp-avatar`, `sp-avatar-group`, `sp-statistic`, `sp-descriptions`, `sp-timeline-list`, `sp-collapse`, `sp-collapse-item`, `sp-empty`, `sp-result`, `sp-textarea`, `sp-input-number`, `sp-modal`, `sp-drawer`, `sp-popover`, `sp-tooltip`, `sp-select`, `sp-dropdown-menu`, `sp-toast`, `sp-toaster`, `sp-timeline`. *Amended in implementation (T-213):* the surface is the attribute component `[spSurface]` (DD-024): the consumer's own element is the root, so `as` does not apply in Angular, and `sp-ui-tree` needs no case for every tag `as` may name; `sp-empty` and `sp-result` take `<ng-template spExtra>`, the card's `SpCardExtra`, re-exported from their entry points |

Subpath names: `ui/avatar` exports `SpAvatar` and `SpAvatarGroup`; `ui/collapse` exports
`SpCollapse` and `SpCollapseItem`; `ui/toast` exports `SpToast` and `SpToaster`.

**Peer dependencies.** `@knight-lab/timelinejs` `^3.9.13` is added to the `peerDependencies` of the
three adapters with `peerDependenciesMeta: { optional: true }`. Only the `timeline` subpath imports it,
dynamically, on the client (REQ-510, REQ-513). TimelineJS's own stylesheet
(`@knight-lab/timelinejs/dist/css/timeline.css`) is imported by the consumer before ours.
*Amended in implementation (T-221):* the subpath imports `@knight-lab/timelinejs/src/js/timeline/Timeline.js`,
not the package entry: 3.9.13's entry imports a Less stylesheet that no consumer bundler loads
without a loader (esbuild, the engine of Vite and the Angular CLI, refuses it), while `Timeline.js`
is plain ES modules that split into a chunk of their own. The package ships no types; the adapters
read the module as `TimelineJsModule`. The adapters also carry it as an exact dev dependency
(`3.9.13`), for their tests. The import is a literal, so a consumer who imports the `timeline`
subpath must install the peer (PRD REQ-515 as amended).

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

## 2. Types (§3)

### Palettes

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

`palette?: Palette` is added to `CommonChartProps`, `CommonUiProps`, `DashboardProps`,
`ProviderConfig` and `SpTimelineProps`. *Amended in implementation (T-212, DD-037):*
`nestProvider(outer, own)` joins `@silverpoint/core/palettes` (a nested provider's set fields win, the
rest are inherited, palettes merge field by field); Vue exports a `SilverpointProvider` component
(props `ground`, `substrate`, `mode`, `locale`, `palette`; renders its slot and no element) for
sections; Angular's `provideSilverpoint` returns a `Provider` instead of `EnvironmentProviders`, so it
is accepted in a component's `providers` as well as at bootstrap; a dashboard's root carries its own
palette, not the provider's; `ChartHandle.toSVGString()` writes the palette on its `<svg>`. Presets are `Palette` objects; the prop takes the object, not
a name, so a chart that names no preset ships none (REQ-463, REQ-519). Reflex's string names map to
`PALETTES[name]` for consumers who want them.

### Composed components (own props, beside `CommonUiProps`, which now includes `palette`)

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

### Overlays

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

Reflex's `left`/`right` become `start`/`end` (REQ-523: logical sides mirror in RTL).

**Open-state binding** (REQ-500), as value binding (REQ-322):

| | Controlled | Uncontrolled | Change |
|---|---|---|---|
| React | `open` | `defaultOpen` | `onOpenChange(open)` |
| Vue | `v-model:open` | `default-open` | `update:open` |
| Angular | `[(open)]` (`model()`) | `[defaultOpen]` | `(openChange)` |

Value binding of Pagination, Textarea, InputNumber and Select follows REQ-322 (`current` for
Pagination: React `current`/`defaultCurrent`/`onChange`, Vue `v-model:current`, Angular `[(current)]`).
*Amended in implementation (T-214):* an InputNumber reports what is typed on commit (blur or Enter;
`change` in Vue and Angular), clamped and rounded by `uiNumberValue`, `null` when emptied; its steppers
report `uiNumberStep` at once. Clamping on every keystroke would rewrite a value mid-typing.

### The timeline

| Component | Props | Events |
|---|---|---|
| **Timeline** | `data: TimelineData` (TimelineJS JSON: `title`, `events`, `eras`, `scale`), `options?: Record<string, unknown>` (`font`, `theme` ignored), `height?: string` (`'600px'`), `inkedFrames?` (`true`), `card?` (`true`), `label?` (accessible name of the region) | `change(uniqueId)`, `loaded(payload)`, `navNext`, `navPrevious`, `zoomIn`, `zoomOut`, `backToStart`; slot `fallback` |

*Amended in implementation (T-221):* in each framework's idiom, the events are React's `onChange`,
`onLoaded`, `onNavNext`, `onNavPrevious`, `onZoomIn`, `onZoomOut` and `onBackToStart` props, Vue's
emits and Angular's outputs, under the names above; the fallback is React's `fallback` prop, Vue's
`fallback` slot and Angular's `<ng-template spFallback>` (`SpTimelineFallback`, exported from the
`timeline` entry). `fallback` joins the core's `UiSlot`; `timelineView` takes `{ failed }` and puts
the slot in the mount once a load has failed, never on the server. TimelineJS is built again when
`data`, `options` or `inkedFrames` change.

*Amended in implementation (T-222):* TimelineJS is built in a `<div>` of its own inside the mount,
since it rewrites its container's `className` (`tl-timeline`), and on a copy of `data`
(`structuredClone`), since it writes each slide's `unique_id` into the data it is given: the
consumer's object is never touched, and a frozen one (`TIMELINE_DEMO`) no longer stops the build. An
error thrown while TimelineJS is built is a failed load (REQ-515): its container is removed, `SP025`
is warned and the fallback is shown. TimelineJS 3.9.13 has no destroy method: the cleanup removes its
DOM, but its listeners on `document` (keydown) and `window` (resize) stay until the page goes.

### Core internal surface (§2) — additions on `@silverpoint/core/ui`

```ts
/** Rows in order of `key`, stable; null/undefined last; numbers before strings; strings by code point after lowercasing. Pure (REQ-474). */
export function uiSortRows<T extends Datum>(rows: readonly T[], key: string | undefined, order?: 'asc' | 'desc'): readonly T[];

/** 1, a gap, a window of 2·siblings + 1 around `current`, a gap, `count` (REQ-476). */
export function uiPageWindow(count: number, current: number, siblings: number): readonly (number | 'start-gap' | 'end-gap')[];

/** Pages, the corrected current page and the "start–end of total" numbers (SP017 when current is out of range). */
export function uiPagination(total: number, pageSize: number, current: number, component?: string): { count: number; current: number; start: number; end: number; corrected: boolean };

/** Clamp to min/max, round to `precision` decimals; null stays null (REQ-485, SP017 on correction when `warn`). */
export function uiNumberValue(value: number | null, range: { min?: number; max?: number; precision?: number }, component?: string): { value: number | null; corrected: boolean; atMin: boolean; atMax: boolean };

/** `value ± step`, from `min ?? 0` when the value is null, then uiNumberValue. */
export function uiNumberStep(value: number | null, direction: 1 | -1, range: { min?: number; max?: number; step?: number; precision?: number }): number;

/** First letters of the first two words, upper-cased; '?' for none. */
export function uiInitials(name: string | undefined): string;

/** APG listbox / menu transitions: next active index, or open/close/select intents (REQ-494, REQ-495). Pure. */
export function uiListKey(
  state: { readonly active: number; readonly count: number; readonly disabled: readonly boolean[]; readonly open: boolean },
  key: string,
  kind: 'listbox' | 'menu',
): { readonly active: number; readonly intent?: 'open' | 'close' | 'select' };

/** Typeahead: the first enabled label starting with `buffer` after `from`, wrapping; -1 for none. */
export function uiTypeahead(labels: readonly string[], disabled: readonly boolean[], buffer: string, from: number): number;

export interface Box { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
/** Anchored placement with flip and shift, 2 decimals (REQ-493). Pure. */
export function uiPlace(input: {
  readonly anchor: Box;
  readonly floating: { readonly width: number; readonly height: number };
  readonly viewport: { readonly width: number; readonly height: number };
  readonly side: 'top' | 'end' | 'bottom' | 'start';
  readonly align: 'start' | 'center' | 'end';
  readonly offset: number;
  readonly padding: number;
  readonly dir: 'ltr' | 'rtl';
}): { readonly x: number; readonly y: number; readonly side: 'top' | 'end' | 'bottom' | 'start'; readonly align: 'start' | 'center' | 'end' };

/**
 * The DOM side of an anchored overlay, as uiRovingFocus is for REQ-315: measures the anchor and the
 * overlay, calls uiPlace, writes --sp-ui-x / --sp-ui-y and data-side. Structural types, no DOM library.
 * Client only, on open, scroll and resize.
 */
export function uiAnchor(anchor: ElementLike, floating: ElementLike, options: AnchorOptions): () => void;  // returns the cleanup
// Amended in implementation (T-219): also re-places when the anchor or the overlay changes size
// (a ResizeObserver, where the engine has one), as when a web font replaces its fallback.
// Amended in implementation (T-215): opens or closes a <dialog> (showModal/show/close) or a popover
// (showPopover/hidePopover) as `open` says, only from the other state; no Popover API, no call.
export function uiOverlaySync(element: UiOverlayElement, kind: 'modal' | 'dialog' | 'popover', open: boolean): void;
```

View functions, one per catalog row, as in `0.3.0`: `uiSurfaceView`, `uiGlyphView`, `uiTableView`,
`uiPaginationView`, `uiBreadcrumbView`, `uiAvatarView`, `uiAvatarGroupView`, `uiStatisticView`,
`uiDescriptionsView`, `uiTimelineListView`, `uiCollapseView`, `uiCollapseItemView`, `uiEmptyView`,
`uiResultView`, `uiTextareaView`, `uiInputNumberView`, `uiModalView`, `uiDrawerView`,
`uiPopoverView`, `uiTooltipView`, `uiSelectView`, `uiDropdownMenuView`, `uiToastView`,
`uiToasterView`. The view element's `bind` gains `trigger`, `dialog`, `popover`, `option`,
`menuitem`, `sort`, `page`, `stepper` and `summary` (TD §2).

`UI_COMPONENTS` gains the 21 rows of Data Model §5 with a `family: 'ui' | 'composed' | 'overlay'`
field (the 17 existing rows are `ui`) and batches `A1`, `A2`, `B`.

## 3. Default values (§5.1) — additions

| Prop | Default | Note |
|---|---|---|
| `palette` | none | The ground's own colours |
| overlay `open` | `false` | `defaultOpen` sets the uncontrolled initial state |
| `SpToaster` `duration` | `5000` ms | A toast's own `duration` wins |
| `SpTimeline` `height` | `'600px'` | |

Palette precedence (REQ-462): element → dashboard → provider, field by field. A palette does not
take part in the `precision` override: forced `precision` changes the mode, never the colours, and
`forced-colors: active` is the browser's.

## 4. §7.2 UI component catalog — markup contract additions (normative, REQ-516)

Every root carries the `0.3.0` root contract (`sp-ui sp-<slug> sp-ground-<ground>`, `data-ground`,
`data-substrate`, `data-mode`, `data-size`, `data-frame`) and, with a palette, `style` holding
`paletteStyle(...)` followed by any style the component computes and the consumer's own.

| Component | Root | Native / semantic core | Drawn parts |
|---|---|---|---|
| Surface | the `as` element | itself | `sp-frame` (`frame`), `sp-tone` (`tone`) |
| Glyph | `<svg part="sp-mark" data-glyph viewBox="0 0 16 16" aria-hidden>` | — | the exact path |
| Table | `<div class="sp-ui sp-table">` with `data-striped`, `data-hoverable` | `<div class="sp-ui-table-scroll"><table class="sp-ui-table">`, `<caption>`, `<th scope="col" data-align aria-sort>`, sortable headers hold `<button class="sp-ui-sort">` | `sp-frame` (card, when `bordered`), sort `sp-mark`, row tone by `ui.css` |
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
| InputNumber | `<span class="sp-ui sp-input sp-input-number">` | `<button class="sp-ui-stepper" aria-label>` − `<input type="number" inputmode="decimal">` + | `sp-frame` (control), `dash` / `plus` `sp-mark`s |
| Modal | `<dialog id="${id}--dialog" class="sp-ui sp-modal" aria-labelledby\|aria-label data-state>` | header `<h2 id="${id}--title">`, `<p id="${id}--description">`, body, footer; close `<button class="sp-ui-icon-button">` | `sp-frame` (card), `sp-rule` under the header; `::backdrop` toned by `ui.css` |
| Drawer | `<dialog class="sp-ui sp-drawer" data-side>` | as Modal | as Modal |
| Popover | `<div class="sp-ui sp-popover" popover="auto" id="${id}--popover" role="dialog" aria-labelledby?>` | header, body | `sp-frame` (card) |
| Tooltip | `<div class="sp-ui sp-tooltip" popover="manual" role="tooltip" id="${id}--tooltip">` | text | `sp-frame` (control) |
| Select | `<span class="sp-ui sp-select">` | trigger `<button role="combobox" aria-haspopup="listbox" aria-expanded aria-controls aria-activedescendant? aria-label>` with the value; `<div class="sp-ui-select-content" popover="auto">` holding `<div role="listbox" id="${id}--listbox">` of `<div role="option" id="${id}--option-<key>" aria-selected aria-disabled?>`; a hidden `<input type="hidden" name>` when `name` | `sp-frame` (control) on the trigger, `sp-frame` (card) on the list, `sp-heighten` on the active option, tick `sp-mark` on the chosen, chevron `sp-mark` |
| DropdownMenu | `<span class="sp-ui sp-dropdown-menu">` | trigger `aria-haspopup="menu" aria-expanded aria-controls`; `<div popover="auto" role="menu" id="${id}--menu">` of `<div role="menuitem" tabindex="-1" data-danger? aria-disabled?>`, `role="separator"`, `role="presentation"` labels | `sp-frame` (card), `sp-heighten` on the active item |
| Toast | `<li class="sp-ui sp-toast" data-kind data-state>` | `<div class="sp-ui-toast-body" role="status\|alert">` with the kind glyph, title and description; action, close `<button>` (*amended in implementation:* the role moved off the `<li>`, which may not take one) | `sp-frame` (card), kind `sp-mark` |
| Toaster | `<section class="sp-ui sp-toaster" aria-label data-position>` holding `<ol>` | — | — |
| Timeline | `<section class="sp-ui sp-timeline" aria-label data-kl-inked data-kl-card>` | `<span class="sp-kl-probe" aria-hidden>` probes, `<div class="sp-kl-mount">` | `sp-frame` (card, when `card`) |

Rules (as in `0.3.0`): no framework comments or empty text nodes; element order is reading order;
every id is `${id}--${part}`; overlays emit `data-state="open|closed"`, never the `open` attribute
(the browser sets it on `showModal()`); placement is written on the overlay as `--sp-ui-x`,
`--sp-ui-y` and `data-side` after open, never in the server markup (REQ-502).

*Amended in implementation (T-223):* a disabled `SpCollapseItem`'s `<summary>` carries
`tabindex="-1"` beside `aria-disabled="true"`, since `<summary>` has no `disabled` attribute and Tab
must skip it (REQ-522). The toaster's list is `<ol class="sp-ui-toaster-list" role="list">` and a
toast is `<li role="listitem">`: in Angular the `<sp-toast>` host sits between them, and only explicit
roles let a list keep its items across it (axe `list` / `listitem`).

## 5. API by adapter (§8) — additions

- **React (§8.1):** function components; `forwardRef` to the native element (`<textarea>`, the
  number `<input>`, the Select's trigger, the `<dialog>`). Overlay triggers are a `trigger` prop
  (`ReactElement`) that the overlay clones with its ARIA and handlers, as the dashboard clones its
  charts. `"use client"` on every overlay, Pagination, Textarea, InputNumber, sortable Table,
  Collapse with `onToggle`, and `SpTimeline`. *Amended in implementation (T-214):* Pagination, Collapse,
  CollapseItem, Textarea and InputNumber are client components only, with no `server/ui/*` entry, as
  `0.3.0`'s Input: a disabled CollapseItem is held shut by a handler.
  *Amended in implementation (T-216):* the overlays are client components only too, and an overlay
  finds its trigger as the element rendered just before it, so no ref is merged into the consumer's.
- **Vue (§8.3):** slots `trigger`, `footer`, `action`, `extra`, `fallback`; `v-model`, `v-model:open`,
  `v-model:current`.
  *Amended in implementation (T-216):* a `trigger` slot's first element is cloned with the ARIA and
  the toggle; DropdownMenu emits `select(key)`, Select `update:modelValue(key)`.
- **Angular (§8.2):** standalone, signal inputs, `OnPush`; `open = model<boolean>()`; triggers are
  projected with an `spTrigger` directive on the consumer's element (`<button spButton spTrigger>`);
  footers and actions as `<ng-template spFooter>`, `spAction`, `spExtra`, `spFallback`.
  `SpTextarea`, `SpInputNumber` and `SpSelect` extend `SpUiControl` (ControlValueAccessor).
  *Amended in implementation (T-215, T-216):* `SpTrigger`, the base `SpUiOverlay` and the helpers
  `uiOverlayNative` and `uiListKeys` live on a new entry, `@silverpoint/angular/ui/overlay`, apart
  from `ui/base`: Angular's partial declarations are not tree-shaken, and in `ui/base` they put
  every component over its REQ-330 budget (`SpDivider` at 8,217 B of 8 kB). Each overlay subpath
  re-exports `SpTrigger`. A Modal's or Drawer's footer is `<ng-template spFooter>` (`SpCardFooter`,
  re-exported); a toast's action is `<ng-template spAction>` (`SpToastAction`). `SpTrigger` writes
  its ARIA on the server as well. The Select and the Menu listen on their host for the keys and
  clicks of their tree.

## 6. Events and interaction (§9) — additions

Value and open events fire on user input only, never on a prop change, never when disabled
(REQ-326). Overlay keyboard: `uiListKey` / `uiTypeahead` (REQ-494, REQ-495), the typeahead buffer
reset 500 ms after the last key by the adapter. `SpModal` with `dismissible: false` cancels the
dialog's `cancel` event. Toasts pause their timer on `pointerenter` and `focusin`. F8 moves focus to
the toaster region. *Amended in implementation (T-216):* a paused toast counts its whole duration again once the
pointer and focus have left it (no clock is read, Art. 4); F8 makes the region focusable
(`tabindex="-1"`) as it moves focus there.
*Amended in implementation (T-223):* a tooltip listens for Escape on its document, not on its
trigger, so a tooltip shown by hover is dismissed without moving the pointer or focus (WCAG 1.4.13).

## 7. DOM and CSS contract (§10) — additions

### 10.1 `part` attributes

No new value. `sp-mark` covers the ten new glyphs.

### 10.2 Public CSS custom properties — new

| Property | Default | |
|---|---|---|
| `--sp-avatar-size` | 40 px (28 / 56 for `sm` / `lg`) | Avatar box |
| `--sp-descriptions-columns` | `3` | Written by the core from `columns` |
| `--sp-textarea-rows` | `3` | Written by the core from `rows` |
| `--sp-modal-width`, `--sp-drawer-size`, `--sp-popover-width`, `--sp-select-width` | 520 px, 380 / 320 px, 320 px, 180 px | Written by the core from the props |
| `--sp-ui-x`, `--sp-ui-y` | — | Placement, written by `uiAnchor` on open |

### 10.3 Accessibility contract — additions

As REQ-473..REQ-503 and the markup table. The drawing never takes focus and never carries a name.

### 10.4 Tailwind preset — addition

`@silverpoint/tailwind` gains nothing: palettes set the same nine properties it already maps.

## 8. Catalog of errors and warnings (§11) — additions

| Code | Severity | Requirement | Condition |
|---|---|---|---|
| `SP023` | warn | REQ-466 | A palette's hex field is below its contrast threshold against its substrate |
| `SP024` | warn | REQ-467 | A palette has an unknown field, or a value that is not a CSS colour; the field is dropped |
| `SP025` | warn | REQ-515 | `@knight-lab/timelinejs` could not be loaded; `SpTimeline` renders its fallback |

`SP017`, `SP018` and `SP019` widen to the new components (REQ-486, REQ-501, REQ-487). The total goes
from 22 to 25 codes.

## 9. Limits and budgets (§12) — additions

| Limit | `0.x` value | Behaviour on exceeding it |
|---|---|---|
| One component's subpath over the shared UI runtime | 3 KB min+gzip | CI fails (REQ-518) |
| Overlay runtime over the shared UI runtime, per adapter | 4 KB min+gzip | CI fails (REQ-518) |
| `ui.css` | 24 KB gzip | CI fails |
| `timeline.css` | 6 KB gzip | CI fails |
| `SpTimeline` wrapper, without TimelineJS | 3 KB min+gzip | CI fails |
| One-chart builds | REQ-444 allowance | CI fails (REQ-519) |
| Table rows | 1,000 (advisory) | No diagnostic; documented: page with `SpPagination` |
| Select and menu items | 50 (advisory) | No diagnostic |

*Amended in implementation (T-221):* `SpTimeline`'s 3 KB is written the same way, 11 kB per adapter
with TimelineJS left out (`ignore`), on `@silverpoint/<adapter>/timeline`.

*Amended in implementation (T-220):* the increments are size-limit rows with absolute limits, as
REQ-330's are: a component's subpath 11 kB (the 8 kB UI runtime and its 3 kB), an overlay's 15 kB
(and 4 kB of overlay runtime). Angular's overlay runtime is an entry of its own, `ui/overlay`, at
12 kB; React and Vue keep theirs inside each overlay's bundle.

## Constitution check

- **Art. 2** — every function above is in the core; adapters bind props, events and the platform calls (`showModal`, `showPopover`).
- **Art. 3** — the markup contract of §4 is what the gate compares; the TimelineJS DOM is not markup the library emits.
- **Art. 4** — ids from `id`; placement and timers off the render path.
- **Art. 5** — native `<dialog>`, `<details>`, `<table>`, `<textarea>`, `<input type="number">`; APG for the rest.
- **Art. 8** — no dependency; one optional peer; budgets.
- **Exception requested:** none.
