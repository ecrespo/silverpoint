# Delta 009 — How OrbitChart's props read the Orbits shape

| Field | Value |
|---|---|
| **Status** | `PROPOSED` |
| **Affects** | Data Model §2.10; API Spec §7 (`OrbitChart` row) |
| **Raised by** | Phase 3, T-083, 2026-09-24 |

## Finding

Data Model §2.10 defines the orbits as rows `{ label, markers: [{ period, value }] }`, and API
Spec §7 gives `OrbitChart` the own props `orbits`, `periodKey`, `markerKey` — but neither says
how the three props map onto the shape: whether `orbits` is the data or a count, what
`markerKey` reads, and where a marker's `value` and an orbit's `label` come from.

## Proposal

Read them as `SparklineRows` reads its rows (delta-008), the nearest precedent in the catalog:

```ts
type OrbitData = ReadonlyArray<{
  label: string;                                  // the orbit's name
  markers: ReadonlyArray<{ period: number; value: number }>; // markerKey, default 'markers'
}>;
```

- `data` holds the orbit rows, as in every chart (API Spec §5).
- `orbits` caps the orbits shown, from the inside out, as `rows` does; all by default.
- `markerKey` reads a row's markers (default `'markers'`); `periodKey` reads a marker's period
  (default `'period'`), 0-1 over the cycle. A marker's `value` and an orbit's `label` are read
  from those fields, as Data Model §2.10 names them.
- A period outside 0-1, or a non-finite or negative value, raises `SP002` and drops the marker.

## Constitution check

- **Art. 9** — spec gap surfaced as the chart is built; implemented as proposed meanwhile.
- **Exception requested:** none.
