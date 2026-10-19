# Implementation Plan and Tasks — Phase 8, the Reflex 0.7 inventory

> Source specs: [`prd-delta.md`](prd-delta.md) §6 (REQ-460..REQ-523) · [`api-delta.md`](api-delta.md)
> · [`technical-design-delta.md`](technical-design-delta.md) DD-037..DD-043 ·
> [`data-model-delta.md`](data-model-delta.md) §2.26, §2.27, §3.8, §3.9, §4–§6.
> Generated: 2026-10-18. Task ids continue the global sequence after T-199.

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 4, approved 2026-10-18 by Ernesto Crespo (drafted the same day) |
| **Branch** | `feat/silverpoint-0.7` (off `develop`, user request 2026-10-18) |

**Goal.** A consumer of React, Vue or Angular re-colours a section with a verified palette, builds a
table, a pagination, a breadcrumb, statistics, a timeline list, a collapse, empty and result states,
a textarea and a number input, opens a modal, a drawer, a popover, a tooltip, a select, a menu and
toasts, and tells a story with a Knight Lab timeline, all drawn in the ground, with identical markup
in the three adapters and no new runtime dependency.

**Done criteria (Phase 8)**
- Every MUST in REQ-460..REQ-523 cited by a test; traceability 0 blocking (REQ-183, REQ-184).
- Tree gate green on the 180 PR / 396 nightly new fixtures; pixel gates green on all.
- The four example apps have the composed, palettes and timeline pages, green in e2e and axe.
- Budgets of REQ-518 and REQ-519 green.
- Docs site: a section per new family with live examples and generated props (REQ-521).
- Released as `0.7.0` (changeset `minor`) from CI; deltas folded into `specs/`; `CLAUDE.md` status.
- The Next.js example served locally to show the demo (user request 2026-10-18).

**Carried rules.** Test-first; cite the REQ; mutation-check any test written after the code. Gates
that launch Chromium run alone. Every gate iterates `UI_COMPONENTS`. Every change touching
`packages/` adds a changeset. Before any "done", the CI steps of `.github/workflows/ci.yml`, in order.

## Phases

| Step | Content | Depends on | Exit |
|---|---|---|---|
| 8a | Core: palettes, presets, contrast; sort, pages, number, initials; listbox, typeahead, placement, anchor; view trees; catalog rows; demos | Approval | Core unit + DOM tests and benchmarks green; REQ-444 measured with `paletteStyle` on the chart path |
| 8b | Grounds: `ui` tokens `backdrop`/`rowTone`; `ui.css` rules; `timeline.css`; contrast gate over presets and new pairs | 8a | Grounds tests; I-19, I-24; `ui.css` ≤ 24 KB, `timeline.css` ≤ 6 KB |
| 8c | Palettes in the three adapters (charts, UI, dashboard, provider) | 8a | Adapter tests; palette fixtures green |
| 8d | Adapters ×3 in three batches: **A1** Surface, Glyph, Table, Breadcrumb, Avatar, Statistic, Descriptions, TimelineList, Empty, Result · **A2** Pagination, Collapse, Textarea, InputNumber · **B** Modal, Drawer, Popover, Tooltip, Select, DropdownMenu, Toast | 8b | Adapter tests and the 8e gates per batch; each batch a review point |
| 8e | Fixtures, tree and pixel gates, mode invariance, budgets | 8d (per batch) | 180 / 396 green |
| 8f | `SpTimeline` ×3, `TIMELINE_DEMO`, its pixel fixture | 8b | Adapter tests; surface fixtures green; `SP025` path tested |
| 8g | Example apps: composed, palettes, timeline pages; e2e (APG, focus trap, 1.4.13, forms, hydration, reduced motion, RTL); axe | 8e, 8f | Four apps green |
| 8h | Docs site, READMEs, changeset, fold deltas, `CLAUDE.md`, the Next.js demo served | 8g | Ready for the `0.7.0` release commit |

**First run: T-200..T-204 only** (8a, palettes and the pure functions), then review before scaling.

