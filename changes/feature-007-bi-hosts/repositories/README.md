# The host repositories

| Field | Value |
|---|---|
| **Status** | `APPROVED` — 2026-11-20 (user decision). The eight repositories exist (created by the user 2026-11-20: licence and README on `main`, a local `develop` branch at the same commit, not pushed); the spec packs are not copied yet (§5, step 2) |
| **Decided by** | Research §6 and decisions D3, D4, D10, D12; TD delta DD-068 |

## 1. Are new repositories needed?

Yes. Eight, and no more.

**Why not inside this monorepo.** The nine (soon ten) packages here share one version, one toolchain
(pnpm, Nx, tsup, Vitest, Playwright), one release (`release.yml`, npm Trusted Publishing) and one
constitution whose stack row says TypeScript. A host integration has none of those in common: it is
built with its host's own tool (`pbiviz`, pixi and the KNIME bundler, `@n8n/node-cli`, Cookieplone,
Superset's plugin build), published where its host looks (PyPI, KNIME Community Hub, a `.pbiviz`
file, a hosted page), reviewed by its host's process, versioned by its host's compatibility, and in
one case licensed differently. Inside the `fixed` group, a Power BI API bump would force a release
of `@silverpoint/core`.

**Why not one "silverpoint-hosts" repository.** Eight toolchains in one tree, Python and Node CI for
every pull request, and issue trackers where a Tableau administrator and a Plone integrator read
each other's bugs. The only thing the hosts share is what this repository already publishes.

**Why eight and not twelve.** The diagram has eleven green boxes. Databricks and Jupyter need no
integration beyond the Python package (a notebook shows the HTML a library returns). Flask and Django
are two files each, locked to the version of the script the Python package vendors, and live inside
it as `silverpoint.contrib.flask` and `silverpoint.contrib.django` (decision D3). That leaves the
Python package itself plus seven hosts.

**Existing repositories.** `reflex-silverpoint-react`: no functional change, one line bump
([`../sibling-prompts.md`](../sibling-prompts.md)). `silverpoint_web`: a hosts page (same file).

## 2. The repositories

All public, under `github.com/ecrespo` (D10), default branch `main`, working branch `develop` as in
this repository. Names were free on GitHub, npm and PyPI on 2026-11-20.

| # | Repository | Description | Language | Published as | Licence | Built on | Spec pack |
|---|---|---|---|---|---|---|---|
| 1 | `silverpoint-python` | Silverpoint charts from Python: a chart from a DataFrame as self-contained HTML, for notebooks, Databricks, Flask and Django. | Python | PyPI `silverpoint` | MIT | the standalone file (vendored) | [`silverpoint-python.md`](silverpoint-python.md) |
| 2 | `n8n-nodes-silverpoint` | n8n community node that draws silverpoint charts from workflow items, as SVG or HTML. | TypeScript | npm `n8n-nodes-silverpoint` | MIT | `@silverpoint/embed` (bundled at build) | [`n8n-nodes-silverpoint.md`](n8n-nodes-silverpoint.md) |
| 3 | `superset-plugin-chart-silverpoint` | Apache Superset visualization plugins that draw silverpoint charts. | TypeScript (React) | npm `superset-plugin-chart-silverpoint` | MIT | `@silverpoint/react`, `@silverpoint/embed/hosts` | [`superset-plugin-chart-silverpoint.md`](superset-plugin-chart-silverpoint.md) |
| 4 | `volto-silverpoint` | Plone Volto add-on: a block that draws silverpoint charts. | TypeScript (React) | npm `volto-silverpoint` | MIT | `@silverpoint/react`, `@silverpoint/embed/hosts` | [`volto-silverpoint.md`](volto-silverpoint.md) |
| 5 | `silverpoint-powerbi` | Power BI custom visual that draws silverpoint charts from report fields. | TypeScript | `.pbiviz` on GitHub Releases; AppSource later | MIT | the standalone module (bundled) | [`silverpoint-powerbi.md`](silverpoint-powerbi.md) |
| 6 | `silverpoint-tableau` | Tableau viz extensions that draw silverpoint charts on a worksheet. | TypeScript | `.trex` files on GitHub Releases; the page on GitHub Pages | MIT | the standalone file | [`silverpoint-tableau.md`](silverpoint-tableau.md) |
| 7 | `silverpoint-knime` | KNIME Analytics Platform extension: view nodes that draw silverpoint charts from a table. | Python | KNIME update site (zip) on GitHub Releases; Community Hub later | MIT *(confirm, KN-OQ-1)* | PyPI `silverpoint` | [`silverpoint-knime.md`](silverpoint-knime.md) |
| 8 | `collective.silverpoint` | Plone Classic UI add-on: silverpoint charts as content and in templates. | Python | PyPI `collective.silverpoint` | GPL-2.0-only | PyPI `silverpoint` | [`collective.silverpoint.md`](collective.silverpoint.md) |

### GitHub descriptions and topics

