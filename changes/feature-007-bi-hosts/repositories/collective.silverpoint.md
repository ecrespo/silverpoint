# Spec pack — `collective.silverpoint`

| Field | Value |
|---|---|
| **Repository** | `github.com/ecrespo/collective.silverpoint` |
| **Published as** | PyPI `collective.silverpoint` |
| **Licence** | GPL-2.0-only (it imports Plone's backend; the convention of Plone backend add-ons) |
| **Description** | Plone Classic UI add-on: silverpoint charts as content and in templates. |
| **Draws with** | PyPI `silverpoint` (MIT), which vendors the standalone file |
| **Wave** | 3 |
| **Ids** | `PLC-REQ-nnn`, `PLC-DD-nn`, `PLC-T-nn` |
| **Status** | `APPROVED` gate-1 pack, 2026-11-20 (user decision); re-read against the released API in T-328 |

## Constitution

H-1..H-8, and:

- **PLC-Art. 1 — A chart is content.** Its table, role mapping, options and appearance are fields
  with workflow, permissions, versioning and search, like any other content.
- **PLC-Art. 2 — Installs and uninstalls cleanly.** GenericSetup profiles for both; uninstalling
  leaves no registry record, resource or type behind.
- **PLC-Art. 3 — Licence boundary.** GPL-2.0 code lives here only. Nothing is copied from this
  repository into an MIT one.

Stack: Cookieplone's backend add-on template; Plone 6.0 and 6.1+ (Classic UI); Python as those
support; `plone.app.testing`; `pytest`.

## Scope

**In:** a *Chart* content type with a Classic UI view, a reusable view for templates, the script as
a registered resource. **Out:** a Volto block (that is `volto-silverpoint`); a TinyMCE plugin; live
external data sources.

## Requirements

| ID | Requirement | Priority |
|---|---|---|
| PLC-REQ-001 | THE ADD-ON SHALL install a Dexterity type *Chart* with fields: chart (a vocabulary from the pinned host catalog, grouped by family), table (a CSV or JSON file, or text), role mapping, options, ground, substrate, mode, palette, and the common view options. | MUST |
| PLC-REQ-002 | THE EDIT FORM SHALL validate the role mapping and options against the chosen chart with the `silverpoint` package, showing its `SpecError` message on the field at fault. | MUST |
| PLC-REQ-003 | THE TYPE'S default view SHALL render a `<silverpoint-chart>` with the spec in a JSON child and, as its fallback content, the title, the description and the data as an HTML table, which the chart replaces when the script runs. | MUST |
| PLC-REQ-004 | THE ADD-ON SHALL register the vendored script from `silverpoint.static_path()` as a resource loaded only on pages that hold a chart. | MUST |
| PLC-REQ-005 | THE ADD-ON SHALL provide a browser view `@@silverpoint-chart` that renders a chart for a *Chart* item's UID or for a spec passed by a template, so that a page template or a portlet embeds one with a single call. | MUST |
| PLC-REQ-006 | THE MARKUP SHALL work under Plone's default Content-Security-Policy settings with no inline script. | MUST |
| PLC-REQ-007 | THE ADD-ON SHALL provide control-panel defaults for ground, substrate, mode and palette, used where a chart sets none. | SHOULD |
| PLC-REQ-008 | THE *Chart* TYPE SHALL be serialised by `plone.restapi` with its spec, so that a Volto site shows it through `volto-silverpoint`. | SHOULD |
| PLC-REQ-009 | THE ADD-ON'S strings SHALL be translatable (`collective.silverpoint` domain), English and Spanish shipped. | MUST |
| PLC-REQ-010 | CI SHALL run install and uninstall tests, a functional test of the view's markup, and a browser test that reads the chart by keyboard on a Classic UI page. | MUST |

## Design decisions

> **As built in `0.11.0` (T-328).** PLC-REQ-006 holds by construction: the script build defines `<silverpoint-chart>` and mounts `[data-sp-embed]` on load, so the view emits no inline script. See [§7 of the README](README.md#7-the-built-api-as-the-packs-meet-it-t-328-2026-11-21).


- **PLC-DD-01 — Depend on `silverpoint`.** Spec building, validation, reshapes and the script all
  come from it (H-1, H-2: the pin is its version in `pyproject.toml`). This add-on adds Plone's
  content model and templates.
- **PLC-DD-02 — The table as the fallback.** A Classic UI page is server-rendered: the data's HTML
  table is honest content for a reader without script and for search, and the custom element
  replaces it. The static chart picture is not available on the server (silverpoint DD-069).
- **PLC-DD-03 — Vocabularies generated at import.** The chart vocabulary and per-chart role and
  option schemas are built from `silverpoint.catalog` when the add-on loads, not written to disk:
  the catalog is already pinned data inside the dependency (H-3 holds without a generated file).

## Tasks

- [ ] **PLC-T-01** Split this pack into `specs/`; `CLAUDE.md`; generate with Cookieplone's backend add-on template. Stop for review. *H-7*
- [ ] **PLC-T-02** The type, its schema and vocabularies. *PLC-REQ-001, PLC-DD-03*
- [ ] **PLC-T-03** Form validation. *PLC-REQ-002*
- [ ] **PLC-T-04** The resource registration and the default view with its fallback table. *PLC-REQ-003, PLC-REQ-004, PLC-REQ-006*
- [ ] **PLC-T-05** `@@silverpoint-chart`. *PLC-REQ-005*
- [ ] **PLC-T-06** Control panel; REST serialisation. *PLC-REQ-007, PLC-REQ-008*
- [ ] **PLC-T-07** i18n (en, es). *PLC-REQ-009*
- [ ] **PLC-T-08** Install/uninstall, functional and browser tests. *PLC-REQ-010, PLC-Art. 2, H-5*
- [ ] **PLC-T-09** README; release `0.1.0` on PyPI by Trusted Publishing.

## Open questions

- **PLC-OQ-1** Whether to move the repository to the `collective` GitHub organisation after the
  first release, as the name suggests.
- **PLC-OQ-2** A Mosaic tile: only if asked for.

## Bootstrap prompt

````text
This repository will publish `collective.silverpoint`, a Plone Classic UI add-on that draws silverpoint charts through the `silverpoint` Python package. It is GPL-2.0-only. Its design is in specs/spec-pack.md, written in the silverpoint repository (~/WebstormProjects/silverpoint/changes/feature-007-bi-hosts). Read the pack, that folder's README.md and repositories/README.md §3, and the silverpoint-python pack beside it.

Do PLC-T-01 only: split the pack into specs/ without changing its content, write CLAUDE.md, generate the add-on with Cookieplone's backend add-on template and make its tests pass untouched. Show me the tree and the test output, then stop.
````
