# silverpoint — Implementation Plan

## Metadata

| Field | Value |
|---|---|
| **Author** | Ernesto Crespo |
| **Status** | `IN_REVIEW` |
| **Version** | 1.7 |
| **Date** | 2026-09-29 |
| **PRD** | [`prd.md`](prd.md) v1.11 |
| **Tech Design** | [`technical-design.md`](technical-design.md) v1.8 |
| **Data Model** | [`data-model.md`](data-model.md) v1.6 |
| **API Spec** | [`api-spec.md`](api-spec.md) v1.9 |

---

## 1. Implementation Summary

Five phases for the catalog, a sixth —Phase 5— for the dashboard composition, and a seventh —Phase 6— for the interface components. The first delivers no catalog: it delivers **a single chart travelling
through the entire system** — core, inking, interaction, all three adapters and the gates — to
retire the risks that could invalidate the architecture. If that slice closes, the three
that follow are repetition over engines that are already proven.

The grouping is not by visual resemblance but **by shared engine**, which is what governs
real cost:

| Engine | Charts | Phase |
|---|---|---|
| Pure layout, no scales | 6 — bullet, pyramid, treemap, density heatmap, sankey, activity grid | 1 |
| Cartesian scales | 15 — line, step, sparkline rows, KPI card, pill bars, stacked, composed, waterfall, funnel, curved area, range band, stream, scatter, bubble, candlestick | 2 |
| Polar arcs | 10 — donut, radar, polar bars, radial arc group, radial rings, gauge arc, meter, coxcomb, wind rose, volvelle | 3 |
| Own geometry | 2 — chord ring, armillary orbits | 3 |

> **Correction against PRD v1.2.** That version grouped them as "8 without scales / 13
> cartesian / 12 polar". Broken down per engine, candlestick and sparkline rows do need a
> scale and move to Phase 2: the real split is 6 / 15 / 10 + 2. The PRD was amended
> accordingly in v1.4.

**Estimated effort:** 19-26 weeks. **Team:** one person, part time.
**Explicit assumption:** these are relative efforts, not delivery commitments. The plan
must be pausable between phases without leaving the repository inconsistent.

## 2. Prerequisites

| Prerequisite | Status |
|---|---|
| All seven spec artifacts approved | ☐ Pending |
| Analyze gate re-run with no blocking findings open | ☐ Pending |
| `@silverpoint` organisation reserved on npm and on GitHub | ☐ Pending |
| EB Garamond OFL reviewed and `NOTICE` drafted | ☐ Pending |
| CI runner on a digest-pinned image, for the pixel gate | ☐ Pending |

---

## 3. Phases

### Phase 0 — Vertical slice

**Effort:** 4-5 weeks. **Goal:** retire the risks that could invalidate the architecture,
using a single chart.

Delivers the monorepo, the scale engine, the `Inker` interface with `NullInker` and
`RoughInker`, the complete `silverpoint` ground, the typeface package, **the interaction
engine**, **the line chart in all three adapters — React, Vue and Angular** — and both
gates working.

> Interaction is in this phase deliberately. "Hit-testing is a pure function of the core"
> is an architectural claim, and it is one of the capabilities given up by not adopting a
> charting engine. Discovering in Phase 2 that it was not viable would be discovering it
> too late. This closes Analyze finding A-03.

Tasks are broken out in [`tasks.md`](tasks.md).

**Done criteria**
- The string gate compares the line chart rendered by all three adapters against the
  fixture's canonical render and finds them identical.
- The pixel gate produces golden images for the 2 modes × 4 substrates.
- Hover and keyboard focus both resolve the active item, through the same pure core function.
- A deliberately dense hatched card has its path weight measured, and the 40 KB budget is
  confirmed or corrected with data.
- The contrast script validates the ground and fails if a colour is altered.
- `axe-core` reports no A or AA issues for the line chart across all four example apps.
- Every subpath resolves under both `vite dev` and `vite build`, with no `optimizeDeps`
  entry in the example app, and the stylesheet import survives tree-shaking.
- `0.1.0` is published to npm from CI, with no tokens.

**Stop condition.** If the normaliser cannot reconcile the output of the two server
renderers, **Phase 1 does not start**: DD-004 degrades to AST comparison or the gate is
rethought. That is the risk this phase exists to resolve.

---

### Phase 1 — Layout engine

**Effort:** 3-4 weeks. **Goal:** the 6 charts that need no scales.