## Tasks

### 8a — Core

**[x] T-200 · `Palette`, `resolvePalette`, `paletteStyle`, `PALETTE_PROPERTIES`** — REQ-460, REQ-461, REQ-462, REQ-467, REQ-468
- Tests (RED first): field-wise merge, later layer wins; fixed declaration order; empty for none;
  unknown field and injected values (`;`, `{`, `}`, `<`, `url(`) dropped with `SP024`; the consumer's
  style appended after the palette's.
- Measure: one-chart builds with `paletteStyle` on the chart path against `one-chart-0.3.0.json`
  (REQ-444, REQ-519). If over the allowance, stop and ask (OQ-C3).
- **Done:** tests green; mutation: reverse the order → red.
- **Ledger (2026-10-18):** `packages/core/src/palette/palette.ts`, `test/palette.test.ts` (RED on a
  stub, 21 failing on assertions). Measured ≈ 0.56 KB minified on the chart path → OQ-C3, user
  decision: re-baseline REQ-444 to `0.6.0` with 1 KB (T-220). *Amended in implementation:* `SP023`
  measures against the palette's own substrate, else cream (the core does not know the ground's
  substrate colour at resolve time); `SP024` warnings are development-only, the dropping is not.
  Mutations: reversed order, SP023 always firing, `focus` without the `ink` fallback → red.
  *Amended after the commit security review (2026-10-18):* the `;{}<`/`url(` denylist is an
  allowlist of CSS colours (escapes like `\75 rl(` and `image-set("…")` passed it), also applied in
  `paletteStyle`; mutations on the character set, the function set and `paletteStyle` → red.

**[x] T-201 · `contrastRatio`, `checkPalette`, `PALETTE_PAIRS`, `@silverpoint/core/palettes`** — REQ-463, REQ-464, REQ-465, REQ-466 `[P]`
- Tests: WCAG reference pairs (black/white 21, `#777`/`#fff` 4.48); each pair of Data Model §3.9;
  non-hex skipped; the six presets deep-frozen (I-23) with zero findings; `SP023` once per palette.
- **Done:** tests green; mutation: lower a preset's `rule` → red.
- **Ledger (2026-10-18):** `src/palette/contrast.ts`, `src/palettes.ts` and the `./palettes` export;
  mutation (sanguine `rule` → `#D9C2B0`) → 3 red.

**[x] T-202 · `uiSortRows`, `uiPageWindow`, `uiPagination`** — REQ-474, REQ-476, REQ-486 `[P]`
- Tests: stability, nulls last, numbers before strings, `desc` (I-26), property test over random
  rows (fixed seed); page window for counts 1..12 × current × siblings 0..2 against Reflex's
  algorithm; `current`, `total` and `pageSize` corrections with `SP017`.
- **Done:** tests green; benchmark 10,000 rows < 10 ms.
- **Ledger (2026-10-18):** `src/ui/sort.ts`, `src/ui/pages.ts`, `test/ui-composed-values.test.ts`,
  `bench/composed.bench.ts`; sort keys precomputed (8.6 → 6.2 ms mean, p99 9.1 ms); `tools/bench-report`
  gains the `sort ·` budget (10 ms). The index tiebreaker was dead code (`Array.prototype.sort` is
  stable since ES2019) and was removed; a reversed tiebreak → 4 red. Mutations on case, nulls, the
  gap threshold and rounding → red.

**[x] T-203 · `uiNumberValue`, `uiNumberStep`, `uiInitials`** — REQ-478, REQ-485, REQ-486 `[P]`
- Tests: clamp, round to `precision`, `null` preserved, `atMin`/`atMax`; stepping from `null` starts
  at `min ?? 0`; invalid bounds → unset with `SP017`; initials of 0, 1, 2, 3 words and hyphens.
- **Done:** tests green.

