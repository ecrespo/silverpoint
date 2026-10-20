# Analyze — feature-005 cross-artifact validation

| Field | Value |
|---|---|
| **Status** | Drafted 2026-10-20 over gates 0..4 · **0 blocking** · OQ-E1..E6 resolved 2026-10-20 (the user took every recommendation) |
| **Artifacts** | [`research.md`](research.md), [`prd-delta.md`](prd-delta.md), [`api-delta.md`](api-delta.md), [`technical-design-delta.md`](technical-design-delta.md), [`data-model-delta.md`](data-model-delta.md), [`plan-and-tasks.md`](plan-and-tasks.md), [`constitution-amendment.md`](constitution-amendment.md) |

## 1. Coverage — every requirement has a task

| Requirements | Tasks |
|---|---|
| REQ-530..REQ-534 | T-226, T-227, T-228, T-230 |
| REQ-535, REQ-536 | T-227, T-229 |
| REQ-537 | T-228, T-243 |
| REQ-538 | T-232, T-241 |
| REQ-539, REQ-549 | T-233 |
| REQ-540 | T-234 |
| REQ-541, REQ-547 | T-235 |
| REQ-542 | T-237 |
| REQ-543, REQ-567 | T-238, T-239 |
| REQ-544 (SHOULD), REQ-545, REQ-559 | T-240 |
| REQ-546, REQ-548 (SHOULD) | T-236 |
| REQ-550 | T-232 |
| REQ-551, REQ-560, REQ-561 (SHOULD), REQ-562 | T-241 |
| REQ-552, REQ-554, REQ-563 | T-245 |
| REQ-553 | T-230, T-246 |
| REQ-555 | T-248 |
| REQ-556 | T-231 |
| REQ-557 | T-235, T-247 |
| REQ-558, REQ-568 | T-242, T-243 |
| REQ-564 | T-243 |
| REQ-565 | T-244 |
| REQ-566 | T-233..T-237 |
| REQ-569 | T-249 |

40 of 40 covered; no task without a requirement (T-250 and T-251 are release chores, as T-224/T-225 were).

## 2. Findings

| # | Severity | Finding | Resolution |
|---|---|---|---|
| F-1 | resolved | `reflex-silverpoint-react` 0.7.0 wrapped silverpoint 0.6.0 and duplicated feature-004 in Reflex | 0.7.1 wraps 0.7.0 natively (research §3); REQ-556 keeps it so |
| F-2 | medium | `SpButton` drops the ARIA and handlers an overlay clones onto its trigger | [`delta-014`](../delta-014-button-as-trigger.md); until it lands, REQ-547 |
| F-3 | low | Chart families and summaries exist only in the Reflex wrapper and the site | `charts.meta.ts` becomes their source; the Reflex export is checked against it (T-227) |
| F-4 | low | `props.json` lives under the docs site | Moved to `tools/agent-catalog` and shared (T-226) |
| F-5 | low | The core's diagnostic sink is internal | Used internally by a fixed-group package (DD-048, OQ-E5) |
| F-6 | info | The SDK has a v2 in beta | Pin at T-232 to the then-stable major |

## 3. Open questions for the user

| # | Question | Recommendation |
|---|---|---|
| OQ-E1 | Publish `@silverpoint/mcp` on npm in the `fixed` group (all eight packages go to `0.8.0`), or keep the server a private app (no `npx`)? | Publish, fixed group: the version guarantee is the point (DD-044) |
| OQ-E2 | Release number: `0.8.0` for the new package, or wait and bundle with the next library feature? | `0.8.0` on its own; nothing else changes in the seven packages |
| OQ-E3 | Fonts in `render_chart`: referenced with a serif fallback (default), or embed an EB Garamond subset (~40 KB per render) on request? | Reference by default, `embedFonts` opt-in |
| OQ-E4 | PNG output (REQ-544): ship the WASM rasteriser (a few MB, optional dependency) or defer? | Ship as optional dependency; SVG first in 9d, PNG last |
| OQ-E5 | Validation: internal sink (no API change) or a public `withDiagnostics()` on the core? | Internal (DD-048) |
| OQ-E6 | Rate limit (REQ-561): configure a shared store on Vercel, or rely on payload caps alone at first? | Payload caps first; add the store if traffic warrants |

**Resolved 2026-10-20:** the user took every recommendation above.

## 4. Constitution check

No article is waived. The amendment adds the package and the skills to the scope and states that
the server, like an adapter, computes no geometry (Art. 2) — see
[`constitution-amendment.md`](constitution-amendment.md).
