# Analyze — feature-002 UI components, before implementation

> Read-only cross-artifact pass over [`prd-delta.md`](prd-delta.md), [`api-delta.md`](api-delta.md),
> [`technical-design-delta.md`](technical-design-delta.md), [`data-model-delta.md`](data-model-delta.md),
> [`plan-and-tasks.md`](plan-and-tasks.md) and [`constitution-amendment.md`](constitution-amendment.md),
> against the Constitution v1.6 and `specs/` as they stand. Run 2026-09-26 on the drafts. The user
> decides what is fixed before `implement`.

## Coverage

- **35 requirements** (33 MUST, 2 SHOULD; REQ-334 added on 2026-09-28 by C-1). Every requirement maps to at least one task
  (plan-and-tasks §Traceability); every task cites at least one REQ; no orphan task.
- Every API element traces to a REQ: subpaths and names → 300; `ui.css` → 301; core functions →
  302, 307, 315, 319, 324, 325; markup contract → 314, 318, 327; value binding → 322, 323; CSS
  properties → 316, 317; `SP017`/`SP018`/`SP019` → 324/319/325; budgets → 330.
- Every value and token in the API is in the Data Model with domain, default and invalid-value
  behaviour (§2.14, §3.8).
- Identifier ranges do not collide: REQ-300..334 (the PRD ends at REQ-222), DD-021..027 (TD ends at
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

## Concept review — the visual concept against the deltas (2026-09-28)

The user attached the concept drawing for `0.3.0` ([`concept.png`](concept.png)). It matches the
catalog, the exact marks, the heightening of the current item, `precision` with identical boxes
(I-17) and `cyanotype` by line weight. Seven points differed from, or were silent in, the drafts:

| # | The concept shows | The drafts said | Resolution |
|---|---|---|---|
| C-1 | An invalid Input with a ⚠ glyph and the text "Required: pick a city" | `invalid?: boolean` only, no message | `message?` on Input, `aria-describedby` → `${id}--message`, `aria-invalid`; new REQ-334 |
| C-2 | Rate as lozenges | DD-025 named a star glyph | Rate marks are exact lozenges |
| C-3 | An `error` Alert with its whole box hatched | DD-026 gave Alert kinds no tone; the text-on-tone contrast pair covered level 3 only | `ui.tone.alertError` = level 1; text on it joins the contrast gate |
| C-4 | The Steps connector still to be walked is dashed | The markup contract gave the connector no status | `data-status` on `sp-connector`; `wait` is dashed, exact |
| C-5 | A Card holding a KPI and a Sparkline | Card has `title`, `extra`, `footer` | The UI page composes it so; Card fixtures hold text only, no chart |
| C-6 | "Delete" with a ✕, "Disabled" in italic | `Button.tone`, clashing with `Tag.tone` (A-07) | `Button.variant: UiVariant`; `tone` means a ramp level only |
| C-7 | `precision` keeps the hatching; only the frame turns exact | Implicit in DD-022 | Stated in DD-022 and API §7.2: tone unchanged in `precision` |

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

Gates 0..4 approved by Ernesto Crespo on 2026-09-28 (Phase 0), with the rows below.

| # | Disposition |
|---|---|
| OQ-U1 | Decided 2026-09-28: `ui/` subpath of the existing adapter packages (DD-021) |
| OQ-U2 | Decided 2026-09-28: `Sp` prefix in the three adapters (`SpButton` in React, Vue and Angular); API §1 and PRD REQ-300 updated |
| OQ-U3 | Decided 2026-09-28: all 17 components in `0.3.0`; the batches of step 6c are review points |
| OQ-U4 | Decided 2026-09-28: Angular `SpButton` and `SpInput` as attribute components (DD-024) |
| A-01 | Accepted: the Constitution amendment v1.7 is approved with gate 1, folded in T-162 |
| A-02 | Accepted: the batches stay; each closes with its gates and a review, and all ship in `0.3.0` (OQ-U3) |
| A-03 | Applied now rather than on folding: API §7 (10.3) states that parity holds for the markup the library emits |
| A-04 | Applied: REQ-313 cites Data Model §3.8 as the normative list of pairs |
| A-05 | Accepted: Chromium-only pixel gates, Firefox and WebKit by e2e presence checks (PRD §9 risks) |
| A-06 | Applied now: API §2 documents the silent unknown-key fallback beside the `SP017` range rule |
| A-07 | Applied as C-6: `Button.variant`; `tone` means only a ramp level |
| A-08 | Closed: OQ-U1..U4 decided above |
| A-09 | Accepted: T-160 extends the props generator of `docs/site` to the `ui/` subpaths |
| C-1 | Applied: REQ-334; API Input props and markup; Data Model §2.14; fixture state "invalid with `message`"; T-144..T-146 |
| C-2 | Applied: API Rate props and markup; TD DD-025 and DD-026 |
| C-3 | Applied: Data Model §3.8 `ui.tone.alertError` and its contrast pair; TD DD-026; API Alert markup; T-142, T-150..T-152 |
| C-4 | Applied: API Steps markup (`data-status`); TD DD-026 |
| C-5 | Applied: Data Model §4 and §5 (Card fixtures without charts); T-157 |
| C-6 | Applied: API `UiVariant` and Button props; TD DD-026 |
| C-7 | Applied: TD DD-022; API §7.2 note on `ink` and `precision` |

**Blocking after the dispositions:** none.
