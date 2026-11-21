# Spec pack — `n8n-nodes-silverpoint`

| Field | Value |
|---|---|
| **Repository** | `github.com/ecrespo/n8n-nodes-silverpoint` |
| **Published as** | npm `n8n-nodes-silverpoint`, keyword `n8n-community-node-package` |
| **Licence** | MIT (required of verified nodes) |
| **Description** | n8n community node that draws silverpoint charts from workflow items, as SVG or HTML. |
| **Draws with** | `@silverpoint/embed`'s DOM-free entry, bundled into `dist` at build time |
| **Wave** | 1 |
| **Ids** | `N8N-REQ-nnn`, `N8N-DD-nn`, `N8N-T-nn` |
| **Status** | `APPROVED` gate-1 pack, 2026-11-20 (user decision); re-read against the released API in T-328 |

## Constitution

H-1..H-8, and:

- **N8N-Art. 1 — Zero run-time dependencies.** `package.json` SHALL declare no `dependencies`. The
  engine is a `devDependency` bundled by the build; `n8n-workflow` is a peer.
- **N8N-Art. 2 — A pure function of its input.** THE NODE SHALL read only its input items and
  parameters, call no service, need no credential and write nothing but its output items.
- **N8N-Art. 3 — Verified-node rules from the first release.** Scaffolded and linted with
  `@n8n/node-cli`; published only from GitHub Actions with a provenance statement.

Stack: TypeScript; `@n8n/node-cli`; esbuild for the engine bundle; Vitest; Node as n8n requires.

## Scope

**In:** one node, *Silverpoint Chart*; output as SVG, static HTML or interactive HTML; binary and
JSON output. **Out:** a trigger; credentials; PNG (needs a rasteriser, a run-time dependency);
sending the chart anywhere (that is the next node's job).

## Requirements

| ID | Requirement | Priority |
|---|---|---|
| N8N-REQ-001 | THE NODE SHALL offer a *Chart* parameter listing every chart of the pinned host catalog whose `binding` is not `none`, grouped by family, each with its `summary` as description. | MUST |
| N8N-REQ-002 | WHEN a chart is chosen, THE NODE SHALL show one field-name parameter per role of that chart —required roles marked— and the chart's options as typed parameters, all generated from the host catalog. | MUST |
| N8N-REQ-003 | THE NODE SHALL take as the chart's table either all input items' JSON (*Rows from items*) or an array at a field of each item (*Rows from a field*, one chart per item). | MUST |
| N8N-REQ-004 | THE NODE SHALL offer *Appearance* parameters —ground, substrate (filtered by ground), mode, palette— and *Size* (width, height), from the host catalog. | MUST |
| N8N-REQ-005 | WHEN *Output* is `SVG`, THE NODE SHALL return `renderToSVG`'s result as a binary property (`image/svg+xml`, file name from the chart's id) and, WHERE *Also as text* is set, in a JSON field. *Embed fonts* SHALL map to `embedFonts`. | MUST |
| N8N-REQ-006 | WHEN *Output* is `HTML`, THE NODE SHALL return `renderToHTML`'s static document; WHEN `Interactive HTML`, the interactive document with the standalone script inlined. | MUST |
| N8N-REQ-007 | IF binding or rendering fails, THEN THE NODE SHALL throw a `NodeOperationError` whose message is the `SpecError`'s —naming missing roles, unknown columns or the unknown prop— with the item index, and SHALL honour *Continue On Fail* by emitting the error as the item's JSON. | MUST |
| N8N-REQ-008 | THE NODE SHALL emit every warning diagnostic of a render in the item's JSON under `diagnostics`. | MUST |
| N8N-REQ-009 | THE NODE SHALL be usable as an AI-agent tool (`usableAsTool`), its description telling a model to pass rows and role fields. | SHOULD |
| N8N-REQ-010 | THE PUBLISHED PACKAGE SHALL pass `@n8n/node-cli`'s lint and the community-package scanner, and SHALL contain no `require` of a module outside itself and `n8n-workflow`. | MUST |
| N8N-REQ-011 | CI SHALL run the conformance kit against the bundled engine as loaded from `dist`. | MUST |

## Design decisions

- **N8N-DD-01 — Bundle, do not depend.** esbuild inlines `@silverpoint/embed` (main, `/hosts`,
  `/conformance`) into one CommonJS file under `dist/`. For *Interactive HTML* the standalone script
  is read from a `.js` asset copied into `dist` at build, not from `node_modules`.
- **N8N-DD-02 — Parameters are generated.** `scripts/make-properties.ts` writes
  `nodes/Silverpoint/properties.generated.ts` from the host catalog: the chart options list, and per
  chart the role and option parameters under `displayOptions.show.chart`. CI: `--check` (H-3).
- **N8N-DD-03 — Roles take field names, as text with expressions allowed.** A workflow's columns
  are not known at design time; n8n's own nodes take field names the same way.
- **N8N-DD-04 — Verification is a goal, not a dependency.** If reviewers refuse a bundled engine
  (silverpoint research R4), the node stays an unverified community node for self-hosted n8n, and
  the answer is recorded here.

## Structure

```
nodes/Silverpoint/  Silverpoint.node.ts  properties.generated.ts  silverpoint.svg (icon)  Silverpoint.node.json
scripts/  make-properties.ts  bundle-engine.mjs  conformance.mjs
vendor/   host-catalog.json  conformance.json  integrity.json   (pinned, H-2)
test/     .github/workflows/  ci.yml  publish.yml (provenance)
```

## Tasks

- [ ] **N8N-T-01** Split this pack into `specs/`; `CLAUDE.md`; scaffold with `@n8n/node-cli`. Stop for review. *H-7, N8N-Art. 3*
- [ ] **N8N-T-02** `scripts/bundle-engine.mjs`; the kit against `dist`; a test that `dist` requires nothing external. *N8N-REQ-010, N8N-REQ-011, H-4*
- [ ] **N8N-T-03** `scripts/make-properties.ts` and `--check`. *N8N-REQ-001, N8N-REQ-002, N8N-REQ-004, H-3*
- [ ] **N8N-T-04** Row sources. *N8N-REQ-003*
- [ ] **N8N-T-05** SVG output, binary and text. *N8N-REQ-005*
- [ ] **N8N-T-06** HTML outputs. *N8N-REQ-006*
- [ ] **N8N-T-07** Errors, *Continue On Fail*, diagnostics. *N8N-REQ-007, N8N-REQ-008*
- [ ] **N8N-T-08** Tool use; README with three workflows (a chart into an email, into a file, into an HTML report); a local n8n run showing each node's output. *N8N-REQ-009, H-8*
- [ ] **N8N-T-09** `publish.yml` with provenance; release `0.1.0`; submit through the Creator Portal. *N8N-Art. 3*

## Open questions

- **N8N-OQ-1** Does the reviewers' reading of "no run-time dependencies" accept a bundled engine of
  this size? Ask in the Creator Portal before N8N-T-09, with the bundle's size.

## Bootstrap prompt

````text
This repository will publish `n8n-nodes-silverpoint`, an n8n community node that draws silverpoint charts. Its design is in specs/spec-pack.md, written in the silverpoint repository (~/WebstormProjects/silverpoint/changes/feature-007-bi-hosts). Read the pack, then that folder's README.md, api-delta.md and repositories/README.md §3, and n8n's verification guidelines.

Do N8N-T-01 only: split the pack into specs/ without changing its content, write CLAUDE.md, scaffold with @n8n/node-cli and make its lint pass on the empty node. Show me the tree and the lint's output, then stop.
````
