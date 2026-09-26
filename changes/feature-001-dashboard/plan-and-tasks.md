# Implementation Plan and Tasks — Phase 5, Dashboard composition

> Source specs: [`prd-delta.md`](prd-delta.md) §6 (REQ-200..REQ-221) · [`api-delta.md`](api-delta.md)
> · [`technical-design-delta.md`](technical-design-delta.md) DD-013..DD-018 ·
> [`data-model-delta.md`](data-model-delta.md) §2.13, §4–§6.
> Generated: 2026-09-25. Gate 4 **approved** by the user on 2026-09-25; **not started**. The Analyze findings are all
> dispositioned ([`analyze.md`](analyze.md)). Task ids continue the global
> sequence after delta-011's T-102..T-105.

**Goal.** A consumer composes a server-renderable, accessible, responsive grid of silverpoint
cards in React, Vue or Angular from one data-only layout, with parity held across the three
adapters, and optionally links hover between charts.

**Done criteria (Phase 5)**
- Every MUST in REQ-200..REQ-221 cited by a test; traceability 0 blocking (REQ-183, REQ-184).
- Parity gate green on the 24 dashboard parity fixtures; pixel gates green on all 72.
- The four example apps have the reference dashboard page, green in e2e and axe.
- `dashboard` subpath ≤ 2 KB min+gzip over the one-chart budget in each adapter.
- Docs site: a Dashboard page with the layout reference, the breakpoint table and the reading-order
  guidance; props generated, not retyped.
- Released as `0.2.0` (changeset `minor` from 0.1.1) from CI.

**Carried rules.** Test-first; cite the REQ; mutation-check any test written after the code. Gates
that launch Chromium run alone (never the Docker pixel job beside local e2e). A dashboard is a
catalog row in its own `DASHBOARDS` list; every gate iterates it.

## Phases

| Step | Content | Depends on | Exit |
|---|---|---|---|
| 5a | Core: types, `resolveDashboard`, `cellChartBox`, diagnostics, reference layouts | Approval | Core unit tests + benchmark green |
| 5b | Adapters ×3 + stylesheet + server entry points | 5a | Adapter unit tests; type tests |
| 5c | Fixtures, parity gate on the wrapper, pixel gate per breakpoint | 5b | 24 + 72 green |
| 5d | Example apps, e2e, axe, hydration | 5c | Four apps green |
| 5e | Linked interaction (SHOULD) | 5b | May slip to `0.3.0` without blocking 5f |
| 5f | Docs, budgets, changeset, fold deltas | 5d | Release `0.2.0` |

**First run: T-106..T-109 only** (5a), then review before scaling to the adapters.

## Tasks

### 5a — Core

**[x] T-106 · Layout types and defaults** — REQ-201, REQ-208
- `packages/core/src/dashboard/types.ts` (API delta §2) exported on the internal surface.
- Tests: no layout → `sm 1 / md 2 / lg 4`, span 1, source order; bare-number `columns` applies to
  all breakpoints; model round-trips through `JSON.stringify` (I-10).
- **Done:** tests green; the type test proves `DashboardProps` without `title` and `label` fails to
  compile (REQ-214).
- *Closed 2026-09-26.* `src/dashboard/types.ts` (API delta §2, plus the internal `ResolvedLayout`)
  and `src/dashboard/defaults.ts`: `DASHBOARD_DEFAULTS` (frozen), `perBreakpoint`, `resolveLayout`.
  `resolveDashboard` itself is T-107's: T-106 stops at the layout-level defaults, and "source
  order" for children without a layout cell is rule 3 of the matching, tested there. Tests in
  `packages/core/test/dashboard.test.ts` (9), including `tsc` type tests (REQ-214, and REQ-209's
  required `id`). **Mutation checks, all red:** name made optional; `DashboardProps.id` made
  optional; bare number ignored by `perBreakpoint`; `md` default 3. CI: unit 2877, gates 311, pixel
  1068 (Docker), e2e 509. Changeset `.changeset/dashboard-layout-types.md` (`minor`).