**[x] T-204 · `uiListKey`, `uiTypeahead`, `uiPlace`** — REQ-493, REQ-494, REQ-495, REQ-523 `[P]`
- Tests: every key × `listbox`/`menu` × open/closed × disabled patterns; no wrap in listbox, wrap
  in menu; typeahead wrapping and skipping disabled; placement on each side × align, flip when it
  does not fit, shift into the padding, RTL mirrors `start`/`end`, 2 decimals (I-27).
- **Done:** tests green; benchmarks < 0.05 ms. **Review point.**
- **Ledger (2026-10-18):** `src/ui/listbox.ts`, `src/ui/place.ts`, `test/ui-overlay-keys.test.ts`.
  The inclusive multi-character typeahead survived its first mutation (the case wrapped back to the
  same item); a case with two labels sharing a prefix was added and now bites. Benchmarks: all
  < 0.02 ms mean.

**[x] T-205 · `uiAnchor` and `timelineInk` (DOM side, structural types)** — REQ-493, REQ-512
- Tests (happy-dom): `uiAnchor` writes `--sp-ui-x/y` and `data-side`, re-runs on scroll/resize,
  cleanup removes listeners; `timelineInk` republishes probe values as `--sp-kl-*`, `none` in
  `precision` and with `inked: false`, re-reads on attribute change.
- **Done:** tests green.
- **Ledger (2026-10-18):** `src/ui/anchor.ts`, `src/timeline/ink.ts` (new subpath
  `@silverpoint/core/timeline`, with `TIMELINE_FRAMES`/`TIMELINE_TONES`),
  `test/ui-dom-anchor-ink.test.ts` (happy-dom; 12 RED on assertions against stubs). `uiAnchor`
  listens to `scroll` capturing, so a nested scroller re-places too; defaults offset 6, padding 8.
  `data-kl-toned` is true when any tone probe resolves (Reflex read only the first). 11 mutants
  (capture, cleanup, defaults, rtl, inked, mode, observer filter, disconnect) → red.

**[x] T-206 · Glyphs, `uiSurfaceView`, `uiGlyphView`, composed view trees** — REQ-470, REQ-471, REQ-472..REQ-485, REQ-487
- `ui/view-composed.ts`: Surface, Glyph, Table, Pagination, Breadcrumb, Avatar(Group), Statistic,
  Descriptions, TimelineList, Collapse(Item), Empty, Result, Textarea, InputNumber, per API delta §4.
- Tests: the tree per state of Data Model §5; ids `${id}--part`; duplicate keys `SP019`; at most one
  heightening (I-18); the ten new glyphs are exact 16 × 16 paths.
