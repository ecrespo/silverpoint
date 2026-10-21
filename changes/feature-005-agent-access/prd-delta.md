# PRD delta — agent access: the agent catalog, the MCP server and the skills

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 1, drafted and approved 2026-10-20; **folded into `specs/prd.md` (v1.14) on 2026-10-20** (T-251) |
| **Amends** | [PRD](../../specs/prd.md) v1.13 → v1.14: §1, §3 (Persona 5), §4.1, §5.1, §5.2, §5.3, new §6.14, §7, §9 (Epic I), §11 |
| **Applicable Constitution** | [`constitution.md`](../../specs/constitution.md) v1.9, with the v1.10 amendment proposed in [`constitution-amendment.md`](constitution-amendment.md) |
| **Research** | [`research.md`](research.md) |
| **Size** | Complex feature (≥ 3 sprints, three repositories): PRD + API + TD + Data Model + Plan + Tasks + Analyze (Art. 9) |

## 1. Summary

silverpoint is newer than every language model's training data, so agents write it badly or not at
all. This feature gives agents the facts, generated from the published types so they cannot drift:
an **agent catalog** (one JSON document describing every chart, component, ground, palette and
diagnostic in React, Vue, Angular and Reflex terms); an **MCP server**, `@silverpoint/mcp`, that
serves it as tools and resources, recommends a chart, generates code, validates props with the
core's own diagnostics and returns the canonical render of a chart; and **two skills**,
`silverpoint` (here) and `reflex-silverpoint` (in `reflex-silverpoint-react`), that teach the
judgement the catalog cannot: which chart, which ground, the idioms and the pitfalls. The official
site gains `/llms.txt` and reaches the server at `/mcp`, and stays a static site.

## 2. Problem

| Today | Cost |
|---|---|
| No model knows silverpoint | Agents invent props and imports; users blame the library |
| The props reference exists only as a web page | An agent cannot query it; it reads HTML, if it finds it |
| Nothing can tell an agent whether its props are valid | Errors surface in the user's browser console, after the fact |
| An agent cannot see what it drew | It cannot iterate on a chart; the user has to |
| The Reflex wrapper is one more step removed | Python users get the least help, and the wrapper drifted a version behind (fixed in 0.7.1, research §3) |

## 3. Scope changes

### §5.1 In Scope — add

- [ ] The agent catalog, generated from the types, the catalogs, the demos and one metadata file (§6.14.1).
- [ ] `@silverpoint/mcp`: an MCP server over stdio and Streamable HTTP (§6.14.2).
- [ ] The `silverpoint` and `reflex-silverpoint` skills and their Claude plugin manifests (§6.14.3).
- [ ] Hosting at the official site's `/mcp`, and `/llms.txt` (§6.14.4).

### §5.2 Out of Scope — add

- An LLM inside the server. Every tool is deterministic (Art. 4); the agent is the client's.
- Writing to the user's files or project, running user code, fetching URLs. The server is read-only.
- Authentication, accounts, quotas per user. The server is public and stateless.
- Skills or servers for frameworks the constitution does not support (Svelte, Solid…).
- A hosted playground UI. The site's playground is a separate concern.

### §5.3 Future Considerations — add

- Render a whole dashboard (`render_dashboard`) once the dashboard has a headless pipeline as charts do.
- MCP Apps / interactive UI resources, when the clients converge.
- A Vue/Angular-specific skill split if the shared skill grows past its size budget.

## 4. Personas served

- **Persona 5 — new — agent-assisted developer.** Works in Claude Code, Cursor, VS Code or Claude
  with an assistant writing much of the code. Needs the assistant to produce silverpoint code that
  compiles and draws the right chart the first time, in their framework, Python/Reflex included.
- **Persona 1** (data product developer): asks "which chart for this data?" and gets a reasoned
  answer and a rendered preview before writing a line.
- **Persona 2** (multi-framework architect): one catalog that answers in React, Vue, Angular and
  Reflex terms identically.
- **Persona 4** (precision or accessibility needs): generated code carries labels, `description`,
  `data_table` and accessible triggers by default.

## 6.14 Agent access

The agent catalog is the single source; the server and the skills are views of it. A tool or a
skill never states a prop, a default or a name the catalog does not hold.

