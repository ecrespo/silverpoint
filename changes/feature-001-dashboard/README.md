# feature-001 — Dashboard composition

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-25 ("Apruebo el cambio que mencionas, las 4 puertas del dashboard y el delta-011") — all four gates, the Art. 3 amendment and every Analyze finding. **Not implemented yet**; the first run is T-106..T-109 |
| **Target release** | `0.2.0` (changeset `minor` from 0.1.1) — OQ-D4, decided 2026-09-25; `1.0.0` stays parked |
| **Requirements** | REQ-200..REQ-221 (19 MUST, 3 SHOULD) |
| **Tasks** | T-106..T-123 (Phase 5) |

A declarative, server-renderable, accessible grid of silverpoint cards for React, Vue and Angular,
with its layout resolved in `@silverpoint/core`, and optional linked hover between charts. Not a
dashboard builder.

## Reading order and approval gates

Per Art. 9 and the SDD flow, each gate is approved before the next artifact is relied on.

| Gate | Artifact | Decides |
|---|---|---|
| 0 | [`research.md`](research.md) | What other libraries do, and what silverpoint takes or leaves |
| 1 | [`prd-delta.md`](prd-delta.md) | The what: scope change to PRD §5.2, REQ-200..221 |
| 2 | [`api-delta.md`](api-delta.md) | The contract: components, props, events, CSS, diagnostics, budgets |
| 3 | [`technical-design-delta.md`](technical-design-delta.md) + [`data-model-delta.md`](data-model-delta.md) | The how: DD-013..018, layout rules, fixtures, invariants |
| 4 | [`plan-and-tasks.md`](plan-and-tasks.md) | Phase 5 steps and tasks; first run T-106..T-109 |
| — | [`analyze.md`](analyze.md) | Cross-check; 0 blocking; every finding dispositioned 2026-09-25 |
| — | [`constitution-amendment.md`](constitution-amendment.md) | Art. 3 → v1.5, approved and folded 2026-09-25 |

The deltas were folded into `specs/` on 2026-09-25 (PRD v1.8, API v1.6, TD v1.5, DM v1.4,
Implementation Plan v1.4, Constitution v1.5); REQ-200..REQ-221 are deferred to Phase 5 in
`specs/tasks.md`. These files remain as the record of the proposal and its research.

## Related

- [`../delta-011-volvelle-demo-index.md`](../delta-011-volvelle-demo-index.md) — independent; its
  REQ-098/099 rule ("view props apply to the demo") also governs the charts inside a dashboard's
  reference layouts, which all render demo data.
