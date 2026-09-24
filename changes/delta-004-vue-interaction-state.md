# Delta 004 — interaction state in the Vue adapter

| Field | Value |
|---|---|
| **Status** | `PROPOSED` |
| **Affects** | PRD REQ-108 |
| **Raised by** | T-018, 2026-09-24 |

## Finding

REQ-108: the Vue adapter declares "no component-local reactive state beyond the measured
container size". REQ-141 requires the readout to appear for the item under the pointer or
keyboard focus, which is state that changes without any prop changing. Both cannot hold.

## Proposal

Reword REQ-108's clause to: "with no component-local reactive state beyond the measured
container size and the active item of the interaction engine". The active item is produced by
the core's pure `reduceInteraction`; the adapter only stores it.

## Constitution check

- **Art. 2** — the state is stored, never computed, by the adapter.
- **Exception requested:** none.
