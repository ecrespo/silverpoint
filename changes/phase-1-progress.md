# Phase 1 — execution ledger

Tasks: `changes/phase-1-tasks.md` (T-030..T-047). Every task test-first; tests cite REQs.

| Task | State | Commit | Evidence |
|---|---|---|---|
| T-030 | done | 1a3e6f3 | line-chart snapshot + 8 canonicals unchanged; box hit-area tests |
| T-031 | done | a71a10b | `packages/core/test/prng-dates.test.ts`, frozen mulberry32 sequence |
| T-032..T-037 | done | 3e3be49 | `catalog-contract.test.ts` (12 contract tests × 6 charts + demo snapshots, RED 72/72 on stubs) and `catalog-charts.test.ts` (27 per-chart tests, RED 26/26 on stubs); snapshot mutation-checked; core 184 + 6 snapshots green |
| T-047 (part) | done | 3e3be49 | the six charts appended to `grounds/test/equivalence.test.ts`: 30/30 |
| T-038 | done | d919973 | refactor under unchanged tests: react 32/32, vue 30/30, angular 34/34, string gate 24/24; `pnpm -r run typecheck` green |
| T-039..T-041 | done | 7a0caff | `react/test/catalog.test.tsx` (RED 67/67 → 67 green), `vue/test/catalog.test.ts` + `types.test.ts` (RED 50 → green), `angular/test/catalog.test.ts` (RED 48/48 → green); SSR/server parity against the canonical render for demo ink/precision, consumer data and bare; subpaths; keyboard; Angular contract (standalone, OnPush, signal inputs = props interface) |
| T-047 (part) | done | 7a0caff | per-chart budgets, 24 entries at 45 kB: React client 17–28 kB; new gate `tools/resolution-check/tree-shaking.real.test.ts` (RED 28/28 → 28/28) |
| T-042 | done | 031d906 | 48 new fixtures (RED 7 count tests → 29/29), canonicals committed, line-chart canonicals unchanged; string gate 168/168 (CLI and `gates` project); subpaths gate parameterized over the catalog (28/28, mutation-checked by removing a Vue export) |
| T-043 | done | 5538691, e2d4a0d | every app renders any fixture's chart (e2e RED 24 → green, strengthened to compare against the chart's canonical render after a vacuous first pass); 48 goldens generated in the pinned image; pixel gate 232/232 in docker; REQ-029 tile-fill e2e (RED `none` → `url(…)`) |
| T-044 | done | cc70733 | `measureChart` (RED 19 → 25/25); `reports/path-weight.md`: tile ≤ 12.3 KiB for all six at every size; per-shape over 40 KB only for heatmap and activity grid at `lg` — budget confirmed |
| T-045 | done | (this commit) | `?gallery` page of all seven charts in the four apps; axe-core A/AA clean on it (RED: no gallery → green); per chart, e2e table rows and keyboard announcements computed from the core's own `readout` — written after the adapters, mutation-checked (React keydown disabled → 6/6 keyboard tests red); apps + a11y 134 passed |
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
- **T-038 · Ruling:** React `createClientChart`/`createServerChart`, Vue `ChartShell.vue` (each `Sp*`
  SFC keeps its own `defineProps<XProps>()` and re-emits), Angular abstract `SpChart` `@Directive`
  taking the recipe in its constructor. The Angular "no other public method" test now walks the
  class chain, since the methods live on the base — its assertion is unchanged.
- **T-038 · Ruling (Phase 0 gap):** CI ran no typecheck, and two were broken — the Vue types test
  cast (TS2352) and Angular's `typecheck` script (`inlineSources` without source maps; the secondary
  entry's self-import unresolved). Fixed with `tsconfig.typecheck.json` (path to `src/public-api.ts`,
  run by `ngc`, so templates are checked) and a `pnpm -r run typecheck` CI step — cost if wrong: none.
- **T-038 · Ruling:** the "core (everything)" budget rises 20 → 30 kB and "grounds + core
  (everything)" 30 → 40 kB, because they grow with the catalog by design; the PRD's product budget
  is per chart (< 45 KB React + core with one chart), which T-047 adds for each new chart — cost if
  wrong: a looser catalog-wide alarm.
- **T-039..T-041 · Ruling:** a shared `tools/visual-gate/catalog.ts` names every chart's recipe,
  slug, REQ, props interface and a consumer sample with non-default keys; adapter tests, and next
  the fixtures, iterate it — adding a chart is adding a row. Subpaths: React `./<slug>` and
  `./server/<slug>`, Vue `./<slug>`, Angular secondary entry `<slug>/`; the vitest alias now maps
  every `@silverpoint/angular/<slug>`.
- **T-047 · Ruling (found while budgeting):** every one-chart bundle carried every recipe and demo,
  because module-level `Object.freeze(...)` calls count as side effects for a bundler. They are now
  `/* @__PURE__ */`, and a gate bundles each published one-chart entry with rolldown and fails if
  another recipe is in it. The line chart's React bundle drops 31.95 → 27.98 kB — cost if wrong:
  none; a future module-level call without the annotation is caught by the gate.
- **T-042 · Ruling:** the Phase 1 fixtures use each chart's demo dataset (`data: null`) inside a
  card chosen per chart in `canonical.ts`; consumer data is covered by the adapter tests' catalog
  samples instead — cost if wrong: the gate compares demo layouts only.
- **T-043 · Ruling (Phase 0 defect found by looking at the goldens):** `.sp-chart path { fill: none }`
  overrode every `fill="url(#…)"`, so tile hatching never showed — in the canonical page as much as
  in the adapters, which is why no gate saw it. The reset now skips `[data-paint='tile']` inside
  `:where()` (specificity unchanged); an e2e test asserts the computed fill is the pattern. Line-
  chart goldens are unaffected (no tiles) — cost if wrong: none.
- **T-043 · Ruling:** the activity grid's month labels keep three columns apart; a leading partial
  month gives way to the next (the demo starts on 31 December) — cost if wrong: one label.
- **T-043 · minor (deferred):** hatching runs under the printed values of heatmap cells and treemap
  tiles; a substrate-coloured text halo (`paint-order: stroke`) would lift them, but restyles every
  chart's text and every golden — a Phase 4 typography pass.
- **T-043 · minor (deferred):** sankey labels of middle-layer nodes sit over the outgoing bands.
- **T-043 · Ruling (process):** 5538691 was committed with three failing unit tests (the
  string-gate unit test drew fixtures as line charts); fixed in e2d4a0d. Verification now runs as
  its own step, and a commit follows only a read exit status of 0.
