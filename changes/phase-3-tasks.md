# Tasks — Phase 3, arc engine and own geometry

> Source specs: [PRD](../specs/prd.md) v1.7 §6.4, NFR "Data volume" · [API Spec](../specs/api-spec.md) v1.5
> §7, §8.4, §11, §12 · [Data Model](../specs/data-model.md) v1.3 §2.2, §2.3, §2.7, §2.10 ·
> [Technical Design](../specs/technical-design.md) v1.4 DD-005, §5 (`core/geometry/polar`, `ribbon`,
> `orbit`) · [Implementation Plan](../specs/implementation-plan.md) v1.3, Phase 3.
> Generated: 2026-09-24, as Phase 2 closed. `specs/` is read-only in this checkout, so the phase's
> tasks live here. Task ids continue the global sequence from T-071.

**Goal.** The 12 polar charts: ten on one arc engine, and the chord ring and armillary orbits on
geometry of their own, in all three adapters.

**Done criteria (Implementation Plan, Phase 3)**
- All 12 with fixtures.
- The 60-sector ceiling (`SP008`) and the chord ring's 12-category ceiling (`SP010`).
- Wind rose exercised with real directional data, not synthetic.
- Each chart reviewed against REQ-124.

**Carried from Phases 0-2.** A chart is a catalog row (`tools/visual-gate/catalog.ts`); adapters,
fixtures, the string and pixel gates, subpaths, tree-shaking, budgets and the benchmark iterate
the catalog. Every tone is backed by a non-hatch channel (REQ-124); `precision` draws no
hatching. Recipe `name`s are string literals (T-066 ruling). Coordinates carry 2 decimals.

**The 12 charts** (API Spec §7 own props):

| REQ | Chart | Own props | Data | Encoding |
|---|---|---|---|---|
| REQ-075 | `DonutChart` | `nameKey`, `valueKey`, `centerValue?`, `centerLabel?`, `legend` | §2.2 | ring sectors ∝ value, central readout |
| REQ-076 | `RadarChart` | `subjectKey`, `valueKey`, `domain` | §2.2 | polygon over one spoke per subject |
| REQ-077 | `PolarBarChart` | `nameKey`, `valueKey` | §2.2 | 360° bars, radius ∝ value |
| REQ-078 | `RadialArcGroup` | `nameKey`, `valueKey` | §2.2 | concentric 180° arcs, sweep ∝ value |
| REQ-079 | `RadialRings` | `nameKey`, `valueKey` | §2.2 | concentric progress rings, sweep ∝ value |
| REQ-080 | `GaugeArc` | `percent`, `caption?`, `readout?` | §2.3 | 240° arc, sweep ∝ percent |
| REQ-081 | `MeterChart` | `percent`, `caption?`, `readout?` | §2.3 | 180° meter with a needle |
| REQ-088 | `CoxcombChart` | `nameKey`, `valueKey`, `startAngle` | §2.2 | equal angles, **area** ∝ value |
| REQ-089 | `WindRose` | `bearingKey`, `valueKey`, `sectors`, `bins` | §2.2 (binned) | frequency per bearing sector, stacked by speed bin |
| REQ-090 | `VolvelleChart` (SHOULD) | `rings`, `indexRing`, `indexValue` | delta-009 | concentric categorical rings + index |
| REQ-091 | `ChordRing` | `sourceKey`, `targetKey`, `valueKey`, `maxCategories` | §2.7 | ribbons over `d3-chord` (DD-005) |
| REQ-092 | `OrbitChart` | `orbits`, `periodKey`, `markerKey` | §2.10 | nested elliptical orbits with markers |

## Tasks

### Shared engine

**[ ] T-071 · Polar frame**
- **What**: `charts/shared/polar.ts` — centre and outer radius inside the card area, an angle
  scale (start angle, sweep, clockwise from 12 o'clock), sector series reading (§2.2: `value ≥ 0`,
  negatives and non-finite warned `SP002` and dropped, names made unique), arc and sector paths
  over `d3-shape` rounded to 2 decimals, and label placement on a circle with anchors by quadrant.
