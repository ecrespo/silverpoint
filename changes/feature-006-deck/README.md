# feature-006 — slide decks: Marp/Marpit Markdown in the silverpoint style

| Field | Value |
|---|---|
| **Status** | `IMPLEMENTED` — every gate approved 2026-10-31 by Ernesto Crespo; Phase 10 (T-252..T-289) implemented on `feat/silverpoint-0.9` and **folded into `specs/` 2026-10-31** (T-289); release `0.9.0` pending the first publish of `@silverpoint/marp` ([`first-publish.md`](first-publish.md)) |
| **Target release** | `0.9.0` (changeset `minor` from 0.8.x; user decision 2026-10-31). The line stays on `0.x`; `1.0.0` stays parked |
| **Requirements** | REQ-570..REQ-628 (§6.15) |
| **Design decisions** | DD-051..DD-060 (DD-051 records the PoC outcome, DD-052 the engine seam) |
| **Diagnostics** | `SP026`–`SP029` |
| **Tasks** | T-252..T-289 (Phase 10, steps 10a..10h; 10a is the PoC) |
| **Constitution** | Amendment v1.10 → v1.11 ([`constitution-amendment.md`](constitution-amendment.md)): scope and Art. 2 |
| **Branch** | `spec/feature-006-deck` (specs); implementation on `feat/silverpoint-0.9` |
| **Sibling repository** | `reflex-silverpoint-marp` (later; wraps the React `SpDeck`) |

## Reading order and approval gates

| Gate | Artifact | Decides | Approved |
|---|---|---|---|
| 0 | [`research.md`](research.md) | What exists to build on; Marpit measured; conflicts; risks | ✅ 2026-10-31 |
| 1 | [`prd-delta.md`](prd-delta.md) | The what: scope, personas, REQ-570..628 | ✅ 2026-10-31 |
| 2 | [`api-delta.md`](api-delta.md) | The contract: `@silverpoint/marp`, `SpDeck` ×3, directives, fence, controller, markup, MCP tools | ✅ 2026-10-31 |
| PoC | [`poc.md`](poc.md) (Phase 10a) | Scaling method in Chromium, Firefox, WebKit: **`svg-transform`** (DD-051) | ✅ 2026-10-31 |
| 3 | [`technical-design-delta.md`](technical-design-delta.md) + [`data-model-delta.md`](data-model-delta.md) | The how: DD-051..060; the shapes | ✅ 2026-10-31 |
| 4 | [`plan-and-tasks.md`](plan-and-tasks.md) | Phase 10 steps and tasks, T-252..T-289 | ✅ 2026-10-31 |
| — | [`analyze.md`](analyze.md) | Coverage 59/59; findings A-01..A-09 | ✅ 2026-10-31 |
| — | [`constitution-amendment.md`](constitution-amendment.md) | Scope line; Art. 2 for `@silverpoint/marp` | ✅ 2026-10-31 |

The user's working order: discovery → PRD → API → TD → **PoC** → data model → plan → tasks →
analyze → implementation, with a review stop after discovery, after the API and after the PoC.

## Decisions the user took (2026-10-31)

See [`research.md`](research.md) §6: `0.9.0`; SDD deltas in this folder; static canonical SVG +
hydration in the fence; code in EB Garamond; no raw HTML; the agent catalog, MCP and skill updated
in this release; these branch names.
