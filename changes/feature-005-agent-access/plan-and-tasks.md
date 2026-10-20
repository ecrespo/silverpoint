# Implementation Plan and Tasks — Phase 9, agent access

> Source specs: [`prd-delta.md`](prd-delta.md) §6.14 (REQ-530..REQ-569) · [`api-delta.md`](api-delta.md)
> · [`technical-design-delta.md`](technical-design-delta.md) DD-044..DD-050 ·
> [`data-model-delta.md`](data-model-delta.md) §2.28..§2.31. Generated: 2026-10-20. Task ids continue
> the global sequence after T-225.

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 4, drafted and approved 2026-10-20 |
| **Branch** | `feat/silverpoint-0.8` (off `develop`); sibling branches in `reflex-silverpoint-react` and `silverpoint_web` |
| **Prerequisite** | `reflex-silverpoint-react` 0.7.1 released (wraps `@silverpoint/react` 0.7.0; research §3) |

**Goal.** An agent connected to `https://silverpointweb.vercel.app/mcp`, or with the `silverpoint`
or `reflex-silverpoint` skill installed, picks a fitting chart, writes code that compiles in React,
Vue, Angular or Reflex, validates it with the core and sees the canonical render — all from one
catalog generated from the types.

**Done criteria (Phase 9)**
- Every MUST of REQ-530..REQ-569 cited by a test; traceability 0 blocking.
- `agent-catalog.json` regenerated in CI with no diff; `render_chart` parity green over the PR matrix.
- MCP smoke test green against the built handler and against the deployed URL.
- Both skills generated, their examples type-checked, both plugin manifests installable.
- The site serves `/mcp`, `/agent-catalog.json`, `/llms.txt`, `/llms-full.txt`, `/docs/ai`, and stays static.
- Released as `0.8.0` (changeset `minor`) from CI; deltas folded; `CLAUDE.md` status in the three repos.

**Carried rules.** Test-first; cite the REQ; mutation-check any test written after the code. Every
change touching `packages/` adds a changeset. Skills and everything else in English.

## Phases

| Step | Content | Repository | Depends on | Exit |
|---|---|---|---|---|
| 9a | Agent catalog: move the props pipeline, chart metadata, generator, checks | silverpoint | approval | catalog generated; I-37..I-42 tested |
| 9b | Reflex catalog export, its CI check, the pin here | reflex-silverpoint-react → silverpoint | 9a (schema) | `reflex-catalog.json` round-trips; REQ-556 tested |
| 9c | `@silverpoint/mcp`: catalog tools, recommender, codegen, resources, stdio | silverpoint | 9a | contract tests; codegen golden files type-check |
| 9d | `validate_props`, `render_chart` (+ PNG if OQ-E4), `check_palette` | silverpoint | 9c | parity over the PR matrix (REQ-567); budgets REQ-559 |
| 9e | HTTP handler, `apps/mcp-vercel`, limits; site rewrite, `/llms*.txt`, `/agent-catalog.json`, `/docs/ai` | silverpoint, silverpoint_web | 9d | smoke test local and deployed (REQ-568) |
| 9f | Skills: `silverpoint` and `reflex-silverpoint`, generators, examples check, plugin manifests | silverpoint, reflex-silverpoint-react | 9a, 9b, 9c | examples type-check (REQ-557); install tested in Claude Code |
| 9g | README, docs-site page, changeset, fold deltas, `CLAUDE.md` × 3 | all three | 9e, 9f | ready for the `0.8.0` release commit |

**First run: T-226..T-231** (9a and 9b), then review the catalog before building on it.

## Tasks

### 9a — Agent catalog

- **T-226** Move `docs/site/scripts/props.ts` to `tools/agent-catalog/props.ts`; the docs site imports it; `props.json` unchanged byte for byte. *REQ-530*
- **T-227** `charts.meta.ts`: family, summary, `DataSpec`, intents for the 60 charts, families reconciled with the site and the Reflex `FAMILIES`. Tests: I-41, every chart present. *REQ-531, REQ-536*
- **T-228** `generate.ts` → `packages/mcp/agent-catalog.json` (Data Model §2.28), names by the API Spec rule, defaults from JSDoc, diagnostics from `diagnose.ts`, palettes, grounds, stylesheets; stable order. *REQ-530..REQ-534*
- **T-229** `check.ts` + CI job: regenerate and diff; I-37, I-38, I-39. *REQ-535, REQ-536*

