# Analyze — feature-003 catalog expansion, before implementation

> Read-only cross-artifact pass over [`prd-delta.md`](prd-delta.md), [`api-delta.md`](api-delta.md),
> [`technical-design-delta.md`](technical-design-delta.md), [`data-model-delta.md`](data-model-delta.md),
> [`plan-and-tasks.md`](plan-and-tasks.md) and [`constitution-amendment.md`](constitution-amendment.md),
> against the Constitution v1.7 and `specs/` as they stand at `94e40cc`. Run 2026-10-08 on the
> drafts. The user decides what is fixed before `implement`.

## Coverage

- **48 requirements**: 27 charts (REQ-400..REQ-426: 20 MUST, 5 SHOULD, 2 COULD) and 21 cross-cutting
  (REQ-430..REQ-450: 20 MUST, 1 SHOULD). Every requirement maps to at least one task
  (plan-and-tasks §Traceability); every task cites at least one REQ; no orphan task.
- Every API element traces to a REQ: chart rows → 400..426; `onRootChange` → 439; the
  unchanged `part`/`data-role` contract → 450; `SP020`/`SP021`/`SP022` → 437/433/434; budgets → 443, 444, 445.
- Every own prop with a data meaning is in the Data Model delta with its validation; every derived
  value (bins, summary, rank, node) has a shape (§2.15, §2.17, §2.23).
- Identifier ranges do not collide: REQ-400..450 (the PRD ends at REQ-334), DD-028..036 (TD ends at
  DD-027), `SP020..022` (API ends at `SP019`), T-164..199 (tasks end at T-163), I-23..30 (Data
  Model ends at I-22). REQ-427..429 are left unused on purpose, for a chart added before gate 1.

## Findings

| # | Severity | Kind | Finding | Where | Proposed resolution |
|---|---|---|---|---|---|
| A-01 | MEDIUM | Constitution | The stack row names `d3-scale` + `d3-shape` only; it is already stale (`d3-chord`) and feature-003 adds the correctly-rounded-arithmetic rule (no new module: DD-028) | Constitution, Stack constraints | Approve [`constitution-amendment.md`](constitution-amendment.md) with gate 1 |
| A-02 | MEDIUM | Scope / risk | 27 charts × 3 adapters is the largest phase so far (≈ 81 adapter files, 27 recipes) | Plan 7b–7d | Three waves, each releasable alone (OQ-C1); wave 3 keeps two COULDs that can slip (OQ-C5) |
| A-03 | MEDIUM | Determinism | DD-029 rounds `Math.pow` results to 6 significant digits; this makes a cross-engine difference improbable, not impossible. REQ-435 is stated for iterations only, so the bandwidth's single call is outside its letter | DD-029; REQ-435 | Accept with the e2e watch of T-179, or adopt the table fallback now. Leaning: accept, the fallback is specified |
| A-04 | MEDIUM | Testability | REQ-445's network budget (16 ms at 150 nodes) is an estimate; DD-030 says it must be confirmed | REQ-445; DD-030; T-195 | T-195 benchmarks first; the REQ text allows lowering the default `iterations`, not raising the budget |
| A-05 | MEDIUM | CI cost | Nightly fixtures go from 1 782 to 3 240 chart fixtures (+ 90 dashboard + 510 component) | DM delta §3 | OQ-C4 decided: full matrix on every PR (600). Measure the PR gate job after wave 1; shard across runners if needed, never reduce |
| A-06 | LOW | Ambiguity | REQ-440 accepts "position or order, and the tabular alternative" as identity when a label does not fit; a reviewer could read that as weaker than REQ-124 | REQ-440; DD-032 | Keep; I-29 makes it testable (every category reachable by keyboard and in the table), and the fixture check lists unlabelled demo categories |
| A-07 | LOW | Terminology | "focus" names both keyboard focus (REQ-122) and the hierarchy's drawn root (then `focusId` / `onFocusChange`) | API §3, §4 | **Done 2026-10-08:** renamed to `rootId` / `onRootChange` |
| A-08 | LOW | Consistency | `TreemapChart` (grid, REQ-085) and `SquarifiedTreemap` (hierarchy) will coexist; consumers may pick the wrong one | API §7.3 | Docs gallery states the difference on both pages; no API change |
| A-09 | LOW | Data contract | The box/violin demo deliberately triggers `SP022` once in development, so the demo exercises the fallback; it also makes a "clean" dev console impossible for that chart's demo | DM delta §2 | Accept and document, or move the 4-observation group to a fixture-only dataset. Leaning: fixture-only |
| A-10 | LOW | Accessibility | DD-031 keeps one focusable SVG instead of `role="tree"` markup; screen-reader tree semantics (level, set size) are announced as text, not exposed as ARIA properties | DD-031 | Accept for `0.x`; the manual NVDA/VoiceOver pass still open from T-159 should include one hierarchy chart |
| A-11 | INFO | Open decisions | OQ-C1..OQ-C5 need the user | TD delta §7; README | Ask at gate 1 |
| A-12 | INFO | Out of scope | Interaction entries of the catalog (brush, zoom, synced cursors, grouped readout) and the variants (deltas 014..019) are listed, not specified | research §4, §5 | Separate SDD cycles when wanted |

