# feature-002 — UI components drawn in silverpoint

| Field | Value |
|---|---|
| **Status** | `PROPOSED` — drafted 2026-09-26; **no gate approved yet**. Nothing here is folded into `specs/`, and no task may start before gate 4 |
| **Target release** | `0.3.0` (changeset `minor` from 0.2.0). The line stays on `0.x`; `1.0.0` stays parked |
| **Requirements** | REQ-300..REQ-333 (32 MUST, 2 SHOULD) |
| **Design decisions** | DD-021..DD-027 |
| **Diagnostics** | `SP017`, `SP018`, `SP019` |
| **Tasks** | T-135..T-163 (Phase 6) |
| **Constitution** | Amendment v1.6 → v1.7 proposed ([`constitution-amendment.md`](constitution-amendment.md)) |

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

| Gate | Artifact | Decides |
|---|---|---|
| 0 | [`research.md`](research.md) | What UI libraries and hand-drawn kits do; what silverpoint takes or leaves |
| 1 | [`prd-delta.md`](prd-delta.md) | The what: scope, the 17 components, REQ-300..333 |
| 2 | [`api-delta.md`](api-delta.md) | The contract: subpaths, components, props, events, CSS, diagnostics, budgets |
| 3 | [`technical-design-delta.md`](technical-design-delta.md) + [`data-model-delta.md`](data-model-delta.md) | The how: DD-021..027, frame pieces, `ui` tokens, states, fixtures, invariants |
| 4 | [`plan-and-tasks.md`](plan-and-tasks.md) | Phase 6 steps and tasks; first run T-135..T-138 |
| — | [`analyze.md`](analyze.md) | Cross-check; 0 blocking; findings and four open decisions for the user |
| — | [`constitution-amendment.md`](constitution-amendment.md) | "What silverpoint is", Art. 1, 3, 5, 6 → v1.7 |

## Decisions the user owns (Analyze A-08)

| # | Question | Leaning |
|---|---|---|
| OQ-U1 | Components under a `ui/` subpath of the existing adapter packages, or new `@silverpoint/ui-*` packages? | Subpath (DD-021), as the dashboard did (DD-018) |
| OQ-U2 | React names unprefixed (`Button`), like the charts, or `SpButton`? | Unprefixed; subpath imports alias freely |
| OQ-U3 | All 17 components in `0.3.0`, or a first 8 with the rest in `0.3.x`? | 17, with step 6c cut so each batch can ship on its own |
| OQ-U4 | Angular `Button`/`Input` as attribute selectors on native elements (`button[spButton]`)? | Yes (DD-024) |

## Related

- [`../feature-001-dashboard/`](../feature-001-dashboard/) — the model this feature follows: a
  subpath per adapter, layout and geometry in the core, parity extended to markup the library emits.
- The documentation site's UI pages (T-160) are the ones in `docs/site`, in this repository.