- **REQ**: REQ-075..081, REQ-088, REQ-089, REQ-008, REQ-010
- **Done**: unit tests of angles, paths (closed, 2-decimal), label anchors and §2.2 reading.

**[ ] T-072 · Sector ceiling** `[P]`
- **What**: a polar series above 60 sectors warns `SP008` once and is drawn in full.
- **REQ**: REQ-096 · API Spec §12
- **Done**: `SP008` from 61 sectors in every sector recipe, not from 60 (contract test).

### Recipes — arc engine

**[ ] T-073 · `DonutChart`** — sectors ∝ value, a central readout (`centerValue`, else the total;
`centerLabel`), `legend` names every sector with its share. REQ-075, REQ-093.

**[ ] T-074 · `RadarChart`** `[P]` — one spoke per subject, value on a linear radius over
`domain` (default `[0, max]`), rings as ornament, the polygon closed. REQ-076.

**[ ] T-075 · `PolarBarChart`** `[P]` — equal angular slots, radius ∝ value from an inner hole.
REQ-077.

**[ ] T-076 · `RadialArcGroup`** `[P]` — one 180° track per item, concentric, sweep ∝ value / max.
REQ-078.

**[ ] T-077 · `RadialRings`** `[P]` — one full ring per item, sweep ∝ value in 0-100 (progress),
saturated and warned out of range. REQ-079.

**[ ] T-078 · `GaugeArc` and `MeterChart`** `[P]` — §2.3 scalar percent, saturated and warned
`SP002` outside 0-100; the gauge sweeps 240°, the meter 180° with a needle; readout printed.
REQ-080, REQ-081.

**[ ] T-079 · `CoxcombChart`** `[P]` — equal angles from `startAngle`; the **area** of each sector
is proportional to the value (radius ∝ √value), as Nightingale drew it. REQ-088.

**[ ] T-080 · `WindRose`** — rows of (bearing°, speed) binned into `sectors` (8 or 16, bearings
labelled N, NE…) and speed `bins` (thresholds); each sector's length is the share of
observations, stacked by bin. The demo is a **real, cited record** (Done criterion), never a
synthetic one. REQ-089.

**[ ] T-081 · `VolvelleChart`** (SHOULD) — concentric categorical rings; the index on
`indexRing` at `indexValue` aligns the other rings and prints the combined readout. Its data
shape is not in the Data Model: settled by `changes/delta-009-volvelle-rings.md` first (Art. 9).
First candidate to drop if the phase overruns (specs/tasks.md). REQ-090.

### Own geometry

**[ ] T-082 · `ChordRing`** — `{source, target, value}` rows (§2.7) → a square matrix of unique
categories in `core`; above `maxCategories` (12) `SP010` before calling `d3-chord` (DD-005);
group arcs + ribbons; `d3-chord` added to `@silverpoint/core`'s dependencies (already in the
allowlist). REQ-091.

**[ ] T-083 · `OrbitChart`** — §2.10: concentric elliptical orbits from the inside out, markers
positioned **along the path** at `period` (0-1) with a size or label for `value`. REQ-092.

### Integration

**[ ] T-084 · Adapters** — React (client + server), Vue, Angular for the 12, from the catalog.
REQ-100, REQ-107, REQ-108.

**[ ] T-085 · Fixtures and string gate** — catalog rows, canonicals for 33 charts, 792 string-gate
comparisons. REQ-182, REQ-180.

**[ ] T-086 · Example apps, gallery and pixel goldens** — REQ-181.

**[ ] T-087 · Keyboard, tables and axe-core over all 33** — REQ-120, REQ-121, REQ-122.

**[ ] T-088 · REQ-124 review of the 12 charts** — a channel table per chart and a precision-mode
test each. REQ-124, REQ-006.

**[ ] T-089 · Equivalence, budgets, tree-shaking, benchmark, traceability** — the 12 in the
grounds equivalence suite, per-chart budgets, the benchmark datasets (60 sectors), traceability.
REQ-006, REQ-164, REQ-183.

## Out of Phase 3

The WCAG audit across all apps, the catalog-wide REQ-124 pass, the documentation site, the full
1,584-fixture nightly matrix and publishing `1.0.0` are Phase 4.