Bullet, pyramid, treemap, density heatmap, sankey and activity grid. They are direct
geometry, so they exercise the pipeline without depending on the scale engine and produce
a showable catalog early.

**Done criteria**
- All 6 in all three adapters, with their fixtures in the matrix.
- **Path weight measured for the matrix families**, which are many small shapes rather than
  few large ones and are where the tile helps least. This is the open question the
  Technical Design deferred to this phase.
- Tabular alternative and keyboard navigation on all 6.
- Each chart reviewed against REQ-124: no information carried by hatch style alone.

---

### Phase 2 — Cartesian scale engine

**Effort:** 5-6 weeks. **Goal:** the 15 cartesian charts.

A single scale engine and one family of path generators serve them all. The line chart
already exists from Phase 0, so these are 14 new recipes over proven infrastructure.

**Done criteria**
- All 15 with fixtures and `ink`/`precision` vertex equivalence verified.
- Candlestick with its `low ≤ min(open,close) ≤ max(open,close) ≤ high` invariant tested.
- The 500-point-per-series ceiling verified, with `SP008` actually emitted.
- Each chart reviewed against REQ-124.

---

### Phase 3 — Arc engine and own geometry

**Effort:** 5-6 weeks. **Goal:** the 12 polar charts.

Ten share the arc engine. **The chord ring and the armillary orbits do not**, and are
planned as separate work inside the phase: ribbons over `d3-chord`, and elliptical arcs
with markers positioned along the path.

**Done criteria**
- All 12 with fixtures.
- The 60-sector ceiling and the chord ring's 12-category ceiling, with `SP008` and `SP010`.
- Wind rose exercised with real directional data, not synthetic.
- Each chart reviewed against REQ-124.

---

### Phase 4 — Close-out

**Effort:** 2-3 weeks. **Goal:** publishable.

**Done criteria**
- WCAG 2.1 AA audit across all four apps, no A or AA issues.
- REQ-124 verified across the whole catalog as a single pass, not chart by chart.
- Bundle budgets green for all six packages.
- The 2 ms and 16 ms benchmarks green.
- Documentation site with gallery, ground playground and the 10-minute quickstart.
- The full 1,584-fixture matrix green on the nightly run.
- Published from CI. *As executed:* `0.1.1` was published on 2026-09-25; `1.0.0`, which puts the
  API Spec in force, is deferred by decision (the line stays on `0.x`, next release `0.2.0`).

### Phase 5 — Dashboard composition, and the demo rule

**Effort:** 3-4 weeks. **Goal:** a consumer composes a server-renderable, accessible, responsive
grid of cards in React, Vue or Angular from one data-only layout, with parity held across the
three adapters (PRD §6.10, API Spec §7.1, DD-013..DD-018, Data Model §2.13). Released in `0.2.0`,
together with REQ-098 and REQ-099 (view props apply to the demo; the props reference says what
the demo ignores).

**Tasks:** `changes/feature-001-dashboard/plan-and-tasks.md` (dashboard),
`changes/delta-011-volvelle-demo-index.md` (demo rule) and
`changes/delta-012-everything-in-0-2-0.md` (step 5g), continuing the global task sequence.

| Step | Content | Exit |
|---|---|---|
| 5a | Core: types, `resolveDashboard`, `cellChartBox`, diagnostics, reference layouts | Core unit tests and the 0.5 ms benchmark green |
| 5b | Adapters ×3, stylesheet, server entry points | Adapter unit and type tests |
| 5c | Dashboard fixtures, tree gate over the wrapper, pixel gate per breakpoint | 24 parity and 72 pixel fixtures green |
| 5d | Example apps: hydration, axe, reading order | Four apps green |
| 5e | Linked interaction (SHOULD) | May slip to a later minor without blocking 5f |
| 5f | Docs, budgets, changeset | `0.2.0` from CI |
| 5h | Delta-013: `@silverpoint/tailwind`, the optional preset (REQ-047) | Both Tailwind majors compile its utilities; first version published by hand, then by CI |
| 5g | Delta-012: the `cyanotype` ground (REQ-028), REQ-220 per adapter, Angular CLI SSR (REQ-222) | Tree and pixel gates green with `cyanotype`; four apps hydrate |

