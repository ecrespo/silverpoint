# Analyze — feature-007, host embedding

| Field | Value |
|---|---|
| **Status** | `APPROVED` — 2026-11-20 with every gate (user decision); re-run after the PoC, §4 |
| **Inputs** | `research.md`, `prd-delta.md`, `api-delta.md`, `technical-design-delta.md`, `data-model-delta.md`, `plan-and-tasks.md`, `constitution-amendment.md`, `repositories/*` |

## 1. Coverage

| Check | Result |
|---|---|
| Requirements in §6.16 | 40 (39 MUST, 1 SHOULD — REQ-648), REQ-629..REQ-668, contiguous |
| Requirements cited by at least one task | 40 / 40 (computed from `plan-and-tasks.md`) |
| Tasks citing a requirement | 39 / 40 (T-290..T-328; T-329 cites Art. 9) |
| Invariants with a task | I-53 T-294 · I-54 T-292 · I-55 T-293 · I-56 T-298, T-322 · I-57 T-310 · I-58 T-313 · I-59 T-316 · I-60 T-325 |
| Design decisions referenced by a task | DD-061 T-318 · DD-062 T-290, T-309 · DD-063 T-298, T-303 · DD-064 T-300 · DD-065 T-322 · DD-066 T-313 · DD-067 T-314 · DD-070 T-304 · DD-071 T-307. DD-068, DD-069 and DD-072 bind the host repositories and are carried by their spec packs |
| Diagnostics | `SP030` T-296 · `SP031` T-296 (declared), T-308 (raised) |
| Open design decision | DD-062 (budgets), by design until `poc.md` |

## 2. Findings

| ID | Severity | Finding | Resolution proposed |
|---|---|---|---|
| A-01 | **high** | REQ-650 and API delta §7 cite budgets that do not exist yet. A requirement no test can check is not a requirement | The PoC (T-290) is a hard prerequisite of gate 3; REQ-650 is approved only with numbers in DD-062. Until then gate 1 approves REQ-650's form, not its value |
| A-02 | **high** | REQ-637 (no markup parsing) and DD-070 (adopt a server-rendered root if equal) meet in one place: comparing existing nodes with what would be built. If implemented by serialising and comparing strings it is fine; if by parsing, it breaks REQ-637 | T-304/T-305 compare **node trees** (existing nodes vs freshly built, detached nodes) with the gate's comparer; stated in DD-070. Add the case to T-298's spy test |
| A-03 | medium | The embed's `width`/`height` ranges differ from the fence's (§2.38). After D11 (the deck moving to the embed's validator) one function must serve both ranges | `validateSpec` takes the ranges as an internal parameter from the start (T-292); the public signature does not change |
| A-04 | medium | DD-065 skips fixtures whose props hold functions. If that is most of a chart's fixtures, the embed gate is thin exactly where accessors are unusual | T-322 reports the skipped count per chart and fails if any chart has zero embed comparisons |
| A-05 | medium | REQ-641 forces `precision` in the client, but `renderToHTML`'s static document is produced on a server that cannot know the reader's contrast preference | Documented behaviour: the static document honours the spec's `mode`; the stylesheet's `forced-colors` rules still apply. A host that needs precision for a reader sets `mode`. No new requirement |
| A-06 | medium | `hosts.meta.ts` is hand-written (Data Model §2.43) inside a generator whose rule is "never retyped" | The rule (Art. 2, REQ-653) is about what the library *is*; host statuses are facts about other repositories. Stated in §2.43; `check` validates the file's shape and that every `repository` URL is well-formed, nothing more |
| A-07 | medium | The Python package writes `renderToHTML`'s interactive shape itself (DD-069). Two writers of one contract | The goldens of `fixtures/embed/html` ship in the conformance kit's folder of the tarball, and `silverpoint-python`'s tests compare its output with them byte for byte (its spec pack, PY-REQ-006) |
| A-08 | low | Research §4 marks three statements as inference or open (n8n reviewers and bundling; `.supx` and chart types; KNIME Hub's licence terms) | Each is a task or open question in the host's spec pack, and none blocks Phase 11 |
| A-09 | low | The constitution amendment says hosts "SHALL draw only through" the embed or an adapter, but this repository cannot enforce an article in other repositories | Each spec pack opens with a constitution that inherits the article, and the conformance kit is its test. The amendment's wording is kept: it states the rule for anything that carries the name |
| A-10 | low | `generate_code { framework: 'html' }` returns a `<script>` tag whose `src` the server cannot know | The emitted `src` is the path inside the npm package, with `notes` telling the agent to serve or vendor it; no CDN URL is written (REQ-644's spirit, supply-chain row of TD delta §4) |

No finding contradicts the constitution. A-01 and A-02 are the two that would have cost the most if
met during implementation.

## 3. What a changed decision touches

| Decision (research §8) | If changed | Artifacts to revise |
|---|---|---|
| D1 release number | another line | README, plan, first-publish, sibling prompts |
| D2 `fixed` group | embed versioned alone | REQ-629, DD-068 (hosts would pin embed's version, not the library's), first-publish, PY-DD-01 |
| D3 Flask/Django in the Python package | separate distributions | `repositories/README.md` (two more repositories), `silverpoint-python.md` |
| D4 Plone in two repositories | one | `repositories/README.md`, both Plone packs |
| D5..D8 host distribution choices | — | that host's spec pack only |
| D9 interaction in the first client | static first | REQ-638, 639, 642, 665; DD-064; T-300, T-301; Art. 5 would need a written exception |
| D11 the deck keeps its parser | deck moves now | DD-061, a new step in Phase 11, the deck gates re-run |

## 4. Re-run after the PoC (2026-11-20)

| ID | Now |
|---|---|
| A-01 | **Resolved.** DD-062 carries measured budgets (140 / 220 kB gzip; own code 12 / 8 kB); REQ-650 is testable |
| A-02 | Unchanged; T-304's cases now include the element defined before its JSON child (PoC F-P1) |
| A-04 | No fixture carries a function in its props today (3 402 compared, 0 skipped); T-322's per-chart count stays as a guard |
| New, F-P1 | DD-070 amended: the element waits for its JSON child. Covered by T-304 |
| Carried | Firefox and WebKit rows of the PoC, OQ-H2 included, are an exit of T-324 |

Coverage is unchanged: 40/40 requirements with a task, no new requirement.

## 5. Open questions for the user

Settled 2026-11-20: D1..D12 approved as recommended with gate 0; OQ-H1..H4 resolved at gate 3 (TD delta §7).

## Constitution check

Art. 1–8 as stated in the PRD, API, TD and Data Model deltas. Art. 9: every MUST has a task and
every task a requirement or an article (§1). The v1.12 amendment is proposed, not in force.
