# Analyze — feature-006, slide decks

| Field | Value |
|---|---|
| **Status** | `DRAFT` — drafted 2026-10-31 over gates 0..4 and the PoC |
| **Inputs** | `research.md`, `prd-delta.md`, `api-delta.md`, `poc.md`, `technical-design-delta.md`, `data-model-delta.md`, `plan-and-tasks.md`, `constitution-amendment.md` |

## 1. Coverage

| Check | Result |
|---|---|
| Requirements in §6.15 | 59 (56 MUST, 3 SHOULD), REQ-570..REQ-628, contiguous |
| Requirements cited by at least one task | 59 / 59 (computed from `plan-and-tasks.md`) |
| Tasks citing a requirement | 37 / 37 (T-252..T-288; T-289 cites Art. 9) |
| Invariants with a task | I-43..I-52: T-254 (I-43, I-44), T-255 (I-45), T-259 (I-46, I-47), T-257 (I-48), T-267 (I-49, I-50), T-268 (I-51), T-260 (I-52) |
| Design decisions referenced by a task | DD-051..DD-060, all |
| Diagnostics | `SP026` T-259, `SP027` T-257, `SP028` T-267, `SP029` T-261, `SP018` (extended) T-276 |

## 2. Findings

| ID | Severity | Finding | Resolution |
|---|---|---|---|
| A-01 | medium | REQ-570 and API delta §1 still list `@marp-team/marpit-svg-polyfill`; DD-051 drops it after the PoC | Folded as "amended by the PoC": REQ-570 names Marpit only; API §1 dependencies and §7.1 `applyScaling` text follow DD-051 |
| A-02 | medium | API delta §8 shows each `<svg>` directly under the Marpit container; DD-051 adds a `div.sp-deck-slide` box from `slideContainer` | Folded with A-01: the markup contract gains the slide box, which carries `data-sp-current`, `inert` and `hidden` (DD-057) |
| A-03 | **high** | The fence's static markup must equal the adapter's chart DOM (REQ-593, Art. 3), but the canonical writer of a client chart's DOM —`.sp-root` with its attributes, the SVG, the live region, the data table— exists only in `tools/visual-gate/dashboard-canonical.ts`, not in a package. `@silverpoint/marp` (and `render_deck`) cannot depend on a tool | T-259 moves that reference writer into `@silverpoint/grounds` as `toChartRootString(rendered)` (public: API §1 addition to grounds, like `toSVGString`), with the palette `style` the palette gate already checks on `.sp-root`; `dashboard-canonical.ts` imports it. The existing dashboard and palette gates then prove it equals the three adapters before the deck uses it |
| A-04 | medium | Parity across adapters needs the same deck id: Marpit's scoped CSS and every chart id embed it | Deck fixtures pass an explicit `id`; REQ-571's derived ids are tested per adapter, not across them (as charts are) |
| A-05 | low | Research §7 R1's fallback ("no inline SVG, transform") is superseded by DD-051 | Noted in `poc.md`; research is a gate-0 record and stays as written |
| A-06 | low | `palette` on `SpDeck` is a preset name only (REQ-609); a custom `Palette` object reaches fences through the provider or the fence's own `palette` | Stated in API §6; the docs say it (T-287) |
| A-07 | low | The fence's default width is "the slide content width": 1120 at 16:9 but 800 at 4:3 (960 − 2 × 80) | Data Model §2.32 states it per size at fold |
| A-08 | medium | `hash` (REQ-602) with several decks on one page: each would write `#<n>` | Documented: `hash` is for a page's one deck; a second deck with `hash` raises no error but the last writer wins. No new requirement (`0.x`) |
| A-09 | low | `@silverpoint/marp` imports every recipe (DD-053), so its size includes the core's full bundle and `/catalog` | Measured by T-281; outside chart-only paths by REQ-616 |

No finding contradicts the constitution; A-03 is the one that would have broken Art. 3 had it been
found during implementation.

## 3. Open questions for the user

None blocking. The recommendations above are applied unless the user says otherwise.

## Constitution check

Art. 1–8 as stated in the PRD, TD and Data Model deltas; Art. 9: every MUST has a task and every
task a requirement (§1). The v1.11 amendment is approved and folds with the feature (T-289).
