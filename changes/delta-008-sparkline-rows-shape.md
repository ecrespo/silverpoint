# Delta 008 — The input shape of SparklineRows

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-25 ("Apruebo los deltas puedes continuar"); **folded into `specs/` on 2026-09-25** |
| **Affects** | Data Model §2.1 ("Used by" list) and a new §2.11 |
| **Raised by** | Phase 2 planning, 2026-09-24 |

## Finding

Data Model §2.1 lists sparkline rows among the `CategorySeries` charts, but API Spec §7 gives
`SparklineRows` the own props `rows`, `nameKey`, `readoutKey`, `seriesKey`, `pointKey`: a row
with a name, a readout and a series of points. A flat `CategorySeries` has no field for a row's
name or readout, so the two specs describe different shapes.

## Proposal

Follow the API Spec, which is the consumer-facing contract, and give the shape its own section:

```ts
type SparklineRowsData = ReadonlyArray<{
  name: string;            // nameKey
  readout?: string | number; // readoutKey; the last value when absent
  points: readonly unknown[]; // seriesKey; each read through pointKey
}>;
```

`rows` caps the rows shown, from the first. `pointKey` reads a point's value; by default a point
that is a number is its own value, and an object's `value` field is read. Remove sparkline rows
from the §2.1 "Used by" list.

## Constitution check

- **Art. 9** — spec divergence surfaced before it ships; implemented per the API Spec meanwhile.
- **Exception requested:** none.
