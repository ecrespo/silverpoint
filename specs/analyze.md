# Analyze — silverpoint · 2026-09-13 (fourth run)

Read-only cross-artifact validation of the seven artifacts, before implementation.
**Nothing was corrected during this run**: Analyze presents findings; approval and
correction are human decisions.

Scope: `constitution` v1.4, `prd` v1.7, `api-spec` v1.5, `technical-design` v1.4,
`data-model` v1.3, `implementation-plan` v1.3, `tasks` (Phase 0, 29 tasks).

This is the fourth run. The third was triggered by a scope question that turned out to be
misstated — the framework to add was Vue, not Vite — so the corpus absorbed two scope
changes in sequence: Vite raised to a validated integration (§3.1), then Vue added as a
third supported framework (§3.2). §3 records the first run's twelve findings.

## 1. Mechanical checks

| Check | Result |
|---|---|
| Requirements defined | 105 · 99 MUST, 5 SHOULD, 1 COULD |
| Duplicate or phantom identifiers | None |
| Requirement IDs cited but undefined | None, across all six sibling documents |
| Orphan tasks (no REQ) | None |
| MUST without a Phase 0 task | 29 — **all 29 are catalog charts**, covered by phases 1-3 and listed in the Deferred table |
| SHOULD / COULD without a task | All declared as deferred, with target phase |
| Stale cross-document version references | None |
| Fact drift (decimals, node budget, retired tokens, path weight) | None |
| Cycles in the task dependency graph | None |
| Task numbering | Contiguous, T-001 to T-029 |
| Traceability matrix vs. per-task REQ lines | Agrees in both directions, after the §3.3 rebuild |
| How the above was verified | `node tools/spec-check/spec-check.mjs` — 0 errors, 2 accepted warnings (§3.3) |

## 2. Findings

| # | Severity | Category | Finding | Artifacts | Suggestion |
|---|---|---|---|---|---|
| B-01 | LOW | Consistency | `api-spec.md` names its version field `**API version**` while every sibling uses `**Version**`. A validation script keying on the common label skips it. | `api-spec` | Either rename the field or make the CI check accept both spellings |
| B-05 | LOW | Scope | Nuxt is not a validated integration, while Next.js is. Symmetric frameworks with asymmetric SSR hosts is defensible but worth revisiting once the Vue adapter exists. | `technical-design` DD-012 | Reassess after Phase 0 |
| B-04 | LOW | Process | The spec corpus is duplicated in two repositories — the original planning folder and the implementation repo. They are byte-identical today, which is precisely when divergence is cheapest to prevent. | both repos | Make the implementation repo canonical and reduce the other to a pointer, or symlink |
| B-02 | LOW | Traceability | The path-weight figures (76 KB per card, 913 KB per dashboard) are KiB derived from a raw byte measurement, but the documents write plain "KB". Nothing is wrong arithmetically; the unit is simply imprecise. | `prd` §11, `technical-design` DD-007 | State the raw byte counts alongside, or switch to KiB |
| B-03 | LOW | Coverage | REQ-095 (`chrome: 'bare'`) carries the `optional` EARS pattern but `MUST` priority. That is coherent — the feature is optional, implementing it is not — but it is the only requirement in the document with that combination and reads as an error. | `prd` REQ-095 | Leave as is and add a footnote, or split into a ubiquitous MUST plus an optional criterion |

No CRITICAL, HIGH or MEDIUM findings.

## 3.1 The Vite change

Validated against all eight artifacts. Vite appeared eleven times, but **seven of those were
Vitest**, the test runner. The four real mentions were an example app, a directory in the
monorepo tree, a line in the task list and one passing clause in the PRD's scope. Next.js
had REQ-103; Vite had no requirement at all.

The frameworks at that point remained **React and Angular** — Vue was added in §3.2. They are the ones contributing a component
layer, and therefore the only two with an adapter package. Vite is now a **validated
integration** at the same rank as Next.js:

| Artifact | Change |
|---|---|
| `constitution` v1.3 | Stack constraints now separate *supported frameworks* from *validated integrations*, so the distinction is stated where nobody re-litigates it |
| `prd` v1.6 | REQ-033 (subpath resolution identical in dev and build, no `optimizeDeps` override) and REQ-034 (stylesheet survives tree-shaking); Vite compatibility floor stated |
| `api-spec` v1.4 | §1.1, the bundler consumption contract |
| `technical-design` v1.3 | DD-011, with the three failure modes it closes; bundler resolution added to the testing strategy |
| `implementation-plan` v1.2 | Phase 0 Done criterion |
| `tasks` | T-001 extended with `exports` condition order and `sideEffects`; new T-023, the resolution check; 28 tasks |

