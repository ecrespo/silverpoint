# Analyze — feature-002 UI components, before implementation

> Read-only cross-artifact pass over [`prd-delta.md`](prd-delta.md), [`api-delta.md`](api-delta.md),
> [`technical-design-delta.md`](technical-design-delta.md), [`data-model-delta.md`](data-model-delta.md),
> [`plan-and-tasks.md`](plan-and-tasks.md) and [`constitution-amendment.md`](constitution-amendment.md),
> against the Constitution v1.6 and `specs/` as they stand. Run 2026-09-26 on the drafts. The user
> decides what is fixed before `implement`.

## Coverage

- **34 requirements** (32 MUST, 2 SHOULD). Every requirement maps to at least one task
  (plan-and-tasks §Traceability); every task cites at least one REQ; no orphan task.
- Every API element traces to a REQ: subpaths and names → 300; `ui.css` → 301; core functions →
  302, 307, 315, 319, 324, 325; markup contract → 314, 318, 327; value binding → 322, 323; CSS
  properties → 316, 317; `SP017`/`SP018`/`SP019` → 324/319/325; budgets → 330.
- Every value and token in the API is in the Data Model with domain, default and invalid-value
  behaviour (§2.14, §3.8).
- Identifier ranges do not collide: REQ-300..333 (the PRD ends at REQ-222), DD-021..027 (TD ends at
  DD-020), `SP017..019` (API ends at `SP016`), T-135..163 (tasks end at T-134), I-17..22 (Data Model
  ends at I-16).

## Findings

| # | Severity | Kind | Finding | Where | Proposed resolution |
|---|---|---|---|---|---|
| A-01 | MEDIUM | Constitution | "What silverpoint is", Art. 1, 3, 5 and 6 speak only of charts; without the amendment, components are either unbound or bound nonsensically (a button has no "data") | Constitution | Approve [`constitution-amendment.md`](constitution-amendment.md) (v1.7) with gate 1 |
| A-02 | MEDIUM | Scope / risk | 17 components × 3 adapters is the largest phase so far (≈ 51 component implementations) | Plan 6c | Batches B1–B3 each ship alone; the user may set `0.3.0` = B1 + B2 (OQ-U3) |
| A-03 | MEDIUM | Parity | DD-024's Angular attribute components leave the host element to the consumer; a consumer who adds attributes to `<button spButton>` changes the markup. The gate is unaffected (fixtures own their markup), but the docs must say parity holds for the library's output only | DD-024; API §4 | Add the sentence to API §10.3 on folding |
| A-04 | LOW | Testability | REQ-313 extends contrast to "every graphical object needed to identify a control"; the Data Model lists the pairs, the PRD does not. A test can only check listed pairs | PRD REQ-313; DM §3.8 | Make REQ-313 cite Data Model §3.8 as the normative list |
| A-05 | LOW | Compatibility | CSS mask layering is pixel-gated only in the pinned Chromium; Firefox and WebKit get presence checks, not pixel checks | TD DD-022; T-158 | Accept (Art. 3 declares a single pinned browser); record in the risks table, as done |
| A-06 | LOW | Ambiguity | Data Model §2.14 lets an unknown key fall back silently for Segmented/Tabs, while range errors warn. The asymmetry is deliberate (not a range) but undocumented in the API | DM §2.14; API §2 | State it in the API value table on folding |
| A-07 | LOW | Terminology | "Tone" names the ramp level (1-4) and also `Button.tone` (`default`/`primary`/`danger`) | API §2 | Rename the Button prop to `variant` before gate 2, or accept; leaning: rename |
| A-08 | INFO | Open decisions | OQ-U1 (subpath vs packages), OQ-U2 (React names), OQ-U3 (release scope), OQ-U4 (Angular attribute selectors) need the user | README; TD §6 | Ask at gate 1 |
| A-09 | INFO | Dependency | REQ-332 (docs site) depends on the props generator of `docs/site` handling the `ui/` subpaths | T-160 | None now; T-160 extends the generator |

**Blocking:** none.

## Constitution scan

| Article | Holds | Evidence |
|---|---|---|
| 1 | ✅ with A-01 | REQ-304, REQ-306, DD-022, DD-025, I-17 |
| 2 | ✅ | REQ-302, DD-023; the piece generator inks core outlines with the ground's inker at build time |
| 3 | ✅ with A-01 | REQ-327, REQ-328, DD-027 |
| 4 | ✅ | REQ-307, REQ-329, I-21; no inking or measurement at render |
| 5 | ✅ with A-01 | REQ-314..REQ-320 |
| 6 | ✅ with A-01 | REQ-308, REQ-309, DD-026, I-18 |
| 7 | ✅ | REQ-312, Data Model §3.8 |
| 8 | ✅ | REQ-303, REQ-330, `ui.css` opt-in (REQ-301) |
| 9 | ✅ | Deltas in `changes/`, REQ per task, fold in T-162 |

## Dispositions

_None yet — awaiting the user._