**Done criteria**
- Every MUST in REQ-098, REQ-099 and REQ-200..REQ-221 cited by a test; traceability 0 blocking.
- Parity gate green on the 24 dashboard parity fixtures; pixel gates green on all 72.
- The four example apps have the reference dashboard page, green in e2e and axe.
- `dashboard` subpath within its allowance over the one-chart build: 2 KB for React and Vue, 3 KB
  for Angular (REQ-220, delta-012).
- Delta-012: REQ-028 and REQ-222 cited by tests; `cyanotype` in the fixture matrix (330 PR, 1,782
  nightly; 30 parity and 90 pixel dashboard fixtures); the Angular example app server-rendered.
- No canonical chart fixture changed by the demo rule.

### Phase 6 — UI components

**Effort:** 4-5 weeks. **Goal:** a consumer builds the controls around their charts —buttons,
form controls, tabs, steps, cards, tags, progress, alerts— in React, Vue or Angular, drawn in the
same ground as the charts, exact where the user reads or aims, accessible, server-rendered, with
parity across the three adapters (PRD §6.11, REQ-300..REQ-334; API Spec UI section;
DD-021..DD-027; Data Model §2.14, §3.8). All 17 components ship together in `0.3.0`.

**Tasks:** #135..#163, continuing the global sequence after #134; the task list, with the
REQ → task traceability, is kept below. The numbers continue the sequence but the tasks are defined
in the feature's ledger (`changes/feature-002-ui-components/plan-and-tasks.md`, where each reads
`T-` followed by its number), not in [`tasks.md`](tasks.md), as for Phase 5; they are written `#NNN`
here so the corpus check does not look for them in `tasks.md`. A component is a catalog row in its own `UI_COMPONENTS`
list, and every gate iterates it.

| Step | Content | Tasks | Depends on | Exit |
|---|---|---|---|---|
| 6a | Core: types, value, keyboard, frame variant and outlines, items, names, demo | #135..#138 | Approval | Core unit tests and benchmarks green |
| 6b | Grounds: `ui` tokens, piece generator, `ui.css`, contrast and colour lint | #139..#142 | 6a | Grounds tests; `ui.css` ≤ 24 KB gzip |
| 6c | Adapters ×3 in three batches: **B1** Button, Input, Checkbox, Switch, Card, Divider · **B2** RadioGroup, Segmented, Tabs, Slider, Rate · **B3** Steps, Tag, Badge, Progress, Alert, Skeleton | #143..#152 | 6b | Adapter unit tests and the 6d gates per batch; each batch is a review point |
| 6d | Fixtures, parity and pixel gates, mode invariance, budgets | #153..#156 | 6c (per batch) | 180 PR / 510 nightly fixtures green |
| 6e | Example apps UI page, e2e (APG, forms, hydration, reduced motion, RTL), axe | #157..#159 | 6d | Four apps green |
| 6f | Docs site, changeset, fold the deltas, traceability and `CLAUDE.md` status | #160..#163 | 6e | Release `0.3.0` |