The description of the table above is the text for each repository's GitHub "About" line; it is repeated here beside its topics.

| Repository | Description (the GitHub "About" line) | Topics |
|---|---|---|
| `silverpoint-python` | Silverpoint charts from Python: a chart from a DataFrame as self-contained HTML, for notebooks, Databricks, Flask and Django. | `silverpoint`, `charts`, `data-visualization`, `python`, `jupyter`, `pandas`, `flask`, `django`, `databricks` |
| `n8n-nodes-silverpoint` | n8n community node that draws silverpoint charts from workflow items, as SVG or HTML. | `silverpoint`, `n8n`, `n8n-community-node-package`, `charts`, `svg` |
| `superset-plugin-chart-silverpoint` | Apache Superset visualization plugins that draw silverpoint charts. | `silverpoint`, `apache-superset`, `superset-plugin`, `charts`, `react` |
| `volto-silverpoint` | Plone Volto add-on: a block that draws silverpoint charts. | `silverpoint`, `plone`, `volto`, `volto-addon`, `charts`, `react` |
| `silverpoint-powerbi` | Power BI custom visual that draws silverpoint charts from report fields. | `silverpoint`, `powerbi`, `powerbi-custom-visuals`, `pbiviz`, `charts` |
| `silverpoint-tableau` | Tableau viz extensions that draw silverpoint charts on a worksheet. | `silverpoint`, `tableau`, `tableau-extensions`, `viz-extensions`, `charts` |
| `silverpoint-knime` | KNIME Analytics Platform extension: view nodes that draw silverpoint charts from a table. | `silverpoint`, `knime`, `knime-extension`, `charts`, `python` |
| `collective.silverpoint` | Plone Classic UI add-on: silverpoint charts as content and in templates. | `silverpoint`, `plone`, `plone-addon`, `classic-ui`, `charts`, `python` |

### Licences

- **MIT** for seven, the library's own licence; n8n requires it of verified nodes, Volto is MIT, and
  nothing in Power BI's, Tableau's or Superset's terms asks for another. Superset itself is
  Apache-2.0; an MIT plugin is compatible with it, and would be relicensed only if it were ever
  contributed upstream.
- **GPL-2.0-only** for `collective.silverpoint`: it imports Plone's backend, which is GPL-2.0, and
  that is the convention of Plone backend add-ons. It may depend on MIT code (the Python package and
  the vendored script); the reverse dependency does not exist, so nothing else here becomes GPL.
- **KNIME**: MIT is proposed; KNIME Community Hub's publication terms were not read in full
  (research R8). Confirm before the first release.

## 3. The rules every host repository inherits

Each spec pack opens with these as its constitution's first articles and adds its own.

| Article | Rule |
|---|---|
| **H-1 — One engine** | THE REPOSITORY SHALL draw only through `@silverpoint/embed` (its module, or a standalone file) or through an adapter package, unmodified. It SHALL contain no scale, no geometry, no colour computation and no override of the library's stylesheet beyond the public `--sp-*` properties. *(silverpoint Constitution Art. 2, v1.12)* |
| **H-2 — A pinned line** | THE REPOSITORY SHALL state in its manifest and README the silverpoint release line (`major.minor`) it draws with, and SHALL carry the engine as a build-time artefact of exactly one version of that line, verified against `integrity.json` where it is a file. |
| **H-3 — Generated manifests** | THE REPOSITORY SHALL generate every list of charts, roles, options and appearance values from the pinned `host-catalog.json`, and its CI SHALL fail when a generated file differs from a fresh generation. Nothing in those lists is typed by hand. |
| **H-4 — Conformance** | CI SHALL run the conformance kit against the engine as shipped, in the runtime it is shipped in, and SHALL fail on any difference. |
| **H-5 — Nothing lost on the way in** | THE REPOSITORY SHALL keep the chart's accessible name, tabular alternative, keyboard reading and `precision` mode, and SHALL switch to `precision` when the host reports high contrast. *(Art. 5)* |
| **H-6 — The host's rules** | THE REPOSITORY SHALL request no permission and open no connection the host's strictest distribution channel forbids. |
| **H-7 — Specs are the source** | Spec-anchored SDD as in silverpoint: `specs/` is the standing truth, `changes/` holds proposals; every MUST has an id with the repository's prefix; every task and test cites one. Specs and code are written in English. *(Art. 9)* |
| **H-8 — Shown, not inferred** | Test-first. A report of a test step shows its output — the rendered markup, the manifest, the runner's output — not only its verdict. |

**Following a new line** (H-2), the same four steps everywhere: bump the pin → regenerate (H-3) →
run the kit (H-4) → release. A host is never a release gate of the library (DD-068).

## 4. Order of creation

