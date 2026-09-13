# Analyze — silverpoint · 2026-09-13 (second run)

Read-only cross-artifact validation of the seven artifacts, before implementation.
**Nothing was corrected during this run**: Analyze presents findings; approval and
correction are human decisions.

Scope: `constitution` v1.2, `prd` v1.5, `api-spec` v1.3, `technical-design` v1.2,
`data-model` v1.1, `implementation-plan` v1.1, `tasks` (Phase 0, 27 tasks).

This is the second run. The first, on the Spanish corpus, raised twelve findings; all
twelve were addressed before this run. §3 records what each correction did.

## 1. Mechanical checks

| Check | Result |
|---|---|
| Requirements defined | 101 · 95 MUST, 5 SHOULD, 1 COULD |
| Duplicate or phantom identifiers | None |
| Requirement IDs cited but undefined | None, across all six sibling documents |
| Orphan tasks (no REQ) | None |
| MUST without a Phase 0 task | 29 — **all 29 are catalog charts**, covered by phases 1-3 and listed in the Deferred table |
| SHOULD / COULD without a task | All declared as deferred, with target phase |
| Stale cross-document version references | None |
| Fact drift (decimals, node budget, retired tokens, path weight) | None |
| Cycles in the task dependency graph | None |

## 2. Findings

| # | Severity | Category | Finding | Artifacts | Suggestion |
|---|---|---|---|---|---|
| B-01 | LOW | Consistency | `api-spec.md` names its version field `**API version**` while every sibling uses `**Version**`. A validation script keying on the common label skips it. | `api-spec` | Either rename the field or make the CI check accept both spellings |
| B-02 | LOW | Traceability | The path-weight figures (76 KB per card, 913 KB per dashboard) are KiB derived from a raw byte measurement, but the documents write plain "KB". Nothing is wrong arithmetically; the unit is simply imprecise. | `prd` §11, `technical-design` DD-007 | State the raw byte counts alongside, or switch to KiB |
| B-03 | LOW | Coverage | REQ-095 (`chrome: 'bare'`) carries the `optional` EARS pattern but `MUST` priority. That is coherent — the feature is optional, implementing it is not — but it is the only requirement in the document with that combination and reads as an error. | `prd` REQ-095 | Leave as is and add a footnote, or split into a ubiquitous MUST plus an optional criterion |

No CRITICAL, HIGH or MEDIUM findings.

## 3. Disposition of the first run's findings

| # | First-run severity | Status | How it was closed |
|---|---|---|---|
| A-01 | CRITICAL | **Closed** | Constitution Art. 3 amended to 2 decimals, with its amendment row; the document is at v1.2 |
| A-02 | CRITICAL | **Closed** | The demo activity-grid dataset now pins its end date to `2026-06-30`; `today` is used only for consumer-supplied data |
| A-03 | HIGH | **Closed** | Interaction pulled into Phase 0: T-009 (hit-testing engine in the core) and T-017 (readout wired in both adapters); the plan's Done criteria and risk table updated |
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

The three remaining findings are LOW and none of them changes behaviour: two are
presentational and one is a readability objection to a requirement that is coherent as
written. They can be picked up during Phase 0 or left alone.

The gating conditions that matter are elsewhere, and they are in the plan rather than in
this report: Phase 0 carries an explicit stop condition on the string gate, and Phase 1
carries the path-weight measurement for the matrix families. Neither is a spec defect —
both are questions that only code can answer.
