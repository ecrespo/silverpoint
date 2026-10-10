# Constitution amendment — v1.7 → v1.8 (stack constraints only)

| Field | Value |
|---|---|
| **Status** | `APPROVED` — with gate 1, 2026-10-09; folded into `specs/constitution.md` (v1.8) on 2026-10-10 (T-199) |
| **Articles touched** | None. Only the **Stack constraints** table and the "What silverpoint is" paragraph's catalog wording |

## 1. Why

The Stack constraints row reads *"Geometry engine — `d3-scale` + `d3-shape` (only the subset
used)"*. It has been incomplete since DD-005 added `d3-chord` (0.1). feature-003 adds no dependency
—its algorithms are owned by the core (DD-028)— but it adds a rule worth stating at the
constitutional level: derived geometry uses only correctly rounded arithmetic. A constitution that
lists dependencies goes stale at every allowlist change; the Technical Design's §5.3 is the place that is kept exact
and gated by REQ-162.

## 2. Change

| Area | Today | Proposed |
|---|---|---|
| Geometry engine | `d3-scale` + `d3-shape` (only the subset used) | DOM-free d3 modules, only the subset used, each listed in the Technical Design's runtime allowlist (§5.3); statistics and layouts are owned by the core. Iterative or summed geometry uses only correctly rounded arithmetic (REQ-435) |

No article changes: Art. 1–9 already bind the new charts as written (see the PRD delta's
constitution check). Art. 8's "allowlist pinned in the Technical Design" is what the new row
points to.

## 3. Amendments table — row to add

| Date | Article | Change | Reason | Approved by |
|---|---|---|---|---|
| 2026-10-09 | — | Stack: the geometry engine row points to the TD allowlist instead of naming modules, and records the correctly-rounded-arithmetic rule for derived geometry | The row was stale since `d3-chord`; feature-003 owns its statistics and layouts and needs the arithmetic rule | Ernesto Crespo |
