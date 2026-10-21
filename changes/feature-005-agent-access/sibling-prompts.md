# Prompts for the sibling repositories

Feature-005's tasks that live outside this repository, written as prompts for a Claude Code session
opened in each one (2026-10-20). Each prompt points back to this repository's `specs/` and ledger by
local path (`~/WebstormProjects/silverpoint`), so the session reads the approved design from here.

| Repository | Tasks | Unblocks here |
|---|---|---|
| `reflex-silverpoint-react` | T-230, T-246, its halves of T-247, T-248, T-250 | Replacing the derived Reflex pin with the wrapper's own export; REQ-556 becomes strict |
| `silverpoint_web` | T-243, T-244, its half of T-250 | REQ-564 (`/llms.txt`), deferred in `specs/tasks.md`; the public `/mcp` URL |

Run `silverpoint_web` after `0.8.0` is published: its `/mcp` rewrite points at the MCP project's
production URL, and its `/agent-catalog.json` is the one `@silverpoint/mcp@0.8.0` ships.

## `reflex-silverpoint-react`

````text
Implement this repository's half of silverpoint's feature-005 (agent access). The design is approved and lives in the silverpoint repository, at ~/WebstormProjects/silverpoint. Read these before writing anything:
- specs/prd.md §6.14: REQ-553, REQ-554, REQ-555, REQ-556 and REQ-557.
- specs/api-spec.md §14.6: the skill layout and the `reflex-silverpoint` frontmatter, which must be used verbatim.
- specs/data-model.md §2.30: the `ReflexCatalog` shape, including its "amended in implementation" notes.
- changes/feature-005-agent-access/plan-and-tasks.md: tasks T-230, T-246, T-247 and T-248, and the 9a, 9f and 9g ledgers.

Your tasks are T-230, T-246, and this repository's halves of T-247, T-248 and T-250. Work on a new branch `feat/agent-skill`, created off `develop`.