| When | Create | Why then |
|---|---|---|
| Now, optional | `volto-silverpoint`, `superset-plugin-chart-silverpoint` | They build on `@silverpoint/react` 0.10 as it is; each starts with a PoC that does not need `0.11.0` |
| At `0.11.0` | `silverpoint-python` (in earnest), `n8n-nodes-silverpoint` | Wave 1: the first users of the standalone file, the host catalog and the kit |
| After one wave-1 release | `silverpoint-powerbi`, `silverpoint-tableau` | Wave 2: the kit has been proven outside this repository |
| After `silverpoint` `0.11.0` on PyPI | `silverpoint-knime`, `collective.silverpoint` | Wave 3: they depend on it |

No more than three open at once (research R5). The repositories already exist; this order is now the order in which work is **opened** in them.

The name `silverpoint` on PyPI is taken by the first real upload of `silverpoint-python` (user decision, 2026-11-20); no placeholder is published. The accepted risk: the name stays free for anyone until that release.

## 5. Creating one

```sh
# 1. The repository (replace NAME, DESCRIPTION; `gpl-2.0` for collective.silverpoint)
gh repo create ecrespo/NAME --public --description "DESCRIPTION" --license mit --clone
cd NAME && git checkout -b develop   # done for all eight on 2026-11-20 (local, not pushed)

# 2. The spec pack becomes the repository's first commit
mkdir -p specs changes
cp ~/WebstormProjects/silverpoint/changes/feature-007-bi-hosts/repositories/NAME.md specs/spec-pack.md
git add -A && git commit -m "docs: the spec pack from silverpoint feature-007" && git push -u origin develop

# 3. Topics (the table of §2)
gh repo edit ecrespo/NAME --add-topic silverpoint --add-topic charts   # …and the rest
```

Then open a Claude Code session in the repository and give it the pack's **Bootstrap prompt**. Its
first task in every pack is the same: split `specs/spec-pack.md` into `specs/constitution.md`,
`specs/prd.md`, `specs/technical-design.md` and `specs/tasks.md`, write `CLAUDE.md` pointing at the
constitution, and stop for review before any code.

## 6. What a spec pack contains

Identity · constitution (H-1..H-8 plus local articles) · scope · requirements in EARS with local ids ·
design decisions · structure · tasks · release · open questions · bootstrap prompt. A pack is a
**gate-1 draft**: enough to start and to review, written before `@silverpoint/embed` exists. Task
T-328 re-read all eight against the built API (§7).

## 7. The built API, as the packs meet it (T-328, 2026-11-21)

Every pack was re-read against `@silverpoint/embed` as built for `0.11.0` (API delta, amended in
implementation). No requirement of any pack contradicts it; the points below are what a host
repository must know that the packs, written before the code, could not say. Each affected pack
carries a short *As built* note pointing here.

| Point | What it means for a host |
|---|---|
| **56 bindable charts** | `binding: 'none'` for `treemap-chart` (its tiles carry grid spans, not data fields; `squarified-treemap` binds parts), `sparkline-rows`, `volvelle-chart` and `orbit-chart`. Every "chart whose `binding` is not `none`" in the packs is these 56; nothing is counted by hand (H-3). |
| **`demo.options`** | A host chart's `demo` may carry `options`: props of the canonical demo that are not roles (`names` of the dumbbell, `axis` of the interval chart, `period` of the slope chart, `metric`/`delta` of the KPI card, `nodes` of the network). A demo, gallery, thumbnail or test that draws a chart from its `demo` passes `demo.options` as `options` to `specFromTable`, or its picture differs from the library's. |
| **`HOST_CATALOG` is not in the standalone files** | The files expose `Silverpoint.specFromTable` and `hostCatalogFollows` over a generated binding table, not the catalog (580 kB with its demos). Generators read the pinned `host-catalog.json` at build time (H-3); the page binds at run time with `Silverpoint.specFromTable`. The module entry `@silverpoint/embed/hosts` does export `HOST_CATALOG`. |
| **The script builds mount on load** | `silverpoint-embed.js` and `.full.js` define `<silverpoint-chart>` and mount every `[data-sp-embed]` once the document is parsed. `renderToHTML({ interactive: true })` needs no inline boot script, so markup works under `script-src 'self'`. |
| **`embedFonts` needs a face** | Only the module entries and the `full` files carry EB Garamond. `embedFonts` with `silverpoint-embed.js` / `.mjs` draws the fallback stack and reports `SP013`. A host that renders SVG on a server vendors `silverpoint-embed.full.mjs`. |
| **Integrity** | `integrity.json` in the hosts kit (and `STANDALONE_INTEGRITY` from the module entry) gives the `sha384` of each standalone file; H-2's verification reads it. |
| **Diagnostics** | `SP030` (a spec over 2 MB or the path byte budget) and `SP031` (an invalid spec given to the client) are the embed's; they reach `onDiagnostic` and `sp-diagnostic` like any other code. |
| **Hosts kit** | `silverpoint-hosts-kit-<version>.zip` on each GitHub release: the four standalone files, `host-catalog.json`, `conformance.json`, `integrity.json`, `html-goldens/`, `tables/` (`tools/release/hosts-kit.mjs`). |
