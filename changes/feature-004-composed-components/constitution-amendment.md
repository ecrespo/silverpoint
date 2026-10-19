# Constitution amendment — v1.8 → v1.9

| Field | Value |
|---|---|
| **Status** | `APPROVED` — with gate 1, approved 2026-10-18 by Ernesto Crespo (drafted the same day) |
| **Articles touched** | preamble ("What it is not"), Art. 3, Art. 6 |

## 1. Preamble — "What it is not"

**Today:** "The first chart catalog takes its functional inventory from Monocharts and the second from
TanStack Charts' catalog, but the visual language, the geometry and the code are original work."

**Proposed:** append — "The palettes, composed components, overlays and timeline of `0.7.0` take
their inventory from `reflex-silverpoint-react` 0.7, this project's own Reflex wrapper, where they
were first drawn outside the parity contract; here they are rewritten on the core."

*Why:* the constitution names the source of every inventory; this one is internal, and saying so
records that the Reflex implementation is not the reference for behaviour or geometry.

## 2. Art. 3 — third-party markup inside an opt-in integration

**Proposed:** add after the first paragraph — "Where a component hosts a third-party widget behind an
optional peer dependency —the TimelineJS timeline of `SpTimeline`— the gate covers the markup the
library emits around it (its surface, probes and mount) and not the widget's own DOM, which the
library neither writes nor controls; such a component SHALL carry a pixel fixture over a pinned
version of the widget."

*Why:* without it, Art. 3 would either forbid `SpTimeline` (the TimelineJS DOM cannot be compared
across adapters: TimelineJS builds it at runtime, the same in all three) or be silently stretched.

## 3. Art. 6 — heightening in an open list

**Today:** "… in an interface component, for its current item only (the active tab, the current step,
the selected segment, the thumb), at most one per component instance."

**Proposed:** "… for its current item only (the active tab, the current step, the selected segment,
the thumb, the current page, **the active option or item of an open list**), at most one per
component instance."

*Why:* the highlighted option of a select or a menu moves with the keyboard; it is the list's current
item, and naming it closes the question of whether the chosen option (marked by a tick) may also be
heightened: it may not.

## Not amended

- **Art. 1, 2, 4, 5, 7, 8** apply as written: overlays and composed components are interface
  components (Art. 1's second paragraph, Art. 5's second paragraph), palettes are data under Art. 7,
  and an optional peer imported by one subpath is not a dependency of the package under Art. 8.
