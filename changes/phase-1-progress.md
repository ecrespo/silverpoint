# Phase 1 — execution ledger

Tasks: `changes/phase-1-tasks.md` (T-030..T-047). Every task test-first; tests cite REQs.

| Task | State | Commit | Evidence |
|---|---|---|---|
| T-030 | done | 1a3e6f3 | line-chart snapshot + 8 canonicals unchanged; box hit-area tests |
| T-031 | done | a71a10b | `packages/core/test/prng-dates.test.ts`, frozen mulberry32 sequence |
| T-032..T-037 | done | (this commit) | `catalog-contract.test.ts` (12 contract tests × 6 charts + demo snapshots, RED 72/72 on stubs) and `catalog-charts.test.ts` (27 per-chart tests, RED 26/26 on stubs); snapshot mutation-checked; core 184 + 6 snapshots green |
| T-047 (part) | done | (this commit) | the six charts appended to `grounds/test/equivalence.test.ts`: 30/30 |

## Rulings

- **Phase 1 · Ruling:** `precision` draws no hatching, so every tone-encoding chart carries its
  value through a second, non-hatch channel (label, length or size) — REQ-124 by construction.
- **T-032..T-037 · Ruling:** demo datasets use the Data Model §2 default field names, so the demo
  keys are the defaults; consumer `*Key` props are ignored while the demo is shown, as in the line
  chart — cost if wrong: one mapping table per chart.
- **T-035 · Ruling:** the treemap grid defaults to 6 × 4 (the spec names `columns`/`rows` without a
  default); `cols`, `rows` and `tone` are fixed field names, as Data Model §2.5 declares them, not
  accessors; `share` is printed as a percentage — cost if wrong: a default change, which alters demo
  output (never a patch).
- **T-033 · T-035 · Ruling:** without a consumer tone, a pyramid tier and a treemap tile are toned
  by their own value (quantised width or share), which they already print; a consumer-supplied tone
  is information of its own, so it is printed as `tone N` as well as hatched (REQ-124) — cost if
  wrong: one label per item.
- **T-034 · Ruling:** heatmap tone levels quantise `value / scaleMax` into none (≤ 0) and quarters;
  hit areas use series `#1..#n` per column, so the keyboard walks a column; T-045 may widen that —
  cost if wrong: a change to `stepActive`.
- **T-036 · Ruling:** REQ-097 flow total = the outflow of the nodes with no inflow, stated in the
  description; flows that are non-positive or would close a cycle are dropped in data order with
  SP002 — cost if wrong: a different flow is dropped in a cyclic dataset.
- **T-037 · Ruling:** the demo is generated once at module load (seed 1592, 182 days ending
  2026-06-30) and frozen, so the `seed` prop keeps driving the inking only; `seed: null` (Data
  Model §4) is not honoured, because Art. 4 forbids `Math.random` on the render path. Consumer
  rows are sorted by date; a partial week is trimmed from the oldest end, then the last `weeks`
  are kept; cells are laid out by position (column = index ÷ 7), not by weekday — cost if wrong:
  the grid shifts by the first day's weekday.
- **T-032..T-037 · Ruling:** every "drawn anyway / clamped / dropped" case is warned with SP002
  and a specific message; the SP002 template still reads as the line chart's null-value text — a
  wording fix to the template is left for the review — cost if wrong: a misleading hint.
