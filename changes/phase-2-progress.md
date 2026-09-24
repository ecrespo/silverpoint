# Phase 2 — execution ledger

Tasks: `changes/phase-2-tasks.md` (T-048..T-070). Every task test-first; tests cite REQs.

| Task | State | Commit | Evidence |
|---|---|---|---|
| T-048 | done | (this commit) | `charts/shared/cartesian.ts` (plot, value axis, category axis and labels, series reading); line chart moved onto it under unchanged tests: core 215/215, 8 canonicals unchanged |
| T-049 | done | (this commit) | `checkVolume` + `test/cartesian.test.ts` (RED 501 points → GREEN); every Phase 2 recipe calls it, and the contract test will cover all |

## Rulings

- **Phase 2 · Ruling:** the spec gives each chart's name, family and own props only (API Spec §7);
  the geometry of each is decided here, one ruling per chart, against the constitution and the
  REQ-124 second-channel rule carried from Phase 1.