**Blocking:** none.

## Dispositions — the user's decisions (2026-10-08)

| Item | Decision | Applied to |
|---|---|---|
| OQ-C1 | Three waves: `0.4.0`, `0.5.0`, `0.6.0` | README, plan steps 7b–7d (unchanged) |
| OQ-C2 | **Own every algorithm in the core**; no `d3-hierarchy`, `d3-contour`, `d3-delaunay` | DD-028 rewritten (option A); TD §1 (`shared/field.ts`, `shared/delaunay.ts`), §4 (allowlist unchanged), §6 (owned-layout and forbidden-maths tests); T-180, T-190 rewritten; PRD geometry note and risks; API §1; constitution amendment reasoning |
| OQ-C4 | **Full fixture matrix on every PR** (600 chart fixtures) | Data Model delta §3; T-178; PRD risks (shard, never reduce) |
| A-07 | Rename `focusId` / `onFocusChange` → **`rootId` / `onRootChange`** (`@root-change`, `rootChange`) | All artifacts |
| OQ-C3 | **Decided 2026-10-09:** no public `@silverpoint/core/stats` in `0.x`; the statistics stay internal | API delta §1 (unchanged) |
| OQ-C5 | **Decided 2026-10-09:** `DelaunayChart` and `VectorFieldChart` stay in wave 3 if it is on budget | Plan 7d (unchanged) |
| A-01 | Approved with gate 1 (2026-10-09) | Constitution amendment, folded with T-199 |
| A-02 | Accepted: three waves, each releasable alone | Plan 7b–7d (unchanged) |
| A-03 | Accepted (2026-10-09): one `Math.pow` per chart, rounded to 6 significant digits, watched by the hydration e2e of T-179; the table fallback stays specified | DD-029 (unchanged) |
| A-04 | Accepted: T-195 benchmarks first; only the default `iterations` may move | T-195 (unchanged) |
| A-05 | Accepted with OQ-C4: measure the PR gate job after wave 1, shard if needed | T-178 |
| A-06 | Accepted: I-29 makes REQ-440's identity testable | REQ-440 (unchanged) |
| A-08 | Accepted: the docs gallery states the difference on both pages | T-189 |
| A-09 | **Fixture-only (2026-10-09):** the 4-observation group leaves the box/violin/ridgeline demo for a fixture-only dataset, so every demo renders without a diagnostic | Data Model delta §2; T-167, T-178 |
| A-10 | Accepted for `0.x`; the open manual pass of T-159 includes one hierarchy chart | DD-031 (unchanged) |
| A-11 | Closed: every open question is decided | README; TD delta §7 |
| A-12 | Accepted: interaction and variants stay separate SDD cycles | research §4, §5 |

### New findings (OQ-C2, and the user's clarification on style)

| # | Severity | Kind | Finding | Resolution |
|---|---|---|---|---|
| A-14 | MEDIUM | Constitution (Art. 7) | The first draft's DD-032 cycled the hatch **angle** per category; the angle is a ground token (Data Model §3.4), so the chart would have carried style, and the device is foreign to silverpoint's grammar | Withdrawn 2026-10-08 after the user's clarification: DD-032 now uses the existing `ringTone` rule and labels; REQ-450 and DD-035/036 bind the new charts to the existing grammar and recipe anatomy |
| A-15 | LOW | Contract | The first draft added `data-role` values (`bin`, `box`, …); `data-role` already carries the stroke role (`encoding`, `ornament`, `hatch`), so the new values would have changed the markup contract | Withdrawn 2026-10-08: API delta §5 now states the contract is unchanged |
| A-13 | MEDIUM | Scope / risk | Owning tidy tree, squarify, marching squares and a robust Delaunay adds roughly two tasks' worth of algorithmic work to waves 2 and 3, and correctness of the Delaunay predicates is the hardest single item in the feature | T-180 and T-190 carry hand-computed cases, property tests and the exact `BigInt` fallback (DD-028); `DelaunayChart` is a COULD and can slip without blocking `0.6.0` (OQ-C5) |

## Constitution pass

| Article | Status |
|---|---|
| 1 — exact geometry | ✅ REQ-441, I-27/I-28, mode-invariance test per chart |
| 2 — one engine | ✅ REQ-430; adapters only map one event (DD-033) |
| 3 — parity | ✅ REQ-448; no new paint part; `rootId` controlled (I-30) |
| 4 — determinism | ✅ REQ-435, DD-029/030, demo literals (REQ-446); see A-03 |
| 5 — accessibility | ✅ REQ-431, REQ-438, REQ-440; see A-10 |
| 6 — tone by density | ✅ DD-035 uses the existing ramp and heighten rule; DD-032 uses `ringTone`/`toneOf`; one heighten per chart (REQ-442); the waffle's single path checked (I-4) |
| 7 — grounds as data | ✅ no chart picks a hatch angle or a colour (DD-032, REQ-450) |
| 7 — grounds as data | ✅ DD-032 reads the ground's levels and mechanism; REQ-447 |
| 8 — dependencies | ✅ no new dependency (DD-028); allowlist unchanged; only A-01's stale stack row |
| 9 — specs first | ✅ this delta; every MUST has a task |
