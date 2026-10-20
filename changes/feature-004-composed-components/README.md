# feature-004 — palettes, composed components, overlays and the timeline

| Field | Value |
|---|---|
| **Status** | `APPROVED` — drafted 2026-10-18; gates 0..4 approved together on 2026-10-18 by Ernesto Crespo. Implemented (T-200..T-224) and folded into `specs/` 2026-10-20 (T-225); the `0.7.0` release awaits the user |
| **Target release** | `0.7.0` (changeset `minor` from 0.6.0). The line stays on `0.x`; `1.0.0` stays parked |
| **Source** | [`reflex-silverpoint-react` v0.7.0](https://github.com/ecrespo/reflex-silverpoint-react/releases/tag/v0.7.0) (commit `5868f97`) |
| **Requirements** | REQ-460..REQ-523 (56 MUST, 1 SHOULD) |
| **Design decisions** | DD-037..DD-043 |
| **Diagnostics** | `SP023`, `SP024`, `SP025` |
| **Tasks** | T-200..T-225 (Phase 8, steps 8a..8h) |
| **Constitution** | Amendment v1.8 → v1.9 approved with gate 1 (2026-10-18); folded 2026-10-20 (T-225) ([`constitution-amendment.md`](constitution-amendment.md)) |
| **Branch** | `feat/silverpoint-0.7` |

The Reflex wrapper's `0.7.0` drew, outside silverpoint's parity contract, the pieces a product needs
around its charts: **palettes** in the inks of historical media, **twelve composed components**
(table, pagination, breadcrumb, avatar, statistic, descriptions, timeline list, collapse, empty,
result, textarea, number input), **seven overlays** (modal, drawer, popover, tooltip, select,
dropdown menu, toast) and a **Knight Lab timeline**. This feature makes them silverpoint's, in
React, Vue and Angular, on one core and under every gate, with overlays on the platform's
`<dialog>` and Popover API instead of Radix.

## Reading order and approval gates

| Gate | Artifact | Decides | Approved |
|---|---|---|---|
| 0 | [`research.md`](research.md) | What Reflex 0.7 does; what carries over, what cannot, the renames | ✅ 2026-10-18 |
| 1 | [`prd-delta.md`](prd-delta.md) | The what: scope, the 21 rows + timeline, REQ-460..523 | ✅ 2026-10-18 |
| 2 | [`api-delta.md`](api-delta.md) | The contract: subpaths, props, markup, events, CSS, codes, budgets | ✅ 2026-10-18 |
| 3 | [`technical-design-delta.md`](technical-design-delta.md) + [`data-model-delta.md`](data-model-delta.md) | The how: DD-037..043, presets, value contracts, pairs, fixtures, invariants | ✅ 2026-10-18 |
| 4 | [`plan-and-tasks.md`](plan-and-tasks.md) | Phase 8 steps and tasks; first run T-200..T-204 | ✅ 2026-10-18 |
| — | [`analyze.md`](analyze.md) | Coverage, findings, the user's decisions | — |
| — | [`constitution-amendment.md`](constitution-amendment.md) | Preamble, Art. 3, Art. 6 → v1.9 | ✅ with gate 1 |

## Decisions the user took (2026-10-18)

| # | Question | Decision |
|---|---|---|
| OQ-C1 | Overlays on Radix-like libraries per framework, or on the platform? | The platform: `<dialog>`, Popover API, keyboard and placement in the core (DD-038) |
| OQ-C2 | The Knight Lab timeline: component, CSS only, or out? | An optional `timeline` subpath with `@knight-lab/timelinejs` as optional peer (DD-042) |
| — | Gate by gate, or all together? | All gates drafted together, one approval |

## Related

- [`../feature-002-ui-components/`](../feature-002-ui-components/) — the model this feature extends:
  the `ui/` subpaths, the view trees, `ui.css`, the fixture axes.