**Status (2026-09-29).** Steps 6a..6f are done, with one exception: #159 (accessibility audit) is closed on
its automated half (axe, 0 A/AA issues) and waits on the manual NVDA/VoiceOver pass, which needs
Windows and macOS. The docs section (#160), the changeset (#161), this fold (#162) and the
traceability and status update (#163) are complete; `0.3.0` awaits its release commit.

Task summary (each task cites the requirement it implements; the ledger stays in
`changes/feature-002-ui-components/plan-and-tasks.md`):

| Step | Task | Content | REQ |
|---|---|---|---|
| 6a | #135 | UI types and the `UI_COMPONENTS` catalog row | REQ-300, REQ-302 |
| 6a | #136 | `uiValue`, `uiProgressArc`, `uiSteps` | REQ-302, REQ-304, REQ-324 |
| 6a | #137 | `uiRovingKey` | REQ-315, REQ-321, REQ-326 |
| 6a | #138 | `uiFrameVariant`, `uiFrameOutline`, `uiItems`, `uiRequireName`, `UI_DEMOS` | REQ-307, REQ-319, REQ-325 |
| 6b | #139 | `ui` tokens on both grounds and the schema | REQ-312 |
| 6b | #140 | Piece generator | REQ-305, REQ-307 |
| 6b | #141 | `ui.css` | REQ-301, REQ-305, REQ-306, REQ-308, REQ-316, REQ-317, REQ-320 |
| 6b | #142 | Contrast gate and weight | REQ-313, REQ-330 |
| 6c | #143 | Adapter UI base ×3 | REQ-311, REQ-329, REQ-333 |
| 6c | #144..#146 | B1 React, Vue, Angular | REQ-300, REQ-304, REQ-310, REQ-314, REQ-322, REQ-326, REQ-334 (+ REQ-108 Vue; REQ-101, REQ-323 Angular) |
| 6c | #147..#149 | B2 React, Vue, Angular | REQ-300, REQ-309, REQ-315, REQ-322, REQ-323, REQ-325, REQ-326 |
| 6c | #150..#152 | B3 React, Vue, Angular | REQ-300, REQ-308, REQ-318, REQ-319 |
| 6d | #153 | Component fixtures | REQ-327, REQ-182 |
| 6d | #154 | Parity gate on components | REQ-327 |
| 6d | #155 | Pixel gates and mode invariance | REQ-304, REQ-306, REQ-328 |
| 6d | #156 | Budgets | REQ-330 |
| 6e | #157 | UI page in the four apps | REQ-329, REQ-331 |
| 6e | #158 | Keyboard, forms and motion e2e | REQ-315, REQ-316, REQ-317, REQ-320, REQ-321, REQ-323 |
| 6e | #159 | Accessibility audit | REQ-313, REQ-314, REQ-318, REQ-331 |
| 6f | #160 | Docs site UI section | REQ-332 |
| 6f | #161 | Changeset (`minor`, `0.3.0`) | release |
| 6f | #162 | Fold the deltas (Art. 9) | Art. 9 |
| 6f | #163 | Traceability and status | REQ-183, REQ-184 |

**Traceability — REQ → tasks**

| REQ | Tasks | REQ | Tasks |
|---|---|---|---|
| 300 | #135, #144–#152 | 317 | #141, #158 |
| 301 | #141 | 318 | #150–#152, #159 |
| 302 | #135, #136 | 319 | #138, #150–#152 |
| 303 | #156 (allowlist check in `check-deps`) | 320 | #141, #158 |
| 304 | #136, #144–#146, #155 | 321 | #137, #158 |
| 305 | #140, #141 | 322 | #144–#149 |
| 306 | #141, #155 | 323 | #146, #149, #158 |
| 307 | #138, #140 | 324 | #136 |
| 308 | #141, #150–#152 | 325 | #138, #147–#149 |
| 309 | #147–#149 | 326 | #137, #144–#149 |
| 310 | #144–#146 | 327 | #153, #154 |
| 311 | #143 | 328 | #155 |
| 312 | #139 | 329 | #143, #157 |
| 313 | #142, #159 | 330 | #142, #156 |
| 314 | #144–#146, #159 | 331 | #157, #159 |
| 315 | #137, #147–#149, #158 | 332 | #160 |
| 316 | #141, #158 | 333 | #143 |
| | | 334 | #144–#146 |

Every task cites at least one requirement; no orphan task.

**Done criteria**
- Every MUST in REQ-300..REQ-334 cited by a test; traceability 0 blocking (REQ-183, REQ-184).
- Parity gate green on the 180 PR / 510 nightly component fixtures; pixel gates green on all.
- The four example apps have the UI page, green in e2e (APG keyboard, forms, hydration) and axe.
- Budgets of REQ-330 green (`ui.css` ≤ 24 KB gzip; per-component and runtime allowances); chart
  budgets unchanged, and `styles.css` byte-identical to `0.2.0` (REQ-301).
- Docs site: a UI section with a live example and generated props per component (REQ-332).
- Released as `0.3.0` (changeset `minor` from `0.2.0`) from CI; the deltas folded into `specs/`
  (#162) and `CLAUDE.md`'s status table updated (#163).

## 4. Dependency Map

```
Phase 0 ── vertical slice, gates operational
   │
   ├──▶ Phase 1 ── layout engine     ─┐
   │                                   │
   ├──▶ Phase 2 ── scale engine       ─┼──▶ Phase 4 ── close-out
   │                                   │
   └──▶ Phase 3 ── arc engine         ─┘            │
            └── chord and orbits (own geometry, inside the phase)
                                                       ▼
                                          Phase 5 ── dashboard composition
                                                       │
                                                       ▼
                                          Phase 6 ── UI components
```

Phases 1, 2 and 3 are **independent of one another** once Phase 0 closes: they share the
core but do not block each other. If the project has to pause, it pauses between phases and
the repository stays coherent — a partial catalog, but complete in what it exposes.

## 5. Implementation Risks

| Risk | Prob. | Impact | Mitigation |
|---|---|---|---|
| The normaliser cannot reconcile the two server renderers | Medium | High | It is Phase 0's stop condition; degrade to AST comparison |
| The 40 KB budget does not survive the matrix families | Medium | Medium | Explicit measurement in Phase 1's Done, before it propagates |
| The pixel gate proves noisy between CI runs | Medium | Medium | Digest-pinned image; if it persists, the string gate already covers geometry and the pixel gate drops to advisory |
| Phase 3 overruns because of chord and orbits | High | Medium | They are isolated: if they slip, the other 10 ship anyway |
| Angular 23 lands mid-project and moves the floor | High | Low | The two-majors policy already anticipates it; the cost is updating the CI matrix |
| Interaction in the core proves impractical | Low | High | Now surfaced in Phase 0 rather than Phase 2; if it fails, only the line chart has to be reworked |
| The dashboard's server render cannot know the container width | High | Medium | Nominal boxes at `ssrWidth`, re-render after hydration (DD-015) |
| Linked interaction grows into per-adapter state machines | Medium | Medium | Matching in the core (DD-016); it is SHOULD and may slip without blocking the release |
| The third adapter makes each catalog phase heavier than estimated | Medium | Medium | The adapters are thin by Art. 2 — a chart component is a translation, not logic. Phase 0 measures the real per-chart cost of the Vue adapter before the catalog phases commit to it |

## 6. Tracking

No ceremonies: this is a one-person project. Tracking lives in the repository.

- `tasks.md` is marked with a checkbox and a date as each task closes, so any session —
  human or agent — can resume with no prior context.
- A deviation from the spec **stops implementation**: update the spec or open a Delta in
  `changes/`, and only then continue.
- The Analyze gate is re-run at the close of each phase.

## 7. Definition of Done (global)

- [ ] Code merged, with a changeset.
- [ ] Every `MUST` touched has a test citing its `REQ-NNN`.
- [ ] String gate and pixel gate green.
- [ ] `axe-core` with no A or AA issues.
- [ ] Bundle and path-weight budgets green.
- [ ] Spec updated if implementation revealed it was wrong.
- [ ] No known debt without its issue.

---

## Change History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.7 | 2026-09-29 | Ernesto Crespo | Phase 6 added: the 17 UI components (steps 6a..6f, #135..#163), released in `0.3.0` (feature-002) |
| 1.6 | 2026-09-26 | Ernesto Crespo | Step 5h (delta-013): the Tailwind preset package |
| 1.5 | 2026-09-26 | Ernesto Crespo | Step 5g (delta-012): the `cyanotype` ground, REQ-220 per adapter and Angular CLI SSR join `0.2.0` |
| 1.4 | 2026-09-25 | Ernesto Crespo | Phase 5 added: dashboard composition and the demo rule, released in `0.2.0`; Phase 4's `1.0.0` criterion recorded as deferred by decision |
| 1.3 | 2026-09-13 | Ernesto Crespo | Vue added as a third adapter: Phase 0 covers all three, effort revised to 19-26 weeks, a fourth example app |
| 1.2 | 2026-09-13 | Ernesto Crespo | Vite raised to a validated integration: bundler-resolution Done criterion added to Phase 0 (REQ-033, REQ-034) |
| 1.1 | 2026-09-13 | Ernesto Crespo | Converted to English; interaction pulled into Phase 0 (Analyze finding A-03), REQ-124 given a verification point per phase (finding A-06), effort revised to 15-21 weeks |
| 1.0 | 2026-09-13 | Ernesto Crespo | Initial version. Regroups phases by shared engine and corrects the PRD's split |

## Constitution check

- **Art. 3** — both gates are operational at the end of Phase 0, not at the end of the project.
- **Art. 5** — accessibility is a Done criterion in every phase, not a final pass; Phase 4
  only audits what should already hold.
- **Art. 9** — §6 fixes the procedure on a deviation: stop and update the spec.
- **Art. 3** (v1.5) — Phase 5's Done includes the tree and pixel gates over the dashboard
  compositions.
- **Art. 1, 3, 5, 6** (v1.7) — Phase 6's Done includes the tree and pixel gates over the
  component fixtures, `ink`/`precision` box equivalence (I-17) and one heightening per instance.
- **Exception requested:** none.
