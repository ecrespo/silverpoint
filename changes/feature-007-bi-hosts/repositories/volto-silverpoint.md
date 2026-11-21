# Spec pack — `volto-silverpoint`

| Field | Value |
|---|---|
| **Repository** | `github.com/ecrespo/volto-silverpoint` |
| **Published as** | npm `volto-silverpoint` |
| **Licence** | MIT (Volto's) |
| **Description** | Plone Volto add-on: a block that draws silverpoint charts. |
| **Draws with** | `@silverpoint/react` (a dependency), `@silverpoint/embed/hosts` for the binding |
| **Wave** | 0 (PoC on `@silverpoint/react` 0.10), then 1 |
| **Ids** | `VOL-REQ-nnn`, `VOL-DD-nn`, `VOL-T-nn` |
| **Status** | `APPROVED` gate-1 pack, 2026-11-20 (user decision); re-read against the released API in T-328 |

## Constitution

H-1..H-8, and:

- **VOL-Art. 1 — A block's data is a chart spec and its table.** What the editor saves is JSON a
  later version can read: the chart's slug, the table, the role mapping, options and appearance.
  No rendered markup is stored.
- **VOL-Art. 2 — Server and client agree.** THE BLOCK SHALL render on Volto's server and hydrate
  without a mismatch warning.

Stack: Cookieplone `frontend_addon`; Volto 18 and 19; pnpm; Vitest; Cypress acceptance tests as the
template provides.

## Scope

**In:** a *Silverpoint chart* block with a table pasted or uploaded as CSV or JSON, or read from a
File content item. **Out:** live queries to external data; the dashboard and UI components as blocks
(later blocks, later specs); Classic UI (that is `collective.silverpoint`).

## Requirements

| ID | Requirement | Priority |
|---|---|---|
| VOL-REQ-001 | THE ADD-ON SHALL register a block `silverpointChart`, titled *Silverpoint chart*, in the *Common* group, restricted to no content type. | MUST |
| VOL-REQ-002 | THE BLOCK'S sidebar SHALL offer the chart (grouped by family), then one column selector per role of the chosen chart filled from the table's columns, the chart's options, the appearance and the common view options (title, description, data table), all generated from the pinned host catalog. | MUST |
| VOL-REQ-003 | THE BLOCK SHALL take its table from text pasted as CSV or JSON, from an uploaded file, or from a File content item chosen with Volto's object browser and fetched when the block renders. | MUST |
| VOL-REQ-004 | WHEN a table is given, THE EDITOR SHALL preselect roles whose `kind` and `dataType` match exactly one unassigned column. | SHOULD |
| VOL-REQ-005 | THE VIEW SHALL bind with `specFromTable` and render the chart's `@silverpoint/react` component, loaded lazily by slug, inside the block's width. | MUST |
| VOL-REQ-006 | THE BLOCK SHALL render on the server and hydrate with no mismatch, verified in an acceptance test that reads the server's HTML and the browser's console. | MUST |
| VOL-REQ-007 | IF the table is missing, unreadable or does not bind, THEN the editor SHALL show the `SpecError`'s message in the block, and the public view SHALL show nothing but the block's title and description. | MUST |
| VOL-REQ-008 | THE ADD-ON SHALL load the library's stylesheet and fonts from its own configuration, with no change to the project's theme. | MUST |
| VOL-REQ-009 | THE SIDEBAR'S labels SHALL be translatable through Volto's i18n, with English and Spanish shipped. | MUST |
| VOL-REQ-010 | THE BLOCK SHALL be listed by `plone.restapi`'s block serialisation unchanged, so that a search index or `collective.silverpoint` can read its spec. | MUST |
| VOL-REQ-011 | CI SHALL run the conformance kit through the module entry the add-on resolves, and an axe pass over a page with the block. | MUST |

## Design decisions

- **VOL-DD-01 — The schema is generated.** `scripts/make-schema.ts` writes the block's schema
  fragments per chart from the host catalog (H-3); the block's schema enhancer picks the fragment of
  the chosen chart.
- **VOL-DD-02 — The table is stored in the block, capped.** Pasted and uploaded tables are stored
  as rows in block data up to 2,000 rows; beyond that the editor asks for a File item, which is
  referenced, not copied. Keeps content objects small and the block self-contained for small data.
- **VOL-DD-03 — React components.** As Superset's SUP-DD-04.
- **VOL-DD-04 — No backend package.** A block needs none. A backend add-on only appears if a chart
  becomes a content type, which is `collective.silverpoint`'s subject.

## Tasks

- [ ] **VOL-T-01** Split this pack into `specs/`; `CLAUDE.md`; generate with `cookieplone frontend_addon`. Stop for review. *H-7*
- [ ] **VOL-T-02** PoC, on `@silverpoint/react` 0.10 and by hand: one chart in a block, server-rendered and hydrated; the stylesheet and font loading that works in Volto 18 and 19. `specs/poc.md`. *VOL-REQ-006, VOL-REQ-008*
- [ ] **VOL-T-03** `scripts/make-schema.ts` and `--check`. *VOL-REQ-002, H-3*
- [ ] **VOL-T-04** Table sources: paste, upload, File item; the cap. *VOL-REQ-003, VOL-DD-02*
- [ ] **VOL-T-05** Edit component, role preselection, errors. *VOL-REQ-001, VOL-REQ-004, VOL-REQ-007*
- [ ] **VOL-T-06** View component, lazy charts, sizing. *VOL-REQ-005*
- [ ] **VOL-T-07** i18n (en, es), keyed on the host catalog's stable ids (silverpoint OQ-H4: hosts translate); a test fails when a key of the pinned catalog has no `en` or `es` entry. *VOL-REQ-009*
- [ ] **VOL-T-08** Acceptance tests: SSR and hydration, keyboard, axe; the kit. *VOL-REQ-006, VOL-REQ-010, VOL-REQ-011, H-4, H-5*
- [ ] **VOL-T-09** README; release `0.1.0` with provenance.

## Open questions

- **VOL-OQ-1** Volto 19's design-system work: does the block need a variant for the new block
  model? Check at VOL-T-02.

## Bootstrap prompt

````text
This repository will publish `volto-silverpoint`, a Plone Volto add-on with a block that draws silverpoint charts using @silverpoint/react. Its design is in specs/spec-pack.md, written in the silverpoint repository (~/WebstormProjects/silverpoint/changes/feature-007-bi-hosts). Read the pack, that folder's README.md and repositories/README.md §3, and Plone's "Create an add-on for Volto 18 and 19".

Do VOL-T-01 only: split the pack into specs/ without changing its content, write CLAUDE.md, generate the add-on with `cookieplone frontend_addon` and make its tests pass untouched. Show me the tree and the test output, then stop.
````