#### 6.14.1 The agent catalog

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-530 | ubiquitous | THE SYSTEM SHALL generate one agent catalog (`agent-catalog.json`, Data Model §2.28) from the published types (the props pipeline of REQ-332), the chart catalog, `UI_COMPONENTS`, the demos and one metadata file; no prop, type or default SHALL be typed by hand. | MUST |
| REQ-531 | ubiquitous | The catalog SHALL describe each of the 60 charts with its names and import paths in React, Vue, Angular and Reflex, its family, a one-line summary, the data shape it reads, the intents it serves, its own props (name, type, optional, default, doc) and a reference to its demo dataset. | MUST |
| REQ-532 | ubiquitous | The catalog SHALL describe each of the 38 UI components with its names and import paths per framework, its family and group, its props, its value and open bindings per framework, its events and its slots. | MUST |
| REQ-533 | ubiquitous | The catalog SHALL describe the props every chart and every component shares, the dashboard and its layout, the grounds and substrates, the six palette presets and the palette fields, the timeline and its optional peer, and the 25 diagnostic codes with their requirement, condition and remedy. | MUST |
| REQ-534 | ubiquitous | The catalog SHALL carry the library version it describes and, for Reflex, the `reflex-silverpoint-react` version and the silverpoint version that release wraps. | MUST |
| REQ-535 | event | WHEN a public type, a catalog row, a demo or the metadata file changes, CI SHALL regenerate the catalog and fail if the committed one differs. | MUST |
| REQ-536 | unwanted | IF a chart or component exported by an adapter is missing from the catalog, or the catalog names one no adapter exports, or a chart lacks family, summary, data shape or an intent, THEN CI SHALL fail. | MUST |
| REQ-537 | ubiquitous | The catalog SHALL ship inside `@silverpoint/mcp` and be published by the official site at `/agent-catalog.json`. | MUST |

#### 6.14.2 The MCP server

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-538 | ubiquitous | `@silverpoint/mcp` SHALL expose an MCP server over stdio (an executable, `silverpoint-mcp`) and over stateless Streamable HTTP (a request handler), with the same tools and resources on both. | MUST |
| REQ-539 | ubiquitous | The server SHALL provide the tools of API delta §3 —`get_version`, `list_charts`, `get_chart`, `list_components`, `get_component`, `recommend_chart`, `generate_code`, `validate_props`, `render_chart`, `check_palette`, `search_catalog`— each with a JSON Schema input and a structured output. | MUST |
| REQ-540 | event | WHEN `recommend_chart` receives a data shape and an intent, THE SYSTEM SHALL return at most five charts ranked by the rules of Data Model §2.31, each with its reasons, identically for identical input (Art. 4). | MUST |
| REQ-541 | event | WHEN `generate_code` receives a chart or component, a framework (`react`, `vue`, `angular`, `reflex`) and optional field names and props, THE SYSTEM SHALL return the imports, the stylesheet imports and the code, using only names, paths and props the catalog holds, with the user's field names as accessors. | MUST |
| REQ-542 | event | WHEN `validate_props` receives a chart and props, THE SYSTEM SHALL build the chart with the core and return every diagnostic raised (code, severity, requirement, message, remedy) and every prop the chart does not declare. | MUST |
| REQ-543 | event | WHEN `render_chart` receives a chart, props, a size and an id, THE SYSTEM SHALL return a standalone SVG whose parsed tree, with the inlined stylesheet set aside, is identical to the canonical render of the same chart, props, size and id (Art. 3). | MUST |
| REQ-544 | optional | WHERE the client asks for `format: "png"`, THE SYSTEM SHOULD return the render rasterised as an MCP image, for clients that cannot display SVG. | SHOULD |
| REQ-545 | event | WHEN `check_palette` receives a palette, THE SYSTEM SHALL return the findings of the core's `checkPalette` for it (REQ-465). | MUST |
| REQ-546 | ubiquitous | The server SHALL provide the resources of API delta §4: the whole catalog, one per chart and per component, the guides of the `silverpoint` skill, and the diagnostic codes. | MUST |
| REQ-547 | unwanted | IF a code pattern is not run by an example app (REQ-520) —today, an `SpButton` as an overlay's `trigger` (delta-014)— THEN `generate_code` and the skills SHALL NOT emit it. | MUST |
| REQ-548 | optional | WHERE the client supports prompts, THE SYSTEM SHOULD offer `choose-chart` and `build-dashboard` prompts that sequence the tools. | SHOULD |
| REQ-549 | unwanted | IF a tool receives an unknown chart, component, framework, ground, substrate or palette, THEN it SHALL return a tool error naming the closest valid names, never an exception or an empty result. | MUST |
| REQ-550 | ubiquitous | Every tool result SHALL carry the library version it was computed with, which SHALL be the version of the catalog the server ships. | MUST |
| REQ-551 | unwanted | IF a request would make the server write a file, open a network connection, read the environment beyond its configuration or evaluate code from the request, THEN the server SHALL refuse it: the server has no such capability. | MUST |

