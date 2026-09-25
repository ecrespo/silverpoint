# Delta 010 — The input shape and the alignment of VolvelleChart

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-25 ("Apruebo los deltas puedes continuar"); fold into `specs/` when it is writable |
| **Affects** | Data Model (a new §2.12); API Spec §7 (`VolvelleChart` row) |
| **Raised by** | Phase 3, T-081, 2026-09-24 |

## Finding

REQ-090 asks for "concentric categorical rings with an index that aligns a combined readout", and
API Spec §7 gives `VolvelleChart` the own props `rings`, `indexRing`, `indexValue`. The Data Model
has no section for it: neither the rings' shape nor what "aligns" means is specified.

## Proposal

Follow the paper volvelle — discs of categories read against one index — and the orbit chart's
reading of its props (delta-009):

```ts
type VolvelleData = ReadonlyArray<{
  label: string;               // the ring's name
  segments: readonly string[]; // its categories, clockwise, in equal angles
}>;
```

- `data` holds the rings, from the inside out; `rings` caps how many are shown.
- The rings share one angle frame: ring *k*'s *n* segments each span 360°/*n*, the first starting
  at 12 o'clock.
- `indexRing` (0-based, default 0) and `indexValue` (default: that ring's first segment) choose
  the **index angle**: the middle of that segment. The drawing is turned so the index angle faces
  12 o'clock, under a fixed pointer.
- The **combined readout** is, for every ring, the segment that contains the index angle
  (half-open spans, `[start, end)`), printed as `label segment` pairs and marked on each ring.
- An `indexRing` out of range or an `indexValue` absent from its ring raises `SP002` and falls
  back to the default.

## Constitution check

- **Art. 9** — spec gap surfaced as the chart is built; implemented as proposed meanwhile.
- **Exception requested:** none.
