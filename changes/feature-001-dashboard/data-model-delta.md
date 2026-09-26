# Data Model delta — Dashboard composition

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-25 ("Apruebo el cambio que mencionas, las 4 puertas del dashboard y el delta-011") — gate 3, with the Technical Design delta; **folded into `specs/data-model.md` (v1.4) on 2026-09-25** |
| **Amends** | [Data Model](../../specs/data-model.md) v1.3 → v1.4: new §2.13, §4, §5, §6 |

## §2.13 `DashboardLayout` — the layout contract

The type is in [`api-delta.md`](api-delta.md) §2. Its rules:

| Field | Domain | Default | Invalid value |
|---|---|---|---|
| `columns[bp]` | integer 1..12 | `sm 1, md 2, lg 4` | Non-integer or out of range → the default for that breakpoint, `SP002` |
| `rowHeight` | number > 0 | `240` | → default, `SP002` |
| `gap` | number ≥ 0 | `16` | → default, `SP002` |
| `cells[].id` | non-empty string, unique | — | Duplicate → the later ones are unplaced, `SP015` |
| `colSpan[bp]` | integer ≥ 1 | `1` | > `columns[bp]` → clamped, `SP014`; < 1 or non-integer → `1`, `SP002` |
| `rowSpan[bp]` | integer 1..6 | `1` | → clamped to range, `SP002` |

A bare number in `colSpan` / `rowSpan` / `columns` applies to all three breakpoints.

**Matching children to cells** (REQ-205), in order:

1. Children with a `cell` id found in `layout.cells` take that cell's spans.
2. The reading order is the order of `layout.cells`; children whose cell is placed follow it.
3. Children with no `cell`, or an unknown one, are appended in source order with span 1 (`SP015`
   for an unknown id).
4. Layout cells with no child are dropped (`SP015`); they leave no hole.

**Chart ids** (REQ-209): `${dashboard.id}--${cell.id}`; for an unplaced child,
`${dashboard.id}--${index}` with its source index. The existing id sanitiser (T-090) applies.

## §4 Demo — reference dashboards

Frozen, like every demo dataset, and used by the fixtures, the example apps and the docs site.

| Name | Cells | Purpose |
|---|---|---|
| `kpi-strip` | 4 × `KpiCard` + 1 `LineChart` spanning `lg 4 / md 2` | The most common shape: a strip of numbers over a trend |
| `ops` | 12 cards: 4 KPI, `LineChart` (col 3, row 2), `BarChart`, `HeatmapChart` (col 2), `DonutChart`, `SparklineRows`, `ActivityGrid` (col 2), `GaugeArc` | The DD-007 weight reference; linked on `hour` across line, bar and heatmap |
| `mixed-spans` | 7 cells with spans chosen to leave a row-end gap at `md` | Proves REQ-203: gap left, no reordering |

All charts render their demo data (REQ-093), so no dashboard fixture carries consumer data.

## §5 Fixture matrix — addition

| Axis | Values | Count |
|---|---|---|
| Dashboard | `kpi-strip`, `ops`, `mixed-spans` | 3 |
| Substrate | the four of the `silverpoint` ground | 4 |
| Mode | `ink`, `precision` | 2 |
| Breakpoint width | 375, 800, 1280 px | 3 |

**72 dashboard fixtures**, beside the 1,584 chart fixtures. The parity (string/tree) gate uses the
nominal render at `ssrWidth` 1280 — one per dashboard × substrate × mode, **24** — because the
markup does not depend on the container width; the pixel gates use all 72.

## §6 Invariants — additions

| # | Invariant |
|---|---|
| I-10 | `resolveDashboard` is pure: the same props and child ids give a deep-equal model; the model is JSON-serialisable (REQ-011, REQ-201). |
| I-11 | `model.cells` is in reading order, and the adapter emits the cells in exactly that order (REQ-203). |
| I-12 | For every cell and breakpoint, `1 ≤ span.col ≤ columns[bp]` (REQ-204). |
| I-13 | Every cell in the same row of the `lg` nominal layout, with equal `rowSpan`, gets the same outer height (REQ-206). |
| I-14 | No two resolved cells share a `chartId` (REQ-209). |
| I-15 | A dashboard's server render contains no `part="linked"` (REQ-219). |

## Constitution check

- **Art. 4** — fixtures fix seeds through required dashboard ids; no consumer data.
- **Art. 3** — the matrix is declared and versioned (REQ-182 extended).
- **Exception requested:** none.
