# delta-016 — the tutorial issues (#12, #14, #17..#22)

| Field | Value |
|---|---|
| **Status** | `DRAFT` — implemented on `fix/issues-12-22` 2026-11-13; **not folded into `specs/`** (read-only until approved, Art. 9) |
| **Found by** | writing the seraph.to tutorial series (issues #12..#22) |
| **Amends** | API Spec §1 (two subpaths), §3.4 (`PaletteName`), §8.1/§8.2/§8.3 (a note on `toSVGString`), §8.2 (Angular hosts); no PRD requirement changes text |
| **SemVer** | `patch` — no change to the normalised SVG or to any chart fixture. `SpTable`'s body cells change alignment (#12), so the pixel goldens of the table fixtures need regenerating in the pinned image |

## What changed, and what the specs should say when this is folded

| Issue | Change | Spec text to fold |
|---|---|---|
| #12 | `ui.css`: `.sp-ui-table td` sets `text-align: start`; the column rules (`[data-align]`) come later and win. `styles.css` is untouched (REQ-301 pins its bytes). | None: REQ-473 already says columns align `start`, `center` or `end`. Test added under REQ-473. |
| #14 | `standaloneSVG(svg, css)` on `@silverpoint/grounds`. `toSVGString()` stays the canonical markup (Art. 3: every gate compares it), so the stylesheet is added by the consumer, outside the handle; the adapters gain no bytes (REQ-444). | API Spec §8.1: `toSVGString()` returns the canonical markup, painted by the page's stylesheet; `standaloneSVG` makes it a file. |
| #19 | `@silverpoint/grounds/styles-text`: `dist/styles.css` as `export default "<css>"`, written by the build. | API Spec §1: the subpath. |
| #17 | Docs only. The dashboard root keeps reading its own props (DD-037 as amended: React's `Dashboard` renders in Server Components; Vue and Angular follow for parity). The READMEs and the skill now say so. | None. **Open question for the user:** whether the client adapters should read the provider for the dashboard root, which would amend DD-037 and split React's client and server dashboards. |
| #18 | Angular: `'[attr.title]': 'null'` on the host of the chart base, `sp-dashboard` and the ten UI components with a `title` input. Hosts are outside the parity contract (DD-017). | API Spec §8.2: a literal `title` is the input and is not left on the host. |
| #20 | `PaletteName`; `PALETTES: Readonly<Record<PaletteName, Palette>>`; `PALETTE_NAMES: readonly PaletteName[]`. | API Spec §3.4 and Data Model §2.26: the type. |
| #21 | `@silverpoint/react/provider`, built with the client entries so it shares their context module. | API Spec §1.2 and §8.1: the subpath; the provider page of the site. |
| #22 | The three adapters ignore a `ResizeObserver` entry of 0 px when the observed element has no box (`getClientRects().length === 0`): the last width stands and the core is not asked to render at 0. A rendered container of 0 px still reports `SP003`. | REQ-009 and the `SP003` row of the API Spec's diagnostics table: hidden is not a measurement. |

## Not in this repository

- #13 is `reflex-silverpoint-react#44` (the trigger's custom code is not written into Reflex's
  stateful component modules); fixed there.
- #15 and #16 are text on `/docs/ssr`, which lives in `ecrespo/silverpoint_web`.