- **Done:** tests green.
- **Ledger (2026-10-18):** `src/ui/view-composed.ts`, prop types in `src/ui/types.ts`, the ten
  glyphs in `view-kit.ts`, `UiBind` extended; `test/ui-view-composed.test.ts` (60 RED on assertions
  against stubs). *Amended in implementation:* `uiNumberValue` also returns `range` (the range as
  drawn, for the `min`/`max`/`step` attributes); `SpSurface` `as` and `name` must be lowercase
  idents (`script`, `style`, `iframe`, `object`, `embed`, `template`, `noscript` refused), a Table
  column `width` a plain length (`px`, `%`, `em`, `rem`, `ch`, `vw`), each else dropped with `SP017`;
  InputNumber steppers are `tabindex="-1"` (the arrows on the input step, as APG's spinbutton);
  optional keys (Breadcrumb, Descriptions, TimelineList) are deduplicated only when given; the
  table draws rows as given (DD-040: the consumer sorts, so paging works), and `uiCollapseGroup`
  gives an accordion's `${id}--accordion` (`SP017` without an id). 16 mutants → red.
- **Budget (2026-10-18, user decision):** the palette API pushed `@silverpoint/core (everything)` to
  45,597 B gzip (REQ-164, 45 kB). It moved to `@silverpoint/core/palettes` (only the types stay on the
  main entry); `PALETTE_NAMES` is written out so an unused preset tree-shakes (`resolvePalette` +
  `paletteStyle` alone bundle to 807 B min, no preset). All ten budget gates green.

**[x] T-207 · Overlay view trees** — REQ-490..REQ-502
- `ui/view-overlay.ts`: Modal, Drawer, Popover, Tooltip, Select, DropdownMenu, Toast, Toaster: closed
  and open trees; ARIA of the trigger; `data-state`; no `open` attribute; `SP018` without a name.
- **Done:** tests green.
- **Ledger (2026-10-18):** `src/ui/view-overlay.ts`, prop types and `MenuEntry` in `types.ts`,
  `UiSlot` gains `trigger` and `action`; `test/ui-view-overlay.test.ts` (30 RED on assertions).
  Helpers for the adapters: `uiTriggerView` (the wrapper of a consumer's trigger), `uiTriggerAria`
  (the ARIA the adapter sets on it at runtime: a slotted element is consumer markup),
  `uiSelectItems`, `uiMenuItems` (the flat lists `uiListKey` moves over; the active option is passed
  as a key), `uiToastDuration`; `cssLength` and `iconClose` shared in `view-kit.ts`. *Amended in
  implementation:* a toast's live role is on `.sp-ui-toast-body`, not the `<li>` (a list item in an
  `<ol>` may not take another role: axe `aria-allowed-role`); the dialog's id is `${id}--dialog`.
  13 mutants → red.

**[x] T-208 · Catalog rows, `UI_DEMOS`, `TIMELINE_DEMO`, `timelineView`** — REQ-470, REQ-513
- `UI_COMPONENTS` gains 21 rows (`family`, batches `A1`, `A2`, `B`) with the 36 states;
  `UI_DEMOS` one entry per state; `TIMELINE_DEMO` deep-frozen.
- **Done:** tests green. **8a closed.**
- **Ledger (2026-10-19):** `src/ui/catalog.ts` (`UiFamily`; groups `building-blocks`, `disclosure`,
  `overlays`; the 21 rows with their 35 states, so 80 in all; the Timeline's 36th state is its own
  fixture, not a row), `src/ui/demo.ts` (35 states: the composed page's orders, FAQs and history;
  overlays demoed `open`, with `trigger` the text of their trigger button; `glyph--all` lists
  `UI_GLYPHS`; the sorted table's rows are sorted by `uiSortRows`, as a consumer would, DD-040),
  `src/ui/timeline-demo.ts`, `src/timeline/{types.ts,view.ts}` (`SpTimelineProps`, `TimelineData`;
  `UiBind` gains `probe` and `mount`); `test/ui-demos-composed.test.ts` (every new demo drawn through
  its view with no diagnostic; 44 RED on assertions against stubs). *Amended in implementation:* the
  demo is `TIMELINE_DEMO` on `@silverpoint/core/ui-demos`, beside `UI_DEMOS` (the API delta's
  `TIMELINE_EVENTS` on `/timeline` would ship demo data to applications, REQ-330); the region's name
  is `label`, else the title's headline, else `SP018`; `data-kl-inked="false"` until `timelineInk`
  runs; a `height` that is not a plain length is dropped with `SP017` and `600px` holds. The 42
  undocumented props of the new types got their JSDoc (REQ-332, the docs reference). Consumers kept
  on the 17 until their own tasks: the harness UI page test (T-222), the docs gallery and its e2e
  (T-224); the gated batches stay `B1..B3`. 13 mutants → red.
- **Security review of `9f538f5` (2026-10-19):** a link's `href` (SpButton, SpBreadcrumb) keeps only
  relative URLs and `http`, `https`, `mailto`, `tel`, read as a browser reads it (controls and spaces
  ignored); any other scheme is dropped with `SP017` (`safeHref`). `headingLevel` (SpCard,
  SpDescriptions, SpResult) is held to 2..6, else `h3` with `SP017` (`headingTag`): a tag is never
  built from a value. `test/ui-safety.test.ts`; 5 mutants → red.

### 8b — Grounds

**[x] T-209 · `ui` tokens `backdrop`, `rowTone`; contrast pairs** — REQ-464, REQ-499, REQ-522
- Data Model §3.8 values on both grounds; defaults for consumer grounds; `tools/contrast-gate`:
  presets × §3.9 pairs, and the new `ui.*` pairs on every substrate.
- **Done:** gate green; mutation: a failing preset → gate red.
- **Ledger (2026-10-19):** `UiTokens.backdrop?` / `rowTone?` (optional, so a ground written for
  `0.3.0` still type-checks), `UI_TOKEN_DEFAULTS` 2 and 1, `resolveUiTokens` rounds and holds them to
  1..4; `silverpoint` declares 2 and 1, `cyanotype` inherits them. The gate gains the five
  `ui.*` pairs (`row-tone-text`, `overlay-text`, `crumb-separator` on every substrate;
  `option-active`, `option-outline` on the heightening) and `auditPalette` / `auditPalettes`: the
  six presets × `PALETTE_PAIRS`, measured with the gate's own ratio against each preset's substrate
  (54 rows, all pass; worst `silverpoint.ui.crumb-separator` 3.03), part of `auditBuiltins`, so CI
  fails on a failing preset with `SP012 … (REQ-464)`. Tests: `ui-tokens` (core, grounds),
  `contrast-gate.test.ts` (the gate agrees with `checkPalette` on altered presets). 6 RED on
  assertions; 8 mutants → red (one equivalent mutant removed by simplifying `level`).

**[x] T-210 · `ui.css` rules for the 21 rows** — REQ-475, REQ-498, REQ-499, REQ-503, REQ-522 `[P]`
- Port Reflex's `surfaces.css` layout, rewritten on the root contract; row tone and backdrop by
  the ramp; `::backdrop`; the active option heightened; reduced motion; forced colours.
- Tests: I-19, I-24; `ui.css` ≤ 24 KB gzip.
- **Done:** tests green.
- **Ledger (2026-10-19):** `src/ui/ui-css.ts` gains `COMPOSED` and `OVERLAYS` (Reflex 0.7's layout,
  rewritten without its `opacity` and `color-mix(… transparent)`), and `unhatched(ground)`. Row tone:
  a `td::before` layer under the cell's text (`td` is `position: relative; z-index: 0`), painted
  `--sp-ink-secondary` through `--sp-ui-tone`; the table borrows the tile of its ground's `rowTone`
  level by joining that level's tone rule (`.sp-ground-X .sp-ui-table`), so the tile is written once;
  under a weight ground the layer is a rule of `--sp-weight-<rowTone>`. Backdrop: `::backdrop` joins
  the tone rule of the ground's `backdrop` level; `precision` and weight grounds paint the opaque
  substrate; forced colours paint `Canvas`. Anchored overlays are `position: fixed` at
  `translate: var(--sp-ui-x) var(--sp-ui-y)` (uiPlace already resolves `dir`, so physical
  coordinates are right); the drawer sits on logical sides; pagination chevrons mirror under
  `:dir(rtl)`; the chevron's turn moves only under `no-preference`. *Amended in implementation:* the
  table cell's text is on a `.sp-ui-plate` (core, `uiTableView`), and `backdrop` is the hatched
  level (Data Model delta §3.8). `ui.css` is 14.2 KB gzip (was 11.4). Every rule parses in Chromium
  (Firefox and WebKit in the pixel gate, T-218). 12 RED on assertions; 10 mutants → red.

**[x] T-211 · `timeline.css`** — REQ-511, REQ-512
- Port Reflex's `timeline.css` (phases 1 and 2) to `src/timeline/timeline-css.ts`; I-19, I-24;
  ≤ 6 KB gzip.
- **Done:** tests green. **8b closed.**
- **Ledger (2026-10-19):** `src/timeline/timeline-css.ts` (`buildTimelineCss`), written to
  `dist/timeline.css` by `scripts/build-ui-css.ts` and exported as `./timeline.css`; it reuses
  `ui.css`'s `rule`, `media` and `mask` helpers. Every rule is scoped to `.sp-ui.sp-timeline` (the
  surface `timelineView` draws), so TimelineJS elsewhere on the page is untouched. Phase 1 as in
  Reflex, without its `color-mix` (the time-group rule is `--sp-grid` dashed), its fade-out
  gradients (`background: none`) or its era `opacity` and gradient. Phase 2 under
  `[data-kl-inked='true']` (marker `control` and menubar `box` frames on `::before`) and
  `[data-kl-toned='true']` (eras fold colours 0..5 onto tone levels 1, 2, 3, 4, 1, 2; the hovered
  marker takes level 1). Forced colours: `CanvasText` frames, no masks, eras an exact rule.
  *Amended in implementation* (TD delta, DD-042): toned eras are not keyed to `ink`, and untoned
  eras are a rule of the ramp's weight (`var(--sp-kl-era-weight, 1)`, so a ground with no ramp
  draws the stroke width). `timeline.css` is 1.93 KB gzip; 79 rules, all parsed by Chromium.
  Shared CSS reader moved to `test/support/css.ts`. 9 RED on assertions; 16 mutants → red.

