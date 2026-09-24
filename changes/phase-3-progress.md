# Phase 3 — execution ledger

Tasks: `changes/phase-3-tasks.md` (T-071..T-089). Every task test-first; tests cite REQs.
Base: `cab2510` (Phase 2 closed at `f9065da`).

| Task | State | Commit | Evidence |
|---|---|---|---|
| T-071 | done | 03aa704 | `charts/shared/polar.ts` — frame, `pointAt`, `sectorPath`/`arcPath` (exact SVG arcs; a full turn as two halves), `polarLabel`, `readSectors` (§2.2), `checkSectors`; `test/polar.test.ts` RED on the missing module → 13/13; the locale test was written with its fix and mutation-checked (`'en'` → red) |
| T-072 (part) | done | 03aa704 | `checkSectors` + `SECTORS_PER_CHART = 60` unit-tested (60 silent, 61 → SP008); the contract over every sector recipe comes with the recipes |
| T-073 | done | (this commit) | `DonutChart`: contract cases (`POLAR`, 13 tests) + sector-volume contract (61 → SP008) + 15 specific tests RED on the missing recipe → green; `ringTone` (no two neighbours share a tone, across 12 o'clock) and `sectorLegend` ("+N more") mutation-checked; one test's expected angles were wrong (Rent 50 % spans 0-π) and were corrected, not the code |

## Rulings

- **T-071 · Ruling:** sector and arc paths are written by hand from SVG arc commands rather than
  through `d3-shape`'s `arc()`: `arc()` draws around the origin and would need a transform, and
  the hand-written path is exact, short and rounds with the rest of the geometry (Art. 1). The
  Technical Design names `d3-shape` for the polar module but fixes no signature — cost if wrong:
  one module to swap behind the same functions.
- **T-071 · Ruling:** a repeated sector name is kept and made unique as "name (2)" with `SP002`,
  rather than dropped: Data Model §2.2 asks for unique names but names no remedy, and dropping a
  row would lose data silently — cost if wrong: a renamed sector the consumer did not expect.
- **T-073 · Ruling:** the donut's legend sits beside the ring only when the area is at least 1.5×
  wider than tall; in a squarer area it is left out even with `legend: true`, and the table,
  readout and printed centre carry the data — cost if wrong: a narrow donut without names on paper.
- **T-073 · Ruling:** sectors run clockwise from 12 o'clock with no gap between them; the outline
  separates them — cost if wrong: a style change to the demo output.
