# feature-005 — agent access: the MCP server and the skills

| Field | Value |
|---|---|
| **Status** | `APPROVED` — drafted 2026-10-20 after the user approved, the same day, an MCP server and a skill on the silverpoint side, and a skill for `reflex-silverpoint-react` as well. Gates 0..4 and the constitution amendment approved together on 2026-10-20 by Ernesto Crespo, with the recommendations of OQ-E1..E6. **Folded into `specs/` on 2026-10-20** (T-251); the sibling repositories' tasks remain |
| **Target release** | `0.8.0` (changeset `minor` from 0.7.0) for the agent catalog and the MCP package; the skills follow the library version. The line stays on `0.x`; `1.0.0` stays parked |
| **Requirements** | REQ-530..REQ-569 (§6.14) |
| **Design decisions** | DD-044..DD-050 |
| **Diagnostics** | none new in the library; the server reports the existing `SP` codes |
| **Tasks** | T-226..T-251 (Phase 9, steps 9a..9g) |
| **Constitution** | Amendment v1.9 → v1.10 ([`constitution-amendment.md`](constitution-amendment.md)): scope and Art. 2; folded 2026-10-20 |
| **Branch** | `spec/feature-005-agent-access` (specs); implementation on `feat/silverpoint-0.8` |
| **Sibling repositories** | `reflex-silverpoint-react` (its skill and its catalog export), `silverpoint_web` (`/llms.txt`, `/mcp`, the "Use with AI" page) |

silverpoint shipped in September 2026: no language model was trained on it. An agent asked for "a
sankey in silverpoint" invents props, misses the grounds and palettes, and cannot see what it drew.
This feature gives agents three ways in, from the same generated catalog, so they never disagree
with the published types:

1. **Two skills** — `silverpoint` (React, Vue, Angular; in this repository) and
   `reflex-silverpoint` (Python/Reflex; in `reflex-silverpoint-react`): how to choose a chart, its
   props, grounds, palettes, the dashboard, the UI, composed and overlay components and the
   timeline, in each framework's idiom.
2. **An MCP server** — `@silverpoint/mcp`: the catalog as tools and resources, a deterministic
   chart recommender, code generation per framework (Reflex included), prop validation with the
   core's own diagnostics, and the canonical SVG of any chart, so an agent can see what it drew.
3. **`/llms.txt`** on the official site, for every other tool.

## Reading order and approval gates

| Gate | Artifact | Decides | Approved |
|---|---|---|---|
| 0 | [`research.md`](research.md) | What exists to build on; hosting; the two repositories; risks | ✅ 2026-10-20 |
| 1 | [`prd-delta.md`](prd-delta.md) | The what: scope, personas, REQ-530..569 | ✅ 2026-10-20 |
| 2 | [`api-delta.md`](api-delta.md) | The contract: catalog schema, MCP tools and resources, skill layout, `llms.txt` | ✅ 2026-10-20 |
| 3 | [`technical-design-delta.md`](technical-design-delta.md) + [`data-model-delta.md`](data-model-delta.md) | The how: DD-044..050; the agent catalog and the Reflex catalog shapes | ✅ 2026-10-20 |
| 4 | [`plan-and-tasks.md`](plan-and-tasks.md) | Phase 9 steps and tasks, across the three repositories | ✅ 2026-10-20 |
| — | [`analyze.md`](analyze.md) | Coverage, findings, open questions for the user | — |
| — | [`constitution-amendment.md`](constitution-amendment.md) | Scope line; Art. 2 for the server | ✅ 2026-10-20, with gate 1 |
| — | [`sibling-prompts.md`](sibling-prompts.md) | The prompts for the tasks in `reflex-silverpoint-react` and `silverpoint_web` | — |

## Decisions the user took (2026-10-20)

| # | Question | Decision |
|---|---|---|
| — | Skill, MCP, or both? | Both, on the silverpoint side |
| — | A skill for the Reflex wrapper too? | Yes: `reflex-silverpoint`, in `reflex-silverpoint-react` |
| — | Inside the Reflex backend of the official site? | No (research §5): the site stays frontend-only; the server is a function of its own behind `/mcp` |
| — | `reflex-silverpoint-react` behind silverpoint (wrapped 0.6.0)? | Resolved first: `reflex-silverpoint-react` 0.7.1 wraps `@silverpoint/react` 0.7.0 natively (research §3) |
| OQ-E1..E6 | The open questions of [`analyze.md`](analyze.md) §3 | Every recommendation: `@silverpoint/mcp` published in the `fixed` group as `0.8.0`; fonts referenced, `embedFonts` opt-in; PNG through an optional WASM rasteriser, last in 9d; the core's internal sink; payload caps first, no rate-limit store |
| — | Which repositories in the first implementation run? | This one only. 9b, T-243, T-244 and T-246 wait for `reflex-silverpoint-react` and `silverpoint_web`; until the real export, the Reflex pin is derived here and marked so |
| — | delta-014 with this feature? | No: separately, after it. REQ-547 keeps native `<button>` triggers meanwhile |

Open questions for the user are in [`analyze.md`](analyze.md) §3.

## Related

- [`../delta-014-button-as-trigger.md`](../delta-014-button-as-trigger.md) — found while aligning the
  Reflex wrapper: `SpButton` drops the ARIA an overlay clones onto its trigger. Independent of this
  feature; the MCP's generated overlay code depends on its outcome (REQ-547).
