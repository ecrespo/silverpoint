# Phase 3 — execution ledger

Tasks: `changes/phase-3-tasks.md` (T-071..T-089). Every task test-first; tests cite REQs.
Base: `cab2510` (Phase 2 closed at `f9065da`).

| Task | State | Commit | Evidence |
|---|---|---|---|
| T-071 | done | 03aa704 | `charts/shared/polar.ts` — frame, `pointAt`, `sectorPath`/`arcPath` (exact SVG arcs; a full turn as two halves), `polarLabel`, `readSectors` (§2.2), `checkSectors`; `test/polar.test.ts` RED on the missing module → 13/13; the locale test was written with its fix and mutation-checked (`'en'` → red) |
| T-072 (part) | done | 03aa704 | `checkSectors` + `SECTORS_PER_CHART = 60` unit-tested (60 silent, 61 → SP008); the contract over every sector recipe comes with the recipes |
| T-073 | done | 51321d8 | `DonutChart`: contract cases (`POLAR`, 13 tests) + sector-volume contract (61 → SP008) + 15 specific tests RED on the missing recipe → green; `ringTone` (no two neighbours share a tone, across 12 o'clock) and `sectorLegend` ("+N more") mutation-checked; one test's expected angles were wrong (Rent 50 % spans 0-π) and were corrected, not the code |
| T-074, T-075, T-079 | done | 70cc7b4 | `RadarChart`, `PolarBarChart`, `CoxcombChart`: 3 contract cases (39 tests) + 3 sector-volume contracts + 10 specific tests RED on the missing recipes → green (core 620/620); two tests corrected before any code ran (a radial bar's length is not an axis-aligned box's height; the coxcomb has no `legend`) |
| T-076, T-077, T-078 | done | 23861e9 | `RadialArcGroup`, `RadialRings` (shared `tracks.ts`), `GaugeArc`, `MeterChart` (shared `scalar.ts`, own 9-test scalar contract — a meter has no rows): 2 contract cases + 2 sector-volume contracts + 18 scalar-contract tests + 7 specific tests RED on the missing recipes → green; three tests rewritten before any code ran (two tautologies, one "sweep > 0") to check the exact end angle from the guide track. A first **preview render** (Chromium, real stylesheet and fonts) showed two defects the geometry tests missed: the radar's outer ring value over the 12 o'clock name and the meter's readout under its needle — each got a RED test (label boxes; readout clearance, tightened once the preview showed the % sign's ascent) and a fix; core 681/681 |
| T-080 | done | 5c6f58e | `WindRose` on a **real record**: 742 hourly METAR reports, ASOS station DSM (Des Moines, Iowa), March 2024, from the Iowa Environmental Mesonet archive, cited in `demo.ts` (2 reports with a missing value left out). Contract case (13 tests) + 7 specific tests RED on the missing recipe → green; the preview showed the outer ring's "15%" over "NNE" — the radar's overlap test was generalised to both charts (RED on the wind rose) and fixed; core 704/704 |
| T-082 | done | 6968426 | `ChordRing`: `d3-chord` ^3.0.1 (+ `@types/d3-chord`) added to `@silverpoint/core` only (DD-005; already in the allowlist). Contract case (13 tests) + 6 specific tests RED on the missing recipe → green after one behaviour change (ribbons drawn in row order, which the test assumed); the existing REQ-007 production-strip test caught an unguarded `SP010` → guarded; the preview showed outline-only ribbons reading as strands → hatched in the source's tone; core 725/725, `pnpm lint` 0 errors |
| T-083 | done | f5bf6d9 | `OrbitChart` per `changes/delta-009-orbit-props.md` (PROPOSED: how `orbits`, `markerKey`, `periodKey` read Data Model §2.10). Contract case (13 tests) + 7 specific tests RED on the missing recipe → green; the case first landed in the cartesian list (an insertion anchor matched twice) and drew the 500-point contract — moved; preview looked at; core 747/747 |
| T-081 | done | 111cb55 | `VolvelleChart` (the phase's one SHOULD) per `changes/delta-010-volvelle-shape.md` (PROPOSED: rings as `{label, segments}`, one shared angle frame, the index at the middle of `indexValue` on `indexRing`, the combined readout). Contract case (13 tests) + 7 specific tests RED on the missing recipe → green. Two preview rounds: names overflowing their rings → a containment test (RED on "Borealis", then "Early") and a `fits()` check of radial and angular room, mutation-checked; with that, the outer rings went unnamed at 150 px → the outermost ring is named at the rim (RED → green); the containment test moved to a 640×320 render so it is never vacuous; core 769/769 |
| T-084 | done | 0cc3dfb | 12 catalog rows turned the adapter suites RED (231 failures in React + Vue) → React client + server, Vue SFCs (the donut's boolean `legend` with `withDefaults(…, undefined)`, per the T-065 ruling), Angular secondary entries, all registered (package exports, tsup entries, index exports, `tsconfig.lib.json`); 963/963 across the three adapters; `pnpm -r typecheck`, `pnpm lint`, build clean |
| T-085 | done | (this commit) | fixture test RED (catalog pinned at 33) → CARDS + renderers for the 12 → canonicals for 264 fixtures (the 21 earlier charts' unchanged); tools 288/288; gates: string gate over 33 charts × 8 × 3 adapters, subpaths and tree-shaking green |
| Demo leak (Phase 1 defect) | done | (this commit) | checking the new wind demo in other bundles showed **every** chart's demo in **every** one-chart bundle since Phase 1: the `@__PURE__` on `Object.freeze(…)` dropped the call but kept its argument `[…].map(…)`, which the bundler cannot prove pure — the gate only looked for recipe names. RED: a demo check in the tree-shaking gate (132/132 red) → `/* @__PURE__ */` on the inner call of all 31 demos → green; the check was then made generic (each chart's demo words that no other demo uses, split from its table and labels, plus field names for numeric demos) and mutation-checked (the donut's annotation removed → 128 bundles red). Heaviest one-chart bundle 35.1 → 31.2 kB |
| T-089 (budgets) | done | (this commit) | the per-chart budget coverage test RED on the 12 (48 paths) → 48 `.size-limit.json` entries at 45 kB; the catalog-wide core alarm 40 → 45 kB (measured 42.1 kB with the catalog complete) |
| Gate race | done | (this commit) | a full run failed `check-deps` once: the gates' resolution test rewrites the real `packages/grounds/package.json` to prove the stylesheet check while the tools project reads it in parallel (a Phase 0 race). The gates project now runs after the unit projects (`sequence.groupOrder: 1`); full run 2477/2477 |

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
- **T-074 · Ruling:** a radar value outside `domain` is held at its edge and warned `SP002`, as
  the gauges saturate (Data Model §2.3); the table keeps the true value — cost if wrong: a polygon
  that understates an outlier on paper.
- **T-079 · Ruling:** `startAngle` is in degrees clockwise from 12 o'clock (API Spec §7 gives no
  unit; degrees are what a consumer writes) — cost if wrong: a unit change before 1.0.
- **T-075, T-079 · Ruling:** rim names are thinned to at most 24 so they never overprint; the table
  and readout name every slot — cost if wrong: a dense polar chart with unnamed slots on paper.
- **T-076..T-078 · Ruling:** the arc group and the rings share one tone; the tracks are told apart by
  order (outermost first, as the legend lists them) and by the value printed beside each name —
  the stacked-bar pattern, with the same limit on paper when the legend does not fit (a plot
  narrower than 220 px) — cost if wrong: a narrow card whose tracks are unnamed on paper.
- **T-078 · Ruling:** the meters take no rows (Data Model §2.3 `ScalarPercent`), so they get their
  own scalar contract instead of the row contract; `percent` omitted renders the demo value 72,
  a non-finite one draws the empty track with `SP002` and no item — cost if wrong: none.
- **T-076..T-078 · Ruling:** a preview render of each new chart in Chromium, before its fixtures
  exist, is part of the task: it found two overprints the geometry tests passed — cost if wrong:
  a few seconds per chart.
- **T-080 · Ruling:** a wind rose's item is a compass sector, not an observation: one hit and one
  table row per sector (share of all observations, then one column per speed bin), so the
  keyboard walks the compass and the table stays 4-32 rows for any volume of data — cost if wrong:
  no per-observation readout, which no wind rose offers.
- **T-080 · Ruling:** shares are of **all** observations, calms included, and the calm share is
  printed apart ("calm N%"): a calm has no bearing, the meteorological convention — cost if wrong:
  sector shares that do not sum to 100 %.
- **T-080 · Ruling:** `sectors` accepts 4, 8, 16 or 32 (compass points; degrees for 32), anything
  else warns `SP002` and draws 16; `bins` must be positive and ascending, else the defaults
  `[5, 10, 15, 20]` with `SP002`. The API Spec names both props but not their domains — cost if
  wrong: a domain to widen before 1.0.
- **T-080 · Ruling:** the demo is fetched once from a public archive and committed as data; the
  test suite never touches the network — cost if wrong: none.
- **T-082 · Ruling:** flows are directed (`chordDirected`): each row is its own ribbon, whose two
  ends span its value, and a category's arc is its throughput (sent + received). The spec's
  "flows between categories" (REQ-091) over `{source, target, value}` rows (Data Model §2.7, shared
  with the sankey) reads as directed — cost if wrong: an undirected mode to add.
- **T-082 · Ruling:** `SP010` is warned above the v1 ceiling of 12 categories and also whenever
  `maxCategories` forces a merge; past `maxCategories` the smallest categories by throughput merge
  into "Other" (the table keeps every row) — cost if wrong: a merge a consumer did not expect, but
  never silently.
- **T-082 · Ruling:** `d3-chord` allocates the angles; the ribbon path is written with the polar
  frame's exact arcs (the same quadratic-through-the-centre shape as d3's `ribbon()`), because
  `ribbon()` draws around the origin — cost if wrong: a path generator to swap.
- **T-083 · Ruling:** the orbits are ornament (they name a series, carry no value); a marker's place
  along its ellipse is its period and its **area** its value, filled ink; the ellipses are tilted
  (height 0.42 × width) for the armillary look — cost if wrong: a style change to the demo.
- **T-083 · Ruling:** no data-volume ceiling for the orbits: API Spec §12 names none for them, and
  their markers are not sectors — cost if wrong: a ceiling to add in Phase 4.
- **T-081 · Ruling:** a segment's name is printed inside its ring only when its whole box fits
  there; otherwise the outermost ring is named at the rim, the segment under the index is named by
  the readout, and inner segments rely on the table and the keyboard readout. Rotated text would
  fit more, but TextLabel has no rotation and adding one reaches every adapter — cost if wrong:
  inner-ring names missing on paper in small volvelles.
- **Demo leak · Ruling:** a demo dataset's inner call carries its own `/* @__PURE__ */`, and the
  tree-shaking gate detects any demo by its words, not only recipes by their names. The catalog-
  wide alarm is set at 45 kB now that the catalog is complete — cost if wrong: none; the per-chart
  budgets are the product's.
- **Gate race · Ruling:** the gates run as a later group instead of the manifest-mutating test being
  rewritten: the mutation of the real file is what that test proves — cost if wrong: a slower full
  run (the gates no longer overlap the unit projects).