**[ ] T-107 · `resolveDashboard`: matching, clamping, ids** — REQ-203, REQ-204, REQ-205, REQ-209
- Tests (RED first): the four matching rules of Data Model §2.13; `colSpan: 5` at `lg 4` → 4 and
  `SP014`; duplicate / unknown / childless ids → `SP015`, never a throw; chart ids
  `ops--traffic`, unplaced `ops--3`; no two equal chart ids (I-14); model order is reading order
  (I-11); invalid numbers → defaults with `SP002`.
- **Done:** tests green; mutation: drop the clamp → I-12 red.

**[ ] T-108 · Nominal boxes and `cellChartBox`** — REQ-206, REQ-207 `[P]`
- Tests: the DD-015 formulas at `ssrWidth` 1200 and 360, 2 decimals; equal outer height across a
  row (I-13) for a `KpiCard` beside a `LineChart` with footers; a chart's own `height` wins;
  chrome subtracted equals what `cardLayout` adds (property test over the catalog's card options).
- **Done:** tests green; no chrome constant duplicated outside `card.ts`.

**[ ] T-109 · Reference layouts and benchmark** — REQ-201, NFR `[P]`
- `kpi-strip`, `ops`, `mixed-spans` frozen in `packages/core/src/dashboard/demo.ts` (I-9 extended).
- Benchmark: 24 cells < 0.5 ms in `packages/grounds/bench`.
- **Done:** benchmark in the nightly report.

### 5b — Adapters

**[ ] T-110 · Stylesheet** — REQ-202, REQ-203, REQ-213 `[P]`
- `dashboard.css`: grid, `container-type: inline-size`, `@container` at 640 / 1024, variables of
  API delta §7, heading type and gap from ground tokens.
- Lint rule in `tools/lint-rules`: the dashboard stylesheet may not contain `order`, `dense`,
  `grid-row-start`, `grid-column-start`, `grid-area` (RED on a seeded violation first).
- **Done:** lint green; the contrast gate covers the heading and description text.

**[ ] T-111 · React `Dashboard` / `DashboardCell` + server entry** — REQ-200, REQ-212, REQ-214, REQ-219
- Wrapper, heading, `article` cells, variables from the model; cell context with box, chart id and
  inherited config; `create-chart.tsx` reads the context (id and size precedence, API delta §3).
- Tests: markup contract of API delta §7; precedence chart → dashboard → provider; media query not
  overridable; `/server/dashboard` rejects `link` by type; no `"use client"` without `link`
  (REQ-104).
- **Done:** tests green on React 19 and the `react-18` project.

**[ ] T-112 · Vue `SpDashboard` / `SpDashboardCell`** — REQ-200, REQ-212, REQ-214 `[P]`
- `<script setup>`, typed props and emits; `provide`/`inject` for the cell context; slot children
  read for their `cell` prop during render.
- Tests: the same contract as T-111, rendered with `@vue/server-renderer` and on the client.

**[ ] T-113 · Angular `sp-dashboard` / `sp-dashboard-cell`** — REQ-200, REQ-212, REQ-214 `[P]`
- Standalone, signal inputs, `OnPush`; cell ids from `contentChildren`; DI token for the cell
  context; APF subpath `@silverpoint/angular/dashboard`.
- Tests: the same contract in TestBed and under Angular SSR.

**[ ] T-114 · Adapters contain no layout maths** — REQ-201, Art. 2
- Extend the existing adapter lint (REQ-102/106) to the dashboard files: no arithmetic on sizes,
  every number written comes from the model.
- **Done:** RED on a seeded `width / cols` in an adapter, then green.

### 5c — Parity

**[ ] T-115 · Dashboard fixtures and canonical renders** — REQ-210, REQ-182
- `fixtures/dashboard/…`: 3 dashboards × 4 substrates × 2 modes = 24 parity fixtures, canonical
  from the core-driven reference render.
- **Done:** `DASHBOARDS` catalog added to `tools/visual-gate/catalog`; fixtures committed.

**[ ] T-116 · Tree gate over the wrapper** — REQ-210, DD-017
- The DD-004 comparator parses the whole fragment; the only stripping is the existing hydration
  marker rule. Tests: RED on a wrapper attribute changed in one adapter; RED on an extra comment
  node.
- **Done:** 24 × 3 adapters green.

**[ ] T-117 · Pixel gate per breakpoint** — REQ-211
- Goldens at 375 / 800 / 1280 px (72); run in the pinned Playwright image.
- **Done:** 72 × 3 green; goldens via `--update-snapshots=missing` only.

### 5d — Integration

**[ ] T-118 · Example apps** — REQ-221, REQ-207, REQ-215 `[P per app]`
- A `/dashboard` page with `ops` in `vite-react`, `vite-vue`, `nextjs` (RSC + client), `angular`
  (SSR).
- E2E: no hydration warning; the chart re-renders at measured width after hydration; Tab visits the
  cells in reading order at each breakpoint; axe 0 A/AA.
- **Done:** e2e green in the four apps.

**[ ] T-119 · Weight** — NFR, REQ-220
- `tools/path-weight`: `ops` server HTML ≤ 480 KB; size-limit entries for the three `dashboard`
  subpaths.
- **Done:** both gates in CI, RED first on a lowered limit.

### 5e — Linked interaction (SHOULD)

**[ ] T-120 · `linkedItems` in the core** — REQ-216, REQ-217
- Tests: matches by value across charts with different rows; no match → empty; key absent →
  `SP016` once; pure.

**[ ] T-121 · Link in the three adapters** — REQ-216, REQ-218, REQ-219
- One reactive value per dashboard; `part="linked"` marks, `aria-hidden`; clears with the source;
  no `onActiveChange` in the other charts; server render has no `part="linked"` (I-15).
- E2E in the four apps: hover `LineChart` hour 14 → bar and heatmap mark hour 14; leave → all clear.

### 5f — Close

**[ ] T-122 · Documentation** — REQ-200
- Docs site Dashboard page: example per adapter, layout reference (generated from the types),
  breakpoint table, how to order cells to avoid row-end gaps, `ssrWidth` guidance.

**[ ] T-123 · Fold and release** — Art. 9
- *Folding done on 2026-09-25* (PRD v1.8, API v1.6, TD v1.5, DM v1.4, Constitution v1.5); on close, move REQ-200..221 out of the Deferred table of `specs/tasks.md`; run the
  Analyze gate again; changeset `minor`; release `0.2.0` per CLAUDE.md.

## Traceability — MUST → task

| REQ | Tasks | REQ | Tasks |
|---|---|---|---|
| 200 | T-111, T-112, T-113, T-122 | 211 | T-117 |
| 201 | T-106, T-109, T-114 | 212 | T-111, T-112, T-113 |
| 202 | T-110 | 213 | T-110 |
| 203 | T-107, T-110 | 214 | T-106, T-111, T-112, T-113 |
| 204 | T-107 | 215 | T-118 |
| 205 | T-107 | 219 | T-111, T-121 |
| 206 | T-108 | 220 | T-119 |
| 207 | T-108, T-118 | 221 | T-118 |
| 208 | T-106 | SHOULD 216 | T-120, T-121 |
| 209 | T-107 | SHOULD 217 | T-120 |
| 210 | T-115, T-116 | SHOULD 218 | T-121 |

## Constitution check

- **Art. 9** — every task cites its REQ; the first run is limited to 5a; the deltas are folded as
  part of the Definition of Done (T-123).
- **Art. 2 / Art. 3** — T-114 and T-116 are the gates that keep them.
- **Exception requested:** none.