1. T-230 — `scripts/export_catalog.py` writes `reflex-catalog.json` following Data Model §2.30.
   - Required fields: `schema: 1`, `package`, `version` (the wheel's), `wraps` (`SILVERPOINT_VERSION`), `common` (the Python names of the shared chart and UI props), `charts`, `components` and `helpers`.
   - Do not write a `derived` field: that field marks silverpoint's interim pin.
   - Build the catalog from the package's own `CHARTS`, `UI_COMPONENTS`, builder signatures, PropDocs and `__all__`.
   - Reference: silverpoint's `tools/agent-catalog/reflex/derive.py` reads this repository with `ast` and produces the same shape (`tools/agent-catalog/reflex/reflex-catalog.json` there). Your export must equal that file once `derived` is removed. Make that comparison a test while the two agree, then keep a CI check that regenerates the catalog and fails on a diff.
   - Tests:
     - every builder in `__all__` is present;
     - `wraps == SILVERPOINT_VERSION`;
     - the slugs match silverpoint's chart and component slugs.
   - Attach `reflex-catalog.json` to each GitHub release (release workflow).
2. T-246 — `skills/reflex-silverpoint/`:
   - It holds `SKILL.md` (under 500 lines, version stamp, a rule to prefer the silverpoint MCP tools when they are connected) and `references/`:
     - `charts/<family>.md`, one file per family, with snake_case props tables and examples;
     - `components.md`, `overlays.md`, `timeline.md`, `dashboard.md` and `palettes.md`;
     - `state-and-events.md`: controlled vs uncontrolled, event payloads and data without `rx.foreach`, drawn from the demo app.
   - Hand-written prose goes in `skills/reflex-silverpoint/templates/`. Generated tables go between `<!-- generated:<block> -->` markers. `scripts/make_skill.py` writes the generated tables from `reflex-catalog.json`, and CI fails if regenerating the skill changes it.
   - Mirror silverpoint's `skills/silverpoint/` and `tools/agent-catalog/skill.ts` in structure and tone. Its `references/reflex.md` and its `pitfalls.md` show what this skill must expand. Overlays take a native trigger (`trigger="…"`), never `sp_button` (REQ-547, delta-014).
3. T-247 (this repository's half) — a pytest test that:
   - extracts every `python` fence from the skill;
   - imports each one and calls `.render()` on the components it builds.
   - Every other fence must be prose (`sh`, `text`, `json`), and the test refuses anything else.
4. T-248 (this repository's half):
   - `.claude-plugin/marketplace.json` lists one plugin, `reflex-silverpoint`, with source `./`.
   - `.claude-plugin/plugin.json` holds the skill plus the hosted server, declared inline as `mcpServers` (HTTP, `https://silverpointweb.vercel.app/mcp`). Do not use a root `.mcp.json`.
   - Copy the shape of silverpoint's `.claude-plugin/` and keep the versions equal to the package's, with a test that checks this.
   - Validate with `claude plugin validate`. Test the install only with a throwaway `CLAUDE_CONFIG_DIR`; never touch the real `~/.claude`.
5. T-250 (this repository's half) — record the feature's status in `CLAUDE.md`, and add the skill and catalog to the README.

Rules:
- Test-first, and cite the REQ in each test name. Mutation-check any test written after the code.
- Everything in English. Use uv.
- Do not publish to PyPI and do not create a release without asking me.
- Commits end with the Co-Authored-By line.
- Run the repository's CI steps before saying it is done.

When it is done, tell me the export's commit or release so that silverpoint can replace its derived pin with it. With the real export, REQ-556 becomes strict.
````

## `silverpoint_web`

````text
Implement this site's half of silverpoint's feature-005 (agent access). The design is approved and lives in the silverpoint repository, at ~/WebstormProjects/silverpoint. Read these before writing anything:
- specs/prd.md §6.14: REQ-537, REQ-558, REQ-564 and REQ-565.
- specs/api-spec.md §14.7: the site's paths.
- specs/technical-design.md DD-050: the hosting.
- changes/feature-005-agent-access/plan-and-tasks.md: T-243, T-244, and the 9e and 9g ledgers.

silverpoint's own docs site already has the page to mirror: docs/site/src/pages/agent.tsx.

Your tasks are T-243, T-244 and this repository's half of T-250. Work on a new branch `feat/agent-access`, created off `develop`. The site must stay a static, frontend-only export (`rx.App(enable_state=False)`, `build_local.sh`, served from `public/`).

1. T-243 — `vercel.json`:
   - Add a rewrite `{ "source": "/mcp", "destination": "https://<MCP project>.vercel.app/mcp" }` before the SPA catch-all; in Vercel the first match wins. Ask me for the MCP project's URL. Until then, use `https://silverpoint-mcp.vercel.app/mcp` and say so.
   - Change the catch-all so it no longer captures `/mcp`, `/agent-catalog.json` or `/llms*.txt`: `/((?!mcp|agent-catalog\.json|llms).*)`.
2. T-243 — the agent catalog and the llms files, produced at export by one script called from `build_local.sh`:
   - `/agent-catalog.json`: the catalog shipped inside `@silverpoint/mcp`, at the silverpoint version the site documents. Fetch it from the published package (`https://unpkg.com/@silverpoint/mcp@<version>/agent-catalog.json`, version pinned in one place), commit the copy, and add a test that the pinned version is the one the site documents.
   - `/llms.txt`: the llms.txt index (llmstxt.org). It says what silverpoint is, then links to `/llms-full.txt`, the docs pages, the MCP endpoint and the AI page.
   - `/llms-full.txt`: the catalog as Markdown: every chart and component with its props per framework (React, Vue, Angular, Reflex), the grounds, the palettes and the diagnostics.
   - Generate both files from the catalog only; never retype it. Add tests for both. They are the tests of REQ-564, which silverpoint defers to this repository.
3. T-244 — a "Use with AI" page at `/docs/ai`, with no `rx.State`, linked from the docs navigation. It contains:
   - the MCP URL `https://silverpointweb.vercel.app/mcp`;
   - client configs: Claude Code (`claude mcp add --transport http silverpoint <url>`), Claude (Settings → Connectors → custom connector), Cursor (`mcpServers` with `url`), and VS Code (`.vscode/mcp.json`, `servers` with `type: "http"`);
   - both plugins: `/plugin marketplace add ecrespo/silverpoint` + `/plugin install silverpoint@silverpoint`, and `ecrespo/reflex-silverpoint-react` + `reflex-silverpoint`;
   - the local server (`claude mcp add silverpoint -- npx -y @silverpoint/mcp`);
   - the tool list, read from the catalog or the server's definitions and never retyped (REQ-569's rule).
   The MCP project's `/` already redirects here.
4. T-250 (this repository's half) — record the feature's status in `CLAUDE.md`.

Rules:
- Test-first, and cite the REQ in each test name. Mutation-check any test written after the code.
- Everything in English. Use uv.
- Do not deploy and do not push to `main` without asking me.
- Commits end with the Co-Authored-By line.
- Run the static build and the tests before saying it is done.
- Afterwards, tell me how to verify the deployed site: `curl -I` on `/mcp`, `/agent-catalog.json` and `/llms.txt`, plus silverpoint's smoke test (`pnpm --filter @silverpoint/mcp-smoke smoke https://silverpointweb.vercel.app/mcp`).
````
