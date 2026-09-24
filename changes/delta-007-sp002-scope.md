# Delta 007 — SP002 covers every value a chart cannot draw as given

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-24 ("resuelve los pendientes menores"); fold into `specs/` when it is writable |
| **Affects** | API Spec §11 (row `SP002`) |
| **Raised by** | Phase 1 final review, 2026-09-24 |

## Finding

API Spec §11 describes `SP002` as "`null`, `undefined` or `NaN` value; the point is omitted from
the stroke", and its message ends "set `connectNulls` to bridge the gap". The Data Model already
uses `SP002` more widely — negative sectors (§2.2), out-of-range percentages (§2.3, §2.9), bad
OHLC rows (§2.6) — and Phase 1 adds tiles that do not fit, cyclic flows and impossible dates. For
all of these the stroke and `connectNulls` wording misleads.

## Proposal

| Code | Severity | REQ | Meaning |
|---|---|---|---|
| `SP002` | warn | REQ-008 | A value cannot be drawn as given — `null`, not finite, or outside the chart's data contract — so it is corrected or omitted |

The generic message names no remedy. Each chart states what happened, and its own remedy, in
the diagnostic's specifics; the line chart keeps "set `connectNulls` to bridge the gap" there.

## Constitution check

- **Art. 9** — spec change first; the code changes with it.
- **Exception requested:** none.