### 8c — Palettes in the adapters

**[x] T-212 · `palette` on charts, UI components, dashboard and provider ×3** — REQ-461, REQ-462, REQ-468
- React, Vue, Angular: `palette` on every chart and component (through the shared bases, no
  per-chart code: REQ-044), on `Dashboard` (cell context) and on the provider; nested providers.
- Tests: precedence element → dashboard → provider; I-25 (only `style` changes); `toSVGString`.
- **Done:** tests green; palette fixtures (T-219) green.
- **Ledger (2026-10-19):** the core resolves, the adapters write `style`. Charts: `renderChart`
  returns `rendered.style` (`paletteStyle(resolvePalette(provider, props))`; `inCell` has already
  merged the cell's palette under the chart's own, field by field), the three chart frames write it
  on `.sp-root` and `svgString(view, style)` on the `<svg>` of `toSVGString`. UI: `resolveUi` gives
  `UiResolved.palette` (provider → cell → prop) and `root()` writes it first in `style`, the
  component's own declarations after, so every UI, composed, overlay and timeline root has it with
  no per-component code. Dashboard: `dashboardView(props, children, palette)` puts the section's
  declarations before its layout variables, and its cells hand `palette` on. `resolvePalette` skips
  an `undefined` field silently (Vue and Angular hand absent ones). Providers nest through
  `nestProvider`; Vue's section is a `SilverpointProvider` component (a `shallowReactive` config
  re-provided on change, no wrapper element); Vue binds the chart root's `style` only when there is
  one (its SSR writes `style=""` for `undefined`). *Amended in implementation* (API and TD deltas,
  DD-037): nested providers inherit, the dashboard root carries its own palette only, Vue's
  `SilverpointProvider`, Angular's `provideSilverpoint` returns a `Provider`. REQ-444: re-baselined
  to `tools/bundle-budget/one-chart-0.6.0.json` (244 entries, v0.6.0 worktree) with a 2 KB allowance
  (user decision 2026-10-19; OQ-C3 amended). Tests: `palette-layers` (core), `palette-render`
  (grounds), `palette` ×3 adapters. 12 core/grounds and 3–4 per adapter RED on assertions; 22
  mutants → red. Palette fixtures stay with T-219.