#### 6.14.3 The skills

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-552 | ubiquitous | This repository SHALL provide the `silverpoint` skill (`skills/silverpoint/`), written in English: a `SKILL.md` and references for choosing a chart, the charts by family, the components, grounds and palettes, the dashboard, the timeline, and React, Vue and Angular usage, its props tables generated from the catalog. | MUST |
| REQ-553 | ubiquitous | `reflex-silverpoint-react` SHALL provide the `reflex-silverpoint` skill, written in English, generated from its own catalog export (DD-049): builders, state-driven props and events, the provider and palettes, composed components and overlays, the timeline, and the demo app's patterns. | MUST |
| REQ-554 | ubiquitous | Each skill SHALL name the version it describes, SHALL tell the agent to prefer the MCP tools when they are connected, and SHALL keep its `SKILL.md` under 500 lines with the rest in references loaded on demand. | MUST |
| REQ-555 | ubiquitous | Each repository SHALL publish a Claude plugin manifest that installs its skill and the hosted MCP server. | MUST |
| REQ-556 | unwanted | IF the Reflex catalog wraps a silverpoint version other than the one the agent catalog describes, THEN the catalog build SHALL mark every Reflex entry `stale` with the version it wraps, and a release build SHALL fail. | MUST |
| REQ-557 | ubiquitous | CI SHALL extract every code example of both skills and the code of `generate_code`'s golden tests, and type-check them (React, Vue and Angular with the example apps' compilers; Reflex by importing and rendering the components). | MUST |

#### 6.14.4 Hosting and the official site

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-558 | ubiquitous | The HTTP server SHALL run as a serverless function and be reachable at the official site's `/mcp`; the site SHALL stay a static, frontend-only export. | MUST |
| REQ-559 | ubiquitous | A cold start SHALL answer within 1.5 s and `render_chart` of a demo dataset within 300 ms at p95. | MUST |
| REQ-560 | unwanted | IF a request body exceeds 256 KB, a dataset 5,000 rows, a string 1,000 characters, or a render the path budget (`PATH_BYTE_BUDGET`), THEN the server SHALL reject it with a tool error before computing. | MUST |
| REQ-561 | optional | WHERE the deployment provides a shared store, THE SYSTEM SHOULD limit each client address to 60 tool calls per minute. | SHOULD |
| REQ-562 | ubiquitous | The server SHALL keep no state between requests and SHALL NOT log request bodies; it MAY count calls per tool. | MUST |
| REQ-563 | ubiquitous | Tool descriptions and results SHALL be data from this repository's catalog only, and SHALL NOT carry instructions to the agent beyond the tools' own documentation. | MUST |
| REQ-564 | ubiquitous | The official site SHALL publish `/llms.txt` and `/llms-full.txt`, generated from the agent catalog at export. | MUST |
| REQ-565 | ubiquitous | The official site SHALL have a "Use with AI" page: the MCP URL, configuration for the common clients, how to install each skill, and the local `npx @silverpoint/mcp` alternative. | MUST |

#### 6.14.5 Quality

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-566 | ubiquitous | Every tool SHALL have contract tests: its input schema, its errors (REQ-549) and golden outputs. | MUST |
| REQ-567 | ubiquitous | CI SHALL run `render_chart` over every chart fixture of the PR matrix and compare each result to its canonical render as REQ-543 states. | MUST |
| REQ-568 | ubiquitous | CI SHALL start the built HTTP handler and run an MCP client smoke test: initialise, list tools and resources, call every tool once. | MUST |
| REQ-569 | ubiquitous | `@silverpoint/mcp` SHALL have a README and the documentation site a page for agent access, generated where they list tools from the server's own definitions. | MUST |

**Count:** §6.14 holds 40 requirements (37 MUST, 3 SHOULD). With the rest of §6 the PRD has 310
requirements (287 MUST).

## 7. Non-functional — add

- **Performance:** REQ-559. The catalog is loaded once per instance (≤ 1 MB).
- **Security:** REQ-551, REQ-560..563. No secrets in the package; the deployment needs none.
- **Compatibility:** MCP protocol version as pinned in the Technical Design; clients tested: Claude
  Code, Claude (connector), MCP Inspector.

## 9. Epic I — agent access

| Story | Requirements |
|---|---|
| I-1 As Persona 5, my assistant knows every chart and component, in my framework | REQ-530..537, REQ-552, REQ-553 |
| I-2 As Persona 1, I ask which chart fits and see it drawn before coding | REQ-540, REQ-543, REQ-544 |
| I-3 As Persona 5, generated code compiles and validates | REQ-541, REQ-542, REQ-547, REQ-557 |
| I-4 As a Reflex user, the assistant writes idiomatic `reflex-silverpoint-react` | REQ-553, REQ-556 |
| I-5 As maintainer, nothing drifts and the endpoint is safe | REQ-535, REQ-536, REQ-551, REQ-560..563, REQ-566..568 |

## 11. Glossary — add

- **Agent catalog** — `agent-catalog.json`, the generated description of the public API for agents.
- **Skill** — a folder of instructions (`SKILL.md` + references) an agent loads on demand.
- **MCP** — Model Context Protocol: tools and resources a client agent can call.
