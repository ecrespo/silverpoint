# feature-002 — UI components drawn in silverpoint

| Field | Value |
|---|---|
| **Status** | `APPROVED` — drafted 2026-09-26; gates 0..4 approved 2026-09-28 by Ernesto Crespo (Phase 0). Folded into `specs/` 2026-09-29 (T-162); implemented, awaiting the `0.3.0` release |
| **Target release** | `0.3.0` (changeset `minor` from 0.2.0). The line stays on `0.x`; `1.0.0` stays parked |
| **Requirements** | REQ-300..REQ-334 (33 MUST, 2 SHOULD) |
| **Design decisions** | DD-021..DD-027 |
| **Diagnostics** | `SP017`, `SP018`, `SP019` |
| **Tasks** | T-135..T-163 (Phase 6) |
| **Constitution** | Amendment v1.6 → v1.7 approved with gate 1 ([`constitution-amendment.md`](constitution-amendment.md)); folded in T-162 (2026-09-29) |
| **Visual concept** | [`concept.png`](concept.png) — the reference drawing for 0.3.0; the seven corrections it raised (C-1..C-7) are in [`analyze.md`](analyze.md) |

A first family of **interface components** —buttons, form controls, tabs, steps, cards, tags,
progress, alerts— for React, Vue and Angular, drawn with the same grounds as the charts: prepared
substrate, a hand-inked frame, tone by hatching, heightening on the current item. The rule that
makes silverpoint different carries over unchanged: **the hand touches only the ornament**. Hit
areas, focus indicators and every shape that carries a value (a progress fill, a slider thumb, a
rating) are exact, and every component has a `precision` mode.

It is **not** a port of Ant Design. Ant Design is the functional reference for the inventory, as
Monocharts was for the charts; the visual language, the behaviour code and the API are original
work. It is also not the whole inventory: overlays (select, menu, dialog, popover, tooltip, date
picker), tables, trees and uploads are out of `0.3.0` (PRD delta §3).

## Reading order and approval gates

Per Art. 9, each gate is approved before the next artifact is relied on.

| Gate | Artifact | Decides | Approved |
|---|---|---|---|
| 0 | [`research.md`](research.md) | What UI libraries and hand-drawn kits do; what silverpoint takes or leaves | ✅ 2026-09-28 |
| 1 | [`prd-delta.md`](prd-delta.md) | The what: scope, the 17 components, REQ-300..334 | ✅ 2026-09-28 |
| 2 | [`api-delta.md`](api-delta.md) | The contract: subpaths, components, props, events, CSS, diagnostics, budgets | ✅ 2026-09-28 |
| 3 | [`technical-design-delta.md`](technical-design-delta.md) + [`data-model-delta.md`](data-model-delta.md) | The how: DD-021..027, frame pieces, `ui` tokens, states, fixtures, invariants | ✅ 2026-09-28 |
| 4 | [`plan-and-tasks.md`](plan-and-tasks.md) | Phase 6 steps and tasks; first run T-135..T-138 | ✅ 2026-09-28 |
| — | [`analyze.md`](analyze.md) | Cross-check; 0 blocking; findings, concept corrections and the user's decisions (Dispositions) | — |
| — | [`constitution-amendment.md`](constitution-amendment.md) | "What silverpoint is", Art. 1, 3, 5, 6 → v1.7 | with gate 1 |

## Decisions the user took (2026-09-28)

| # | Question | Decision |
|---|---|---|
| OQ-U1 | Components under a `ui/` subpath of the existing adapter packages, or new `@silverpoint/ui-*` packages? | `ui/` subpath of the existing packages (DD-021) |
| OQ-U2 | React names unprefixed (`Button`), like the charts, or `SpButton`? | Prefixed: `SpButton`, `SpTabs`, … in React, as in Vue and Angular — one name per component across the three adapters |
| OQ-U3 | All 17 components in `0.3.0`, or a first 8 with the rest in `0.3.x`? | All 17 in `0.3.0`; step 6c keeps its three batches as review points, not as releases |
| OQ-U4 | Angular `Button`/`Input` as attribute selectors on native elements (`button[spButton]`)? | Yes (DD-024) |

## Related

- [`../feature-001-dashboard/`](../feature-001-dashboard/) — the model this feature follows: a
  subpath per adapter, layout and geometry in the core, parity extended to markup the library emits.
- The documentation site's UI pages (T-160) are the ones in `docs/site`, in this repository.