### 8d — Adapters (three batches)

**[x] T-213 · Batch A1 ×3** — REQ-470, REQ-472..REQ-483, REQ-489
- Surface, Glyph, Table (with `sort`), Breadcrumb, Avatar(Group), Statistic, Descriptions,
  TimelineList, Empty, Result. React client and server entries; Vue; Angular.
- **Done:** adapter tests green; A1 fixtures green (T-218). **Review point.**
- **Ledger (2026-10-19):** ten components ×3 adapters, each the core's view written attribute for
  attribute, with no maths (Art. 2). React: `ui/<slug>` and `server/ui/<slug>` entries (the server
  ones resolve without hooks, the server Table takes no `onSort`), `colspan` mapped to `colSpan`.
  Vue: `ui/<slug>` entries; Empty and Result take an `extra` slot, the avatar group and the surface
  the default one. Angular: `ui/<slug>` secondary entry points and the `ui` barrel; `sp-ui-tree`
  gains `nav`, `table`, `caption`, `thead`, `tbody`, `tr`, `th`, `td`, `dl`, `dt`, `dd` and `img`.
  The renderers of React and Vue gain `bound`, the props of an element by its bind (Table's `sort`
  reads the header's `data-key`); Angular reads it from `clicked`'s `currentTarget`.
  *Amended in implementation* (API delta §1): Angular's surface is `[spSurface]` (DD-024), and the
  normaliser filters its selector attribute `spsurface` as it does `spbutton` (A-03). Tooling:
  `uiMatrix(batches)` builds a batch's fixtures before it is gated (A1 joins `GATED_BATCHES` in
  T-218); the Glyph `all` and Avatar `group` states compose (`composedMarkup`), and `parseUi`
  compares a markup with several roots as one fragment. Tests: `ui-a1` ×3 adapters, the
  `ui-a1-client` behaviour test for Angular and `ui-a1` for the tooling: 72 PR fixtures per adapter, client
  and server for React, plus sort, surface, `extra`, exports and no Vue warning. RED on
  assertions against stubs; 16 mutants → red (the `colspan` one by the no-React-warning test).
  A1 fixtures are committed and gated in T-218.