### 9b — Reflex catalog

- **T-230** (reflex-silverpoint-react) `scripts/export_catalog.py` → `reflex-catalog.json` (§2.30); test: every builder in `__all__` present, `wraps == SILVERPOINT_VERSION`; attach to releases. *REQ-534, REQ-553*
- **T-231** `pnpm agent-catalog:pull-reflex <version>`; join by slug into `PropEntry.reflex` and `names.reflex`; I-40 and the release-build failure. *REQ-556*

### 9c — The server, read-only tools

- **T-232** `packages/mcp` scaffold in the fixed group: `createServer`, stdio bin, `get_version`, catalog loading; trusted publisher noted for the first release. *REQ-538, REQ-550*
- **T-233** `list_charts`, `get_chart`, `list_components`, `get_component`, `search_catalog`; error contract with suggestions. *REQ-539, REQ-549, REQ-566*
- **T-234** `recommend.rules.ts` + `recommend_chart`; golden tables; I-42. *REQ-540*
- **T-235** `generate_code` for react, vue, angular, reflex; golden outputs compiled in the example apps and in a Reflex check; no `SpButton` trigger. *REQ-541, REQ-547, REQ-557*
- **T-236** Resources (catalog, charts, components, diagnostics, guides) and the two prompts. *REQ-546, REQ-548*

### 9d — Validation and render

- **T-237** `validate_props` with the capturing sink; tests per `SP` warn and error code reachable from props. *REQ-542*
- **T-238** `render_chart` (SVG) with the inlined stylesheet and font fallback; limits. *REQ-543, REQ-560*
- **T-239** Parity job: every PR-matrix chart fixture through `render_chart` vs its canonical. *REQ-567*
- **T-240** `check_palette`; PNG output and `embedFonts` per OQ-E3/E4; latency bench for REQ-559. *REQ-544, REQ-545, REQ-559*

### 9e — Hosting and the site

- **T-241** `http.ts` stateless Streamable HTTP; body, row and string limits before any work; no body logging; optional rate limit. *REQ-538, REQ-560..REQ-562*
- **T-242** `apps/mcp-vercel` + deployment; MCP smoke test in CI against the built handler and post-deploy against the URL. *REQ-558, REQ-568*
- **T-243** (silverpoint_web) `vercel.json` rewrite `/mcp`, catch-all exclusion, `/agent-catalog.json`, `/llms.txt`, `/llms-full.txt` generated at export from the catalog. *REQ-537, REQ-558, REQ-564*
- **T-244** (silverpoint_web) `/docs/ai` page: URL, client configs, skills, `npx`; no `rx.State`. *REQ-565*

### 9f — Skills

- **T-245** `skills/silverpoint`: templates (SKILL.md ≤ 500 lines, pitfalls, framework guides) + generated references; version stamp; "prefer the MCP" rule. *REQ-552, REQ-554, REQ-563*
- **T-246** (reflex-silverpoint-react) `skills/reflex-silverpoint` from `reflex-catalog.json` with `scripts/make_skill.py`; state/event guide from the demo app. *REQ-553, REQ-554*
- **T-247** Example extraction and type-check in both repositories' CI. *REQ-557*
- **T-248** `.claude-plugin/marketplace.json` in both repositories (skill + `.mcp.json` → hosted URL); install tested in Claude Code. *REQ-555*

### 9g — Documentation and release

- **T-249** `@silverpoint/mcp` README and the docs-site agent page, tool lists generated from the server. *REQ-569*
- **T-250** Changeset `minor` (`0.8.0`); `CLAUDE.md` status here, in reflex-silverpoint-react and silverpoint_web.
- **T-251** Fold the deltas into `specs/` (PRD v1.14, API v1.12, TD v1.11, DM v1.9, constitution v1.10); traceability report.
