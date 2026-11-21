# Spec pack — `silverpoint-tableau`

| Field | Value |
|---|---|
| **Repository** | `github.com/ecrespo/silverpoint-tableau` |
| **Published as** | One `.trex` per chart on GitHub Releases; the extension's page on GitHub Pages (silverpoint D5) |
| **Licence** | MIT |
| **Description** | Tableau viz extensions that draw silverpoint charts on a worksheet. |
| **Draws with** | `silverpoint-embed.full.js`, served from the extension's own origin |
| **Wave** | 2 |
| **Ids** | `TAB-REQ-nnn`, `TAB-DD-nn`, `TAB-T-nn` |
| **Status** | `APPROVED` gate-1 pack, 2026-11-20 (user decision); re-read against the released API in T-328 |

## Constitution

H-1..H-8, and:

- **TAB-Art. 1 — Sandbox-ready.** THE PAGE SHALL request nothing but its own origin's files and the
  Tableau Extensions API library it ships, so that it could run in a sandboxed host unchanged. It
  SHALL send worksheet data nowhere.
- **TAB-Art. 2 — A released URL never changes.** Each release is served under its own path
  (`/v0.1/`); a `.trex` in someone's workbook keeps working after the next release.

Stack: TypeScript; Vite (a static multi-file build); the Extensions API library, vendored; Vitest;
Playwright against a mock of the Extensions API.

## Scope

**In:** viz extensions on the Marks card, one manifest per chart, a configuration dialog for options
and appearance. **Out:** dashboard extensions; Tableau Exchange listing; a sandboxed-host deployment
(possible by TAB-Art. 1, not pursued).

## Requirements

| ID | Requirement | Priority |
|---|---|---|
| TAB-REQ-001 | THE REPOSITORY SHALL generate one `.trex` manifest per chart of the pinned host catalog whose `binding` is not `none`: a `<worksheet-extension>` with its own id (`to.seraph.silverpoint.<slug>`), the release's page URL with `?chart=<slug>`, and one `<encoding>` per role with its display name, data type, role type and field count. | MUST |
| TAB-REQ-002 | THE PAGE SHALL read the chart from its URL, the fields on each encoding from the worksheet's visual specification, and the worksheet's summary data, bind them with `specFromTable` and draw with the embed client. | MUST |
| TAB-REQ-003 | WHEN the worksheet's summary data or encodings change, THE PAGE SHALL redraw in place. | MUST |
| TAB-REQ-004 | IF a required encoding is empty, THEN THE PAGE SHALL show which tiles to fill, by their display names. | MUST |
| TAB-REQ-005 | THE EXTENSION SHALL offer a configuration dialog with the chart's options, the common view options and the appearance, generated from the host catalog, and SHALL save them in the extension's settings with the workbook. | MUST |
| TAB-REQ-006 | THE CHART SHALL fill the worksheet's viz area and redraw when it is resized. | MUST |
| TAB-REQ-007 | WHEN an item is chosen in a chart with a single dimension encoding, THE EXTENSION SHOULD select the matching marks in the worksheet. | SHOULD |
| TAB-REQ-008 | THE MANIFESTS SHALL request the least permission that lets the page read summary data, and the README SHALL tell an administrator the exact URL to allow. | MUST |
| TAB-REQ-009 | EACH RELEASE SHALL be deployed under a versioned path, and its `.trex` files attached to the GitHub release. | MUST |
| TAB-REQ-010 | CI SHALL run the conformance kit in a browser against the deployed build's script, a keyboard test against the mock, and a check that the page's request log holds only its own origin. | MUST |

## Design decisions

- **TAB-DD-01 — One manifest per chart, one page.** A viz extension's Marks-card tiles are fixed by
  its manifest, and Tableau's own viz extensions are one chart each. Generating a `.trex` per chart
  gives every chart its exact tiles; they all open the same hosted page (H-3:
  `scripts/make-trex.ts`).
- **TAB-DD-02 — Network-enabled on GitHub Pages.** The simplest host that satisfies HTTPS. An
  administrator must allow the URL on Tableau Server or Cloud: a documented cost of D5.
- **TAB-DD-03 — The API calls are verified first.** This pack names behaviours, not methods: the
  exact Extensions API calls for reading encodings and summary data, and the minimum API version
  for viz extensions, are fixed by TAB-T-02 against the current Extensions API documentation and
  recorded in the technical design before any manifest is generated.

## Tasks

- [ ] **TAB-T-01** Split this pack into `specs/`; `CLAUDE.md`; Vite project; Pages workflow to a versioned path. Stop for review. *H-7, TAB-Art. 2*
- [ ] **TAB-T-02** PoC in Tableau Desktop with a hand-written `.trex` for `bar-chart`: reading encodings and summary data, resize, settings; record API names, minimum API version and permission. `specs/poc.md`. *TAB-DD-03*
- [ ] **TAB-T-03** `scripts/make-trex.ts` and `--check`. *TAB-REQ-001, TAB-REQ-008, H-3*
- [ ] **TAB-T-04** The page: read, bind, draw, redraw, empty encodings. *TAB-REQ-002, TAB-REQ-003, TAB-REQ-004, TAB-REQ-006*
- [ ] **TAB-T-05** The configuration dialog and settings. *TAB-REQ-005*
- [ ] **TAB-T-06** Mark selection. *TAB-REQ-007*
- [ ] **TAB-T-07** The mock of the Extensions API, keyboard and request-log tests, the kit. *TAB-REQ-010, H-4, H-5, TAB-Art. 1*
- [ ] **TAB-T-08** README for authors and administrators; release `0.1.0`. *TAB-REQ-009*

## Open questions

- **TAB-OQ-1** The extension id's reverse-domain prefix: `to.seraph.silverpoint` or another.
- **TAB-OQ-2** Whether Tableau Public allows a network-enabled viz extension from an arbitrary origin.

## Bootstrap prompt

````text
This repository will ship Tableau viz extensions that draw silverpoint charts with the silverpoint-embed standalone file. Its design is in specs/spec-pack.md, written in the silverpoint repository (~/WebstormProjects/silverpoint/changes/feature-007-bi-hosts). Read the pack, that folder's README.md, api-delta.md and repositories/README.md §3, and Tableau's viz-extension manifest documentation.

Do TAB-T-01 only: split the pack into specs/ without changing its content, write CLAUDE.md, create the Vite project and a GitHub Pages workflow that deploys to a versioned path. Show me the tree and the workflow file, then stop. TAB-T-02 is a PoC I run with you in Tableau Desktop.
````