**[x] T-214 · Batch A2 ×3** — REQ-476, REQ-482, REQ-484, REQ-485, REQ-488
- Pagination, Collapse(Item), Textarea, InputNumber; controlled/uncontrolled; Angular CVA.
- **Done:** adapter tests green; A2 fixtures green. **Review point.**
- **Ledger (2026-10-19):** five components ×3 adapters on the core's views. Pagination binds
  `current` (React `current`/`defaultCurrent`/`onChange`, Vue `v-model:current`, Angular
  `[(current)]`); its page buttons are bound by `page` and report `data-page`. Collapse hands its
  accordion `name` (`uiCollapseGroup`) to its items through a React context, Vue `provide`/`inject`
  and Angular's injection of `SpCollapse`; an item binds `open` (`toggle` event) from the native
  `toggle`, and a disabled one cancels its summary's click. Textarea binds `value` (Angular CVA);
  React and Vue write its content from `value`, Angular's tree writes it as text and sets the live
  property through `spUiValue`. InputNumber binds `value` (Angular CVA); steppers report
  `uiNumberStep`. React maps `maxlength` and `inputmode`; Angular's tree gains `details`, `summary`
  and `textarea`. *Amended in implementation* (API delta §4, §5): (1) the A2 components are client
  components with no `server/ui/*` entry, like `0.3.0`'s Input: each needs a handler (a disabled
  CollapseItem cannot be held shut without one); (2) an InputNumber reports a typed value on commit
  (blur or Enter; `change` in Vue and Angular), clamped by `uiNumberValue`, `null` when emptied:
  a value clamped on every keystroke would turn "12" into 5 under `min: 5` before the second key.
  Tooling: Textarea and InputNumber join `UI_VALUE_COMPONENTS`, Collapse is wide (640 px) and
  composes its items in `composedMarkup`. Tests: `ui-a2` ×3 adapters (32 PR fixtures each), Angular
  `ui-a2-client` (including CVA), tooling `ui-a2`. RED on assertions against stubs; 32 mutants:
  28 red at once, 3 killed by added tests (a stepper's `-1`, a form's `null` with a `defaultValue`), 1
  showed Vue's textarea branch redundant (its SSR writes the content from `value`) and it was removed.

**[ ] T-215 · Overlay base ×3** — REQ-491, REQ-492, REQ-493, REQ-500, REQ-502
- Per adapter: open state binding, trigger cloning/projection with ARIA, `showModal`/`showPopover`
  after mount, `uiAnchor` on open, return focus, `cancel` handling.
