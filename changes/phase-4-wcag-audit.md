# WCAG 2.1 AA audit — the four example apps (T-096)

> Implementation Plan, Phase 4: "WCAG 2.1 AA audit across all four apps, no A or AA issues."
> Audited 2026-09-24: `vite-react`, `vite-vue`, `nextjs`, `angular` (their home, gallery and
> fixture pages), plus the documentation site. The four apps are held to the same checks.

## Method

Three layers, each run by `pnpm exec playwright test` on every PR:

1. **axe-core** with the `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa` tags, on every page of every
   app and on every chart's fixture page (`e2e/a11y.spec.ts`, 33 charts × 4 apps), and on every
   page of the site (`e2e/docs.spec.ts`).
2. **The criteria axe cannot decide**, one Playwright test each: `e2e/wcag.spec.ts` in all four
   apps, and the reflow tests of the site.
3. **Judgement**, for what no test can decide. It is written in the table below, with its reason.

## Findings, fixed in this task

| Criterion | Finding | Fix | Test |
|---|---|---|---|
| **1.4.13 Content on hover or focus** (AA) | A readout shown by the pointer could not be dismissed with Escape unless the chart had keyboard focus. All three adapters, all four apps | While an item is active, each adapter listens for Escape on the document and passes it to the core reducer, which already clears on Escape (event wiring only, Art. 2) | "1.4.13 · … dismissible with Escape", RED in 4 apps → GREEN |
| **1.4.10 Reflow** (AA) | The hidden data table (`dataTable: 'hidden'`) kept its full width: a `<table>` ignores `width` and `overflow`, so on a narrow page it caused horizontal scrolling. Found on the documentation site; it affects every consumer's page | The visually-hidden style moves to a box around the table (`.sp-table-box`), in all three adapters | the site's reflow tests, RED → GREEN; grounds style test updated |
| **1.4.10 Reflow** (AA) | The apps' fixed 320 px harness scrolled horizontally at 320 CSS px | `max-width` on the harness; it has no effect at the gates' 800 px viewport, so no golden changed | "1.4.10 · reflow: the page … at 320 CSS px", RED in 8 cases → GREEN |

The tests written against behaviour that already held were mutation-checked:
- **2.1.2:** an adapter that swallows Tab traps focus, and the test turned red.
- **2.4.7:** `outline: none` on the focus ring turned it red.

## Every A and AA criterion

