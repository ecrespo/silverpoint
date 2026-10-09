# feature-003 — catalog expansion: 27 new charts

| Field | Value |
|---|---|
| **Status** | `APPROVED` — drafted 2026-10-08; OQ-C1, OQ-C2, OQ-C4 and A-07 decided the same day; gates 0..4 approved 2026-10-09 by Ernesto Crespo, with OQ-C3, OQ-C5 and the open findings closed as proposed (Phase 1) |
| **Target releases** | Wave 1 → `0.4.0`, wave 2 → `0.5.0`, wave 3 → `0.6.0` (OQ-C1). The line stays on `0.x`; `1.0.0` stays parked |
| **Requirements** | REQ-400..REQ-426 (27 charts: 20 MUST, 5 SHOULD, 2 COULD) · REQ-430..REQ-450 (20 MUST, 1 SHOULD) |
| **Design decisions** | DD-028..DD-036 |
| **Diagnostics** | `SP020`, `SP021`, `SP022` |
| **Tasks** | T-164..T-199 (Phase 7) |
| **Invariants** | I-23..I-30 |
| **Dependencies** | None added: every statistic and layout is owned by the core (OQ-C2) |
| **Constitution** | Stack-row amendment v1.7 → v1.8 ([`constitution-amendment.md`](constitution-amendment.md)); no article changes |
| **Functional reference** | [TanStack Charts catalog](https://tanstack.com/charts/catalog) — used **only** to find which charts are missing |

silverpoint draws 33 charts. Measured against TanStack Charts' 188 examples it covers the everyday
cartesian and polar marks, and misses whole families: **distributions, two-value comparisons, ranks,
uncertainty, intervals, part-to-whole grids, hierarchies, fields and networks**. This feature adds
27 charts in those families, taking the catalog to **60**, under the same rules as the 33: the hand
inks only ornament, all geometry is computed in the core, markup is identical across React, Vue and
Angular, every render is deterministic, every chart is accessible and has a `precision` mode.

## The principle

The catalog says **which** charts silverpoint lacks. It says nothing about **how** they look or are
built. Each new chart is:

- **drawn in silverpoint's language** — exact `ink` line for every datum, tone by hatching on the
  ground's ramp (or weight under `cyanotype`), the second series `ink-secondary` dotted, one heightened
  element outlined in ink, the inked card with its title, metric and footers, EB Garamond — with no new
  part, paint or CSS variable (REQ-450, DD-035);
- **implemented the way the 33 are** — one recipe in `core/src/charts/<slug>/` with the same anatomy
  and the same `shared/` helpers, a frozen demo, thin adapters, one catalog row (DD-036).

## The gap, at a glance

| Wave | Family | New charts |
|---|---|---|
| 1 · `0.4.0` | Distribution | `HistogramChart`, `EcdfChart`, `BoxPlotChart`, `ViolinChart`, `RidgelineChart`, `BeeswarmChart` |
| 1 · `0.4.0` | Comparison, change, ranking | `LollipopChart`, `DumbbellChart` (dot or arrow), `SlopeChart`, `BumpChart` |
| 1 · `0.4.0` | Uncertainty, interval, survey, relationship | `ErrorBarChart`, `IntervalChart`, `DivergingBarChart`, `ConnectedScatterChart` |
| 2 · `0.5.0` | Part-to-whole | `WaffleChart`, `MarimekkoChart` |
| 2 · `0.5.0` | Hierarchy | `SquarifiedTreemap`, `SunburstChart`, `TreeChart` |
| 2 · `0.5.0` | Multivariate, polar | `ParallelCoordinatesChart`, `PolarLineChart`, `PolarScatterChart` |
| 3 · `0.6.0` | Fields | `DensityBinChart` (hexagon or rect), `ContourChart`, `DelaunayChart`, `VectorFieldChart` |
| 3 · `0.6.0` | Network | `NetworkChart` |

The full mapping —what the existing 33 already cover, which catalog entries are **variants** of an
existing chart (six proposed deltas, 014..019), and what is **out of scope** and why (geography,
motion, the interaction layer, theming)— is in [`research.md`](research.md).

## Reading order and approval gates

Per Art. 9, each gate is approved before the next artifact is relied on.

| Gate | Artifact | Decides | Approved |
|---|---|---|---|
| 0 | [`research.md`](research.md) | Catalog mapping: covered / variant / new / out of scope | ✅ 2026-10-09 |
| 1 | [`prd-delta.md`](prd-delta.md) + [`constitution-amendment.md`](constitution-amendment.md) | The what: 27 charts, REQ-400..450, the stack row | ✅ 2026-10-09 |
| 2 | [`api-delta.md`](api-delta.md) | Names, props, data shapes, heighten and keyboard model per chart, events, diagnostics, budgets | ✅ 2026-10-09 |
| 3 | [`technical-design-delta.md`](technical-design-delta.md) + [`data-model-delta.md`](data-model-delta.md) | The how: DD-028..036, the drawing grammar per chart and the recipe anatomy, statistics methods, deterministic layouts, contracts, demos, fixtures, invariants | ✅ 2026-10-09 |
| 4 | [`plan-and-tasks.md`](plan-and-tasks.md) | Phase 7, T-164..T-199; first run T-164..T-167 | ✅ 2026-10-09 |
| — | [`analyze.md`](analyze.md) | Cross-check: 0 blocking, 15 findings; the user's dispositions | — |

## Decisions the user took (2026-10-08)

| # | Question | Decision |
|---|---|---|
| OQ-C1 | Three waves as `0.4.0` / `0.5.0` / `0.6.0`, or fewer, larger releases? | Three waves |
| OQ-C2 | Take `d3-hierarchy`, `d3-contour`, `d3-delaunay`, or own them? | **Own them in the core** — no new dependency (DD-028) |
| OQ-C4 | Reduced PR fixture matrix for the new charts? | **No: full matrix on every PR** (600 chart fixtures) |
| A-07 | Rename `focusId` / `onFocusChange`? | **Renamed** to `rootId` / `onRootChange` |

Closed as proposed when the gates were approved (2026-10-09): **OQ-C3** (no public
`@silverpoint/core/stats` in `0.x`) and **OQ-C5** (keep `DelaunayChart` and `VectorFieldChart` in
wave 3 if on budget).

## Related

- [`../feature-001-dashboard/`](../feature-001-dashboard/) and
  [`../feature-002-ui-components/`](../feature-002-ui-components/) — the shape this feature follows.
- Not started: feature-004 (interaction layer) and deltas 014..019 (variants), proposed in
  [`research.md`](research.md) §4–§5.
