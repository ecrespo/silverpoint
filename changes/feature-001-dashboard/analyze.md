# Analyze — feature-001 Dashboard, before implementation

> Read-only cross-artifact pass over [`prd-delta.md`](prd-delta.md), [`api-delta.md`](api-delta.md),
> [`technical-design-delta.md`](technical-design-delta.md), [`data-model-delta.md`](data-model-delta.md)
> and [`plan-and-tasks.md`](plan-and-tasks.md), against the Constitution v1.4 and `specs/` as they
> stand. Run 2026-09-25 on the drafts. The user decides what is fixed before `implement`.

## Coverage

- **22 requirements** (19 MUST, 3 SHOULD). Every MUST maps to at least one task
  (plan-and-tasks §Traceability); every task cites at least one REQ; no orphan task.
- Every API element traces to a REQ: components → 200; `resolveDashboard` → 201; CSS variables →
  202; `SP014` → 204; `SP015` → 205; `cellChartBox` → 206; `ssrWidth` → 207; `id` required → 209;
  inheritance → 212; accessibility contract → 214; `link`/`onLinkChange`/`linkedItems` → 216–218;
  `part="linked"` client-only → 219; budget → 220.
- Every type field is in the Data Model with domain, default and invalid-value behaviour (§2.13).

## Findings

| # | Severity | Kind | Finding | Where | Proposed resolution |
|---|---|---|---|---|---|
| A-01 | MEDIUM | Constitution | Art. 3 speaks of "normalised **SVG** output". DD-017 extends the gate to HTML wrapper markup. It is stricter, not an exception, but the article's text does not cover it | Constitution Art. 3; DD-017 | Amend Art. 3 to "normalised markup —the SVG of every chart and any wrapper the library emits—" (v1.5), approved by the user before T-116 |
| A-02 | MEDIUM | Scope | PRD §5.2 today lists "Visual editor or dashboard builder" as out of scope. The PRD delta narrows it. Without the amendment approved, the feature contradicts the PRD | PRD §5.2 | Approve the §5.2 amendment as part of gate 1 |
| A-03 | LOW | Ambiguity | DD-015 picks the breakpoint for nominal boxes from `ssrWidth`, but the rule "when `ssrWidth` is under 1024, the breakpoint it falls in" is stated only in the TD, not in the API delta default table | TD DD-015; API delta §3 | Add the rule to the `ssrWidth` row in the API delta |
| A-04 | LOW | Terminology | Cells above 24 reuse `SP008`, whose requirement is REQ-096 (data volume per chart). The diagnostic would cite the wrong REQ (API §11: "every diagnostic includes the REQ that motivates it") | API delta §9 | Either make the 24-cell limit advisory in docs only, or add `SP017` citing a new SHOULD. Leaning: docs only |
| A-05 | LOW | Dependency | REQ-219 (MUST) belongs to linked interaction, which is SHOULD and may slip to `0.3.0` (step 5e). Its test must not slip with it | plan-and-tasks | Resolved in the draft: T-111 covers it by type test and I-15 on the server render, independently of T-121 |
| A-06 | LOW | Precedence | API Spec §5.1 today writes precedence as prop → provider → media query → default and also says the media query cannot be overridden by prop. The dashboard delta inserts a level and keeps the wording; the pre-existing sentence is ambiguous about where the media query sits | API §5.1 (existing) | While folding: state the media query as an override applied after resolution, not a level in the chain |
| A-07 | LOW | Testability | REQ-206 "every card in a row has the same outer height" holds only for cells with equal `rowSpan` (I-13 says so; the REQ does not) | PRD delta REQ-206 | Add "with equal `rowSpan`" to REQ-206 |
| A-08 | INFO | Open decision | OQ-D1 (one heightening per dashboard?) and OQ-D4 (release version) need the user | TD §6 | Ask at gate 1 |

**Blocking:** none.

## Dispositions — decided by the user on 2026-09-25

| # | Decision | Applied in |
|---|---|---|
| A-01 | **Approved.** Art. 3 is amended to "normalised markup" (Constitution v1.5) | [`constitution-amendment.md`](constitution-amendment.md); folded into `specs/constitution.md` on 2026-09-25 |
| A-02 | **Approved.** §5.2 excludes only the *interactive* builder | `prd-delta.md` §3 and status |
| A-03 | **Approved.** The `ssrWidth` → breakpoint rule is in the API default table | `api-delta.md` §3 |
| A-04 | **Approved, docs only.** 24 cells is advisory; no diagnostic, so no REQ is mis-cited | `api-delta.md` §9 |
| A-05 | **Approved** as already resolved: T-111 tests REQ-219 independently of T-121 | `plan-and-tasks.md` |
| A-06 | **Approved.** The media query is an override after resolution, not a level in the chain; same wording goes into API §5.1 on folding | `api-delta.md` §3 |
| A-07 | **Approved.** REQ-206 now says "with equal `rowSpan`" | `prd-delta.md` REQ-206 |
| A-08 / OQ-D1 | **One heightening per chart**, as Art. 6 says; no dashboard-wide cap | `technical-design-delta.md` §6 |
| A-08 / OQ-D4 | **Stay on 0.x: release `0.2.0`** (changeset `minor` from 0.1.1). `1.0.0` stays parked | README, TD §6, plan, delta-011 |

No finding remains open. Gates 1–4 were approved by the user on 2026-09-25.

## Constitution scan

| Article | Holds | Evidence |
|---|---|---|
| 1 | ✅ | Linked marks are overlays; no encoding stroke changes |
| 2 | ✅ | REQ-201, REQ-206, T-114 lint |
| 3 | ✅ (A-01 amended) | REQ-210, REQ-211, DD-017 |
| 4 | ✅ | REQ-209, `id` required, REQ-219 |
| 5 | ✅ | REQ-203, REQ-214, REQ-215, REQ-218 |
| 6 | ✅ | Heightening stays one per chart (OQ-D1 decided) |
| 7 | ✅ | Dashboard chrome reads ground tokens only (REQ-213) |
| 8 | ✅ | CSS Grid + `--sp-` properties; REQ-220 budget |
| 9 | ✅ | Deltas in `changes/`, REQ per task, fold in T-123 |