- **Done:** adapter tests green; overlay runtime ≤ 4 KB (T-220).

**[ ] T-216 · Batch B ×3** — REQ-490..REQ-503
- Modal, Drawer, Popover, Tooltip, Select, DropdownMenu, Toast, Toaster.
- **Done:** adapter tests green; B fixtures green. **Review point.**

### 8e — Gates

**[ ] T-217 · Fixture generation** — REQ-516
- `tools/visual-gate`: fixtures for the 36 states on the axes of Data Model §5 and the 36 palette
  fixtures; canonical renders from the core trees.
- **Done:** 396 nightly / 180 PR fixtures written.

**[ ] T-218 · Tree gate and mode invariance** — REQ-516, REQ-468, REQ-522
- Add the batches to `GATED_BATCHES` and `UI_GATED_BATCHES`; I-17 over the new rows.
- **Done:** gate green for the three adapters.

**[ ] T-219 · Pixel gates (Docker)** — REQ-517
- Overlays open in the harness; goldens with `--update-snapshots=missing`.
- **Done:** three pixel gates green.

**[ ] T-220 · Budgets** — REQ-518, REQ-519
- size-limit rows per new subpath, overlay runtime, `timeline.css`, `SpTimeline`; REQ-444.
- A gate that a one-chart build with a `palette` holds no preset (the presets tree-shake, T-206).
- **Done:** budgets green.

### 8f — Timeline

**[ ] T-221 · `SpTimeline` ×3** — REQ-510, REQ-512..REQ-515
- Optional peer in the three adapters' `package.json` (`peerDependenciesMeta.optional`); dynamic
  import after hydration; events; fallback slot and `SP025`; `inkedFrames`, `card`.
- Tests: no import on the server; `SP025` when the import fails; events forwarded; `font`/`theme`
  stripped from `options`.
- **Done:** tests green; surface fixtures green; one nightly pixel fixture over pinned TimelineJS.

### 8g — Example apps

**[ ] T-222 · Composed, palettes and timeline pages in the four apps** — REQ-520
- `vite-react`, `vite-vue`, `nextjs`, `angular`; `@knight-lab/timelinejs` as an exact dev dependency
  of each example app.
- **Done:** pages render; no hydration mismatch.

**[ ] T-223 · E2E and axe** — REQ-491..REQ-498, REQ-503, REQ-520, REQ-522, REQ-523
- APG keyboard for Select and Menu; Modal and Drawer focus trap and return; Tooltip 1.4.13; Toast
  F8 and pause; exclusive Collapse; native form submit; reduced motion; RTL; target size; axe.
- **Done:** e2e green in Chromium, Firefox, WebKit.

### 8h — Documentation and release preparation

**[ ] T-224 · Docs site and READMEs** — REQ-521
- A section per family (Palettes, Composed, Overlays, Timeline), live examples, props generated
  from the types; package READMEs; root README.
- **Done:** docs build; links checked.

**[ ] T-225 · Changeset, fold, status, demo** — REQ-183
- Changeset `minor` for the seven packages; fold the deltas into `specs/` ("amended in
  implementation" where it differs); traceability report; `CLAUDE.md` status; serve the Next.js
  example (`examples/nextjs`) for the user's review.
- **Done:** CI steps green locally; ready for the `0.7.0` release commit on `develop`.

## Dependency graph

```
T-200 ─┬─► T-212 ─────────────────────────────┐
T-201 ─┤                                      │
T-202 ─┼─► T-206 ─► T-208 ─► T-209 ─► T-210 ─► T-213 ─► T-214 ─► T-215 ─► T-216 ─► T-217..T-220 ─► T-222 ─► T-223 ─► T-224 ─► T-225
T-203 ─┤        T-207 ─┘                 T-211 ─► T-221 ─────────────────────────────┘
T-204 ─┴─► T-205
```