## 3.2 The Vue change

Vue contributes a component layer, so unlike a build tool it earns an adapter package. The
supported frameworks are now **React, Angular and Vue**; the validated integrations are
unchanged.

| Artifact | Change |
|---|---|
| `constitution` v1.4 | Vue in the stack table; **Art. 3 amended**: parity is verified against a canonical render, not pairwise |
| `prd` v1.7 | REQ-108 (`<script setup>`, typed props and emits) and REQ-109 (SSR hydration under `@vue/server-renderer`); `@silverpoint/vue` in REQ-160 and REQ-161; REQ-100 reformulated |
| `api-spec` v1.5 | Package, naming convention, a Vue column across all 33 catalog rows, §8.3 and Vue emits in §9 |
| `technical-design` v1.4 | DD-012 (the Vue adapter, with its alternatives); DD-009 extended to cover `v-for`; **DD-004 amended** for the canonical reference |
| `data-model` v1.3 | `Fixture` gains `canonical` |
| `implementation-plan` v1.3 | Phase 0 covers three adapters; effort 15-21 → **19-26 weeks**; a fourth example app; a new risk row |
| `tasks` | T-017, the Vue adapter; 29 tasks; the string gate now compares three adapters against the canonical render |

**The architectural consequence worth naming.** With two adapters a pairwise comparison was
adequate. With three it stops being: pairs grow quadratically, no pair is privileged, and a
disagreement does not say which side is wrong. Comparing each adapter against a canonical
render stored with the fixture makes a fourth adapter cost one comparison instead of three,
and makes a failure name the guilty adapter. **The third framework is what forced the gate
into its correct shape** — which is an argument for having added it now rather than after
v1.0.

**Nuxt is deliberately not a validated integration.** SSR parity is verified directly with
`@vue/server-renderer` (REQ-109), which is what the gate consumes; a Nuxt app consumes the
package like any other Vue app. Adding it later is an example app and a CI job, not an
architectural change. Recorded here so the omission reads as a decision.

## 3.3 The matrix rebuilt, and the gate automated

The Vue change was applied by hand across eight documents, and hand-editing a graph of
identifiers is how a corpus rots. A fifth pass, run mechanically, found what the reading
passes had missed:

| Defect | Where |
|---|---|
| The A-03 disposition row still named `T-017` as the readout task after renumbering made it the Vue adapter | §3, A-03 |
| Five tasks depended on the React and Angular adapters without naming T-017: T-018, T-020, T-023, T-026, T-028 | `tasks` |
| The Constitution's `Scope` line listed the monorepo packages and omitted `@silverpoint/vue` | `constitution` |
| The traceability matrix collapsed distinct mappings into shared rows, so four requirements T-017 delivers (REQ-095, REQ-100, REQ-102, REQ-107) were not mapped to it, and three rows claimed tasks that do not name them | `tasks` |

The matrix is now **generated from the task blocks**, which are authoritative: a row groups
the requirements whose delivering task set is identical. It grew from 28 rows to 33 — the
extra rows are the distinctions the hand-written version had blurred.

**The gate is `tools/spec-check/spec-check.mjs`**, zero dependencies, wired into `pnpm lint`
and therefore into T-002's CI rule. It checks: requirements declared exactly once; task
numbering contiguous from T-001; dependencies that resolve, are acyclic and point backwards;
every `REQ-NNN`, `T-NNN`, `DD-NNN` and `SPNNN` referenced anywhere resolving to a definition;
each document declaring a version and every sibling citing the one it declares; and the
traceability matrix agreeing with the per-task `REQ` lines in both directions. It exits
non-zero on any error.

This also closes **B-01**: the check accepts both `**Version**` and the API Spec's
`**API version**` spelling, so no document is silently skipped.

Two findings are reported as warnings and left standing on purpose. T-022 depends on T-023,
which is defined later — true, and harmless, since the numbering follows subject matter
rather than execution order. T-027 cites `PRD NFR §7` instead of a requirement, because it
is a measurement task that produces a number the spec is waiting on, not a deliverable that
satisfies a requirement.