| # | Criterion | Level | Verdict | Evidence |
|---|---|---|---|---|
| 1.1.1 | Non-text content | A | Pass | Each chart is `role="img"`, named by its title and a series summary through `aria-labelledby` (REQ-120; a11y spec). The data is in a table (REQ-121) |
| 1.2.1-1.2.3 | Audio and video | A | N/A | None |
| 1.3.1 | Info and relationships | A | Pass | Data tables use `caption`, `th scope="col"` and `th scope="row"`; axe |
| 1.3.2 | Meaningful sequence | A | Pass | DOM order is chart, table, readout; axe |
| 1.3.3 | Sensory characteristics | A | Pass | No instruction relies on shape or position |
| 1.4.1 | Use of colour | A | Pass | REQ-124 across the catalog: no identity or magnitude by tone alone (`phase-4-req-124-review.md`, catalog test) |
| 1.4.2 | Audio control | A | N/A | No audio |
| 2.1.1 | Keyboard | A | Pass | Tab reaches every chart; the arrows, Home and End reach every item and announce it (a11y spec, every chart × 4 apps; the core contract proves every item reachable) |
| 2.1.2 | No keyboard trap | A | Pass | wcag spec, mutation-checked |
| 2.1.4 | Character key shortcuts | A | Pass | Only non-character keys (arrows, Home, End, Enter, Space, Escape), and only while the chart has focus |
| 2.2.1 | Timing adjustable | A | N/A | No time limits |
| 2.2.2 | Pause, stop, hide | A | Pass | The only motion is the entry animation: under 5 s (wcag spec), and absent under reduced motion (REQ-125) |
| 2.3.1 | Three flashes | A | Pass | Nothing flashes; the one animation is a single fade |
| 2.4.1 | Bypass blocks | A | Pass | Apps: one landmark and no repeated blocks. Site: a skip link |
| 2.4.2 | Page titled | A | Pass | axe (`document-title`) |
| 2.4.3 | Focus order | A | Pass | DOM order; on the site, focus moves to the content on navigation |
| 2.4.4 | Link purpose (in context) | A | Pass | The site's gallery links carry the chart name and "props and usage" |
| 2.5.1 | Pointer gestures | A | Pass | Single pointer only; no path gestures |
| 2.5.2 | Pointer cancellation | A | Pass | Selection fires on `click` (the up-event); a down-event only previews |
| 2.5.3 | Label in name | A | Pass | The site's controls are named by their visible labels (`getByLabel` exact in the docs spec) |
| 2.5.4 | Motion actuation | A | N/A | None |
| 3.1.1 | Language of page | A | Pass | `lang="en"`; axe (`html-has-lang`) |
| 3.2.1 | On focus | A | Pass | Focus activates an item and announces it; it changes no context |
| 3.2.2 | On input | A | Pass | The playground's controls change only the chart they describe |
| 3.3.1 | Error identification | A | N/A | No forms that can fail |
| 3.3.2 | Labels or instructions | A | Pass | Every playground control has a label; axe |
| 4.1.1 | Parsing | A | Pass | Rendered by React, Vue and Angular; the string gate parses every SVG; unique ids (the site prefixes repeated renders) |
| 4.1.2 | Name, role, value | A | Pass | The chart root is `role="group"` with a name, and the SVG is `role="img"`; axe |
| 1.2.4-1.2.5 | Captions (live), audio description | AA | N/A | No media |
| 1.3.4 | Orientation | AA | Pass | Nothing locks orientation |
| 1.3.5 | Identify input purpose | AA | N/A | No inputs about the user |
| 1.4.3 | Contrast (minimum) | AA | Pass | Ground tokens verified by the contrast gate (REQ-126, REQ-127; CI fails below 4.5:1 for text), SVG text included; axe on the HTML; the site's text is 11.6:1 |
| 1.4.4 | Resize text | AA | Pass | Page zoom narrows the CSS viewport: the reflow tests at 320 CSS px are 400 % zoom of a 1280 px window, and every page and chart passes them, text included |
| 1.4.5 | Images of text | AA | Pass | All chart text is SVG `<text>`, never an image |
| 1.4.10 | Reflow | AA | Pass *(fixed)* | wcag spec (apps' pages at 320 px, charts fit their container); site reflow tests |
| 1.4.11 | Non-text contrast | AA | Pass | Chart ink against substrate ≥ 3:1 (contrast gate); the focus ring ≥ 3:1 against its surroundings (wcag spec) |
| 1.4.12 | Text spacing | AA | Pass | With WCAG's spacing applied, the table and readout clip nothing (wcag spec). SVG labels are placed text in a drawing, which these properties do not reflow; every one of them is also in the table, which passes |
| 1.4.13 | Content on hover or focus | AA | Pass *(fixed)* | Dismissible (Escape), hoverable (it stays while the pointer rests), persistent (until the pointer leaves, focus moves or Escape) |
| 2.4.5 | Multiple ways | AA | Pass | Site: navigation and the gallery's links. The apps are single pages |
| 2.4.6 | Headings and labels | AA | Pass | Every page has headings that name its content |
| 2.4.7 | Focus visible | AA | Pass | wcag spec, mutation-checked; the site outlines every control on focus |
| 3.1.2 | Language of parts | AA | Pass | Single language |
| 3.2.3 | Consistent navigation | AA | Pass | The site's navigation is the same on every page |
| 3.2.4 | Consistent identification | AA | Pass | Every chart exposes the same roles, names and keys |
| 3.3.3-3.3.4 | Error suggestion, error prevention | AA | N/A | No submissions |
| 4.1.3 | Status messages | AA | Pass | The active item is announced in an `aria-live="polite"` region (REQ-122; a11y spec) |

## Result

No A or AA issue remains in the four apps or the site. Three AA issues were found and fixed:
1.4.13 in the adapters, and 1.4.10 twice (the hidden table in the adapters, the apps' harness).
One verdict rests on reasoning rather than a test: the SVG half of 1.4.12. It is stated above.
