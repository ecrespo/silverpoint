# delta-016 — the tutorial issues (#12, #14, #17..#22)

| Field | Value |
|---|---|
| **Status** | `FOLDED` 2026-11-14 — implemented on `fix/issues-12-22`; approved by the user 2026-11-14 with three decisions: a **minor** (`0.10.0`), fold before the release, and the dashboard's root **reads the provider** (#17) |
| **Found by** | writing the seraph.to tutorial series (issues #12..#22) |
| **Amends** | API Spec v1.14 → v1.15: §1 (two subpaths), §3.4 (`PaletteName`), §7.1 (the dashboard's root), §8.1 (`toSVGString`, `standaloneSVG`), §8.2 (Angular hosts), §11 (`SP003`); PRD v1.16 → v1.17: REQ-009, REQ-212, REQ-462; Technical Design v1.13 → v1.14: DD-037; Data Model v1.11 → v1.12: §2.26; Implementation Plan v1.12 → v1.13 |
| **SemVer** | `minor` (user decision 2026-11-14) — no change to the normalised SVG or to any chart fixture, but `PALETTES` narrows its key (#20), two subpaths are new, and a dashboard under a provider changes its root (#17). The Reflex pin moves to the wrapper's export on the `0.10` line before the release (REQ-556). `SpTable`'s body cells change alignment (#12): the eight `table--plain` and `table--sorted-striped` pixel goldens were regenerated in the pinned image, and so were the four `table--empty` ones, whose row is now centred as the rule always said (it was end-aligned by the bug) |

## What changed, and what the specs should say when this is folded

| Issue | Change | Spec text to fold |
|---|---|---|
| #12 | `ui.css`: `.sp-ui-table td` sets `text-align: start`; the column rules (`[data-align]`) come later and win, and the empty row's centring moves to `.sp-ui-table td.sp-ui-table-empty`, which outweighs the cell rule (the pixel gate caught the empty row losing it). `styles.css` is untouched (REQ-301 pins its bytes). | None: REQ-473 already says columns align `start`, `center` or `end`. Test added under REQ-473. |
| #14 | `standaloneSVG(svg, css)` on `@silverpoint/grounds`. `toSVGString()` stays the canonical markup (Art. 3: every gate compares it), so the stylesheet is added by the consumer, outside the handle; the adapters gain no bytes (REQ-444). | API Spec §8.1: `toSVGString()` returns the canonical markup, painted by the page's stylesheet; `standaloneSVG` makes it a file. |
| #19 | `@silverpoint/grounds/styles-text`: `dist/styles.css` as `export default "<css>"`, written by the build. | API Spec §1: the subpath. |
| #17 | The dashboard's root reads the provider (user decision 2026-11-14). The core gains `dashboardSection(config, palette, layout, under)`: the dashboard's own configuration over `under`, the provider, over the defaults; Vue and Angular hand `dashboardView` the provider and the palette merged by `resolvePalette(provider.palette, own.palette)`. React's `section` is the client component `DashboardRoot` in the `dashboard-link` module (it also holds a linked dashboard's value), so `Dashboard` keeps no `"use client"`; `server/dashboard` reads no provider. Without a provider the markup is what it was. The client root costs React 2,084 B over its one-chart build, so REQ-220 gives React's client entry 2.25 KB (user decision 2026-11-15); the others keep theirs. | DD-037 and DD-018 (amended), REQ-212, REQ-220, REQ-462, API Spec §3.4, §7.1, §8.1, §12. |
| #18 | Angular: `'[attr.title]': 'null'` on the host of the chart base, `sp-dashboard` and the ten UI components with a `title` input. Hosts are outside the parity contract (DD-017). | API Spec §8.2: a literal `title` is the input and is not left on the host. |
| #20 | `PaletteName`; `PALETTES: Readonly<Record<PaletteName, Palette>>`; `PALETTE_NAMES: readonly PaletteName[]`. | API Spec §3.4 and Data Model §2.26: the type. |
| #21 | `@silverpoint/react/provider`, built with the client entries so it shares their context module. | API Spec §1.2 and §8.1: the subpath; the provider page of the site. |
| #22 | The three adapters ignore a `ResizeObserver` entry of 0 px when the observed element has no box (`getClientRects().length === 0`): the last width stands and the core is not asked to render at 0. A rendered container of 0 px still reports `SP003`. | REQ-009 and the `SP003` row of the API Spec's diagnostics table: hidden is not a measurement. |

## Not in this repository

- #13 is `reflex-silverpoint-react#44` (the trigger's custom code is not written into Reflex's
  stateful component modules); fixed there.
- #15 and #16 are text on `/docs/ssr`, which lives in `ecrespo/silverpoint_web`.

## Constitution check

- **Art. 2** — the root's class, substrate and style are computed by the core's `dashboardSection`;
  the adapters hand it the provider and compute nothing.
- **Art. 3** — no canonical render changes: without a provider every adapter writes the same root.
  Under a provider the three client adapters agree; React's server entry is the stated exception.
- **Art. 9** — approved by the user on 2026-11-14 and folded the same day, before the release.