**The wider point.** Every defect in the table above was introduced by a correct decision
applied by hand, and every one was invisible to careful reading. The specs are a graph;
nothing in Markdown enforces a graph. Until this pass, the only thing holding the corpus
together was attention, which does not survive Phase 1.

## 3. Disposition of the first run's findings

| # | First-run severity | Status | How it was closed |
|---|---|---|---|
| A-01 | CRITICAL | **Closed** | Constitution Art. 3 amended to 2 decimals, with its amendment row; the document is at v1.2 |
| A-02 | CRITICAL | **Closed** | The demo activity-grid dataset now pins its end date to `2026-06-30`; `today` is used only for consumer-supplied data |
| A-03 | HIGH | **Closed** | Interaction pulled into Phase 0: T-009 (hit-testing engine in the core) and T-018 (readout wired in all three adapters); the plan's Done criteria and risk table updated |
| A-04 | HIGH | **Closed** | REQ-044 verification added to T-002 as a CI rule on the files a PR touches |
| A-05 | HIGH | **Closed** | REQ-032 added to the PRD, `SP013` added to the API Spec diagnostics, and DD-010 now states that a font-load failure is observable |
| A-06 | HIGH | **Closed** | REQ-124 given a verification point in the Done criteria of phases 1, 2 and 3, plus a single catalog-wide pass in Phase 4 |
| A-07 | MEDIUM | **Closed** | REQ-095 cited in T-008, T-015 and T-016 |
| A-08 | MEDIUM | **Closed** | Both "3 decimals" instances in the Technical Design corrected to 2 |
| A-09 | MEDIUM | **Closed** | REQ-025, REQ-026, REQ-045, REQ-161 and REQ-162 now cited in the tasks that implement them |
| A-10 | MEDIUM | **Closed** | All cross-document version references aligned; verified mechanically |
| A-11 | LOW | **Closed** | "Input shape" replaces the overloaded "geometric family" in the Data Model |
| A-12 | LOW | **Closed** | Tasks now carry a Deferred table with target phase for every non-Phase-0 SHOULD and COULD |

Four defects inherited from the source documents were also corrected in passing, none of
which the first run had caught: a dangling `§7.2` cross-reference in the API Spec, a blank
line splitting the dependency allowlist table in two, an out-of-order change history in the
PRD, and the card path weight stated as 78 KB where the measurement gives 76 KB.

## 4. Categories with no findings

- **Constitution.** No artifact contradicts an article. No exception is requested: the one
  raised against Art. 6 was withdrawn when the fill moved to a tile per tonal level.
- **Ambiguity.** All 101 criteria name an observable outcome. Limits carry value and unit:
  500 points, 60 sectors, 12 categories, 40 KB, 45 KB, 2 ms, 16 ms, 4.5:1, 3:1, 24 px.
- **Unhappy paths.** 18 `IF…THEN` criteria cover empty datasets, non-finite values,
  zero-sized containers, degenerate domains, unknown grounds and inkers, duplicate
  heightening, missing scale bounds, exceeded budgets and typeface load failure.
- **API ↔ Data Model consistency.** Field names and types match; the four substrates in
  API Spec §10.2 are those of Data Model §3.1, hex for hex.
- **Task executability.** No cycles, `[P]` only where no files are shared, every `Done` is
  a command or an observation, and the supervised first batch is marked (T-001 to T-004).

## 5. Note on partial coverage

That 29 catalog MUSTs have no task is **not a finding**: `tasks.md` deliberately covers
Phase 0 only, and the template itself discourages lists beyond 40 tasks. Phases 1 to 3
generate their own as each predecessor closes. What the first run correctly flagged was
that twelve *non-catalog* MUSTs had fallen outside without being declared; that is now
closed.

---

## Verdict

**READY TO IMPLEMENT.**

The five remaining findings are LOW and none of them changes behaviour: two are
presentational, one is a readability objection to a requirement that is coherent as written,
one is process hygiene and one is a scope question to revisit after Phase 0. They can be picked up during Phase 0 or left alone.

The gating conditions that matter are elsewhere, and they are in the plan rather than in
this report: Phase 0 carries an explicit stop condition on the string gate, and Phase 1
carries the path-weight measurement for the matrix families. Neither is a spec defect —
both are questions that only code can answer.
