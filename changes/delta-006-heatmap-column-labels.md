# Delta 006 — Heatmap column labels

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-24 ("resuelve los pendientes menores"); fold into `specs/` when it is writable |
| **Affects** | API Spec §7 (REQ-084 row: own props), Data Model §2.4 (`MatrixRows`) |
| **Raised by** | Phase 1 final review, 2026-09-24 |

## Finding

`HeatmapChart` names its columns `#1…#n` in the tabular alternative and in the keyboard
announcement, and draws no column labels. A weekday × hour heatmap is therefore unlabelled for
sighted users and for screen readers alike (REQ-120, REQ-121), and API Spec §7 offers no prop
to name the columns.

## Proposal

Add an optional own prop to `HeatmapChart` in every adapter:

| REQ | React | Vue | Angular selector | Own props |
|---|---|---|---|---|
| REQ-084 | `HeatmapChart` | `SpHeatmapChart` | `sp-heatmap-chart` | `labelKey`, `valuesKey`, `scaleMax`, `columnLabels?` |

- `columnLabels?: readonly string[]` names the columns in order. They head the table columns,
  the keyboard announcement and the readout, and are drawn above the cells.
- Missing names fall back to `#k`. Names beyond the drawn columns are ignored and warned with
  `SP002`.
- Without `columnLabels` the output is unchanged, so no canonical render moves.

## Constitution check

- **Art. 2** — the core lays the labels out; the adapters pass the array through.
- **Art. 9** — this delta is the spec change; the prop is implemented only after it.
- **Exception requested:** none.
