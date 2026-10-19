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

**[ ] T-205 · `uiAnchor` and `timelineInk` (DOM side, structural types)** — REQ-493, REQ-512
- Tests (happy-dom): `uiAnchor` writes `--sp-ui-x/y` and `data-side`, re-runs on scroll/resize,
  cleanup removes listeners; `timelineInk` republishes probe values as `--sp-kl-*`, `none` in
  `precision` and with `inked: false`, re-reads on attribute change.
- **Done:** tests green.

**[ ] T-206 · Glyphs, `uiSurfaceView`, `uiGlyphView`, composed view trees** — REQ-470, REQ-471, REQ-472..REQ-485, REQ-487
- `ui/view-composed.ts`: Surface, Glyph, Table, Pagination, Breadcrumb, Avatar(Group), Statistic,
  Descriptions, TimelineList, Collapse(Item), Empty, Result, Textarea, InputNumber, per API delta §4.
- Tests: the tree per state of Data Model §5; ids `${id}--part`; duplicate keys `SP019`; at most one
  heightening (I-18); the ten new glyphs are exact 16 × 16 paths.
- **Done:** tests green.

**[ ] T-207 · Overlay view trees** — REQ-490..REQ-502
- `ui/view-overlay.ts`: Modal, Drawer, Popover, Tooltip, Select, DropdownMenu, Toast, Toaster: closed
  and open trees; ARIA of the trigger; `data-state`; no `open` attribute; `SP018` without a name.
- **Done:** tests green.

**[ ] T-208 · Catalog rows, `UI_DEMOS`, `TIMELINE_DEMO`, `timelineView`** — REQ-470, REQ-513
- `UI_COMPONENTS` gains 21 rows (`family`, batches `A1`, `A2`, `B`) with the 36 states;
  `UI_DEMOS` one entry per state; `TIMELINE_DEMO` deep-frozen.
- **Done:** tests green. **8a closed.**

### 8b — Grounds

**[ ] T-209 · `ui` tokens `backdrop`, `rowTone`; contrast pairs** — REQ-464, REQ-499, REQ-522
- Data Model §3.8 values on both grounds; defaults for consumer grounds; `tools/contrast-gate`:
  presets × §3.9 pairs, and the new `ui.*` pairs on every substrate.
- **Done:** gate green; mutation: a failing preset → gate red.

**[ ] T-210 · `ui.css` rules for the 21 rows** — REQ-475, REQ-498, REQ-499, REQ-503, REQ-522 `[P]`
- Port Reflex's `surfaces.css` layout, rewritten on the root contract; row tone and backdrop by
  the ramp; `::backdrop`; the active option heightened; reduced motion; forced colours.
- Tests: I-19, I-24; `ui.css` ≤ 24 KB gzip.
- **Done:** tests green.

**[ ] T-211 · `timeline.css`** — REQ-511, REQ-512
- Port Reflex's `timeline.css` (phases 1 and 2) to `src/timeline/timeline-css.ts`; I-19, I-24;
  ≤ 6 KB gzip.
- **Done:** tests green. **8b closed.**

### 8c — Palettes in the adapters

**[ ] T-212 · `palette` on charts, UI components, dashboard and provider ×3** — REQ-461, REQ-462, REQ-468
- React, Vue, Angular: `palette` on every chart and component (through the shared bases, no
  per-chart code: REQ-044), on `Dashboard` (cell context) and on the provider; nested providers.
- Tests: precedence element → dashboard → provider; I-25 (only `style` changes); `toSVGString`.
- **Done:** tests green; palette fixtures (T-219) green.

### 8d — Adapters (three batches)

**[ ] T-213 · Batch A1 ×3** — REQ-470, REQ-472..REQ-483, REQ-489
- Surface, Glyph, Table (with `sort`), Breadcrumb, Avatar(Group), Statistic, Descriptions,
  TimelineList, Empty, Result. React client and server entries; Vue; Angular.
- **Done:** adapter tests green; A1 fixtures green (T-218). **Review point.**

**[ ] T-214 · Batch A2 ×3** — REQ-476, REQ-482, REQ-484, REQ-485, REQ-488
- Pagination, Collapse(Item), Textarea, InputNumber; controlled/uncontrolled; Angular CVA.
- **Done:** adapter tests green; A2 fixtures green. **Review point.**

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
