# Spec pack — `silverpoint-knime`

| Field | Value |
|---|---|
| **Repository** | `github.com/ecrespo/silverpoint-knime` |
| **Published as** | A zipped KNIME update site on GitHub Releases; KNIME Community Hub later |
| **Licence** | MIT — to confirm against the Hub's publication terms (KN-OQ-1) |
| **Description** | KNIME Analytics Platform extension: view nodes that draw silverpoint charts from a table. |
| **Draws with** | PyPI `silverpoint` (which vendors the standalone file) |
| **Wave** | 3 |
| **Ids** | `KN-REQ-nnn`, `KN-DD-nn`, `KN-T-nn` |
| **Status** | `APPROVED` gate-1 pack, 2026-11-20 (user decision); re-read against the released API in T-328 |

## Constitution

H-1..H-8, and:

- **KN-Art. 1 — The extension is glue.** Node code SHALL read the table and the dialog, call the
  `silverpoint` Python package and return its output. Binding, reshaping and markup are the
  package's.
- **KN-Art. 2 — Works offline.** The bundled environment SHALL hold everything the nodes need; a
  node SHALL make no network call at execution.

Stack: KNIME's pure-Python extension template; `knime-extension` for the supported Analytics
Platform versions; pixi; `pytest`.

## Scope

**In:** view nodes with a table input, a self-contained HTML view, an optional SVG image output.
**Out:** JavaScript-view nodes written against KNIME's UI extension framework; interactive selection
events back into the workflow; components for Data Apps beyond what a view gives for free.

## Requirements

| ID | Requirement | Priority |
|---|---|---|
| KN-REQ-001 | THE EXTENSION SHALL provide one view node per chart of the pinned host catalog whose `binding` is not `none`, named *Silverpoint <Title>*, in a *Silverpoint* category with one sub-category per family, each node generated from the catalog. | MUST |
| KN-REQ-002 | EACH NODE'S dialog SHALL have one column selector per role —filtered by the role's data type, required roles without a "none" choice—, the chart's options, the common view options and the appearance. | MUST |
| KN-REQ-003 | WHEN executed, THE NODE SHALL build the chart with `silverpoint` from the selected columns and return its self-contained HTML document as the node's view. | MUST |
| KN-REQ-004 | IF the table is empty, a required column is unset or binding fails, THEN THE NODE SHALL fail configuration or execution with the package's `SpecError` message. | MUST |
| KN-REQ-005 | IF the table has more rows than the node's *Row limit* (default 10,000), THEN THE NODE SHALL draw the first rows up to the limit and set a node warning with both counts. | MUST |
| KN-REQ-006 | WHERE a Node.js runtime is configured in the extension's preferences or found on `PATH`, THE NODE SHALL also fill an image output port with the chart's SVG, making the view report-ready; otherwise the port SHALL be inactive and the node description SHALL say why. | MUST |
| KN-REQ-007 | THE NODE SHALL expose ground, mode and palette as flow-variable-controllable settings. | SHOULD |
| KN-REQ-008 | THE EXTENSION SHALL ship an example workflow using three nodes on a bundled dataset. | MUST |
| KN-REQ-009 | CI SHALL run the `silverpoint` package's conformance check inside the extension's bundled environment, and execute each generated node's `configure` and `execute` against its demo table. | MUST |

## Design decisions

- **KN-DD-01 — One node per chart, generated.** KNIME's own views are one node per chart, and a
  static dialog with a column selector per role is what users expect. A single node with a chart
  picker would need a dialog that reshapes itself. `scripts/make_nodes.py` writes the node modules
  from the host catalog (H-3). *PoC first (KN-T-02), with three nodes by hand, to confirm that some
  sixty generated nodes load acceptably; the fallback is one node per family.*
- **KN-DD-02 — HTML view always, SVG when possible.** silverpoint DD-069: an SVG needs a JavaScript
  runtime. The view never does.
- **KN-DD-03 — Depend on `silverpoint`, do not vendor again.** The pin (H-2) is the `silverpoint`
  version in `pixi.toml`; the engine arrives inside it.

## Tasks

- [ ] **KN-T-01** Split this pack into `specs/`; `CLAUDE.md`; create from KNIME's Python extension template. Stop for review. *H-7*
- [ ] **KN-T-02** PoC: three hand-written nodes in a local Analytics Platform — the HTML view renders and reads by keyboard, the dialog's column filters, load time, the image port with and without Node. Record the supported platform versions and the view API used. `specs/poc.md`. *KN-DD-01, KN-DD-02*
- [ ] **KN-T-03** `scripts/make_nodes.py` and `--check`. *KN-REQ-001, KN-REQ-002, H-3*
- [ ] **KN-T-04** Execution: table → `silverpoint` → view; errors; the row limit. *KN-REQ-003, KN-REQ-004, KN-REQ-005*
- [ ] **KN-T-05** The image port and the runtime preference. *KN-REQ-006*
- [ ] **KN-T-06** Flow variables; the example workflow. *KN-REQ-007, KN-REQ-008*
- [ ] **KN-T-07** CI: the bundled environment, the conformance check, every node against its demo. *KN-REQ-009, H-4*
- [ ] **KN-T-08** Bundle the update site; README; release `0.1.0`; read the Community Hub's requirements and decide on publication. *KN-OQ-1*

## Open questions

- **KN-OQ-1** Community Hub: licence and review requirements for a community extension.
- **KN-OQ-2** Whether the HTML view is shown in KNIME Data Apps on Business Hub as it is locally.

## Bootstrap prompt

````text
This repository will ship a KNIME Analytics Platform extension whose nodes draw silverpoint charts through the `silverpoint` Python package. Its design is in specs/spec-pack.md, written in the silverpoint repository (~/WebstormProjects/silverpoint/changes/feature-007-bi-hosts). Read the pack, that folder's README.md and repositories/README.md §3, the silverpoint-python pack beside it, and KNIME's guide to pure-Python node extensions.

Do KN-T-01 only: split the pack into specs/ without changing its content, write CLAUDE.md, and create the extension from KNIME's template with its example node untouched. Show me the tree and knime.yml, then stop. KN-T-02 is a PoC I run with you in KNIME.
````
