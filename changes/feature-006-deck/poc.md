# PoC — Phase 10a: framework charts inside Marpit slides, scaled, in three engines

| Field | Value |
|---|---|
| **Status** | `DONE` — run 2026-10-31; awaiting the user's review |
| **Verifies** | REQ-617 (scaling), REQ-618 (input inside a scaled slide), REQ-580 (root font size), REQ-588 (split backgrounds) |
| **Decides** | DD-051 (scaling method) |
| **Code** | [`tools/deck-poc/`](../../tools/deck-poc/) — `src/main.tsx` (the page), `test/poc.spec.ts` (the measurements), `poc-docker.sh` |
| **Environment** | Playwright 1.63.0 in the digest-pinned image `mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30…` (the pixel gate's): Chromium build 1243, Firefox build 1543 (Firefox 155), WebKit build 2359; `deviceScaleFactor: 1`. `@marp-team/marpit` 3.2.3, `@marp-team/marpit-svg-polyfill` 2.1.0, React 19, `@silverpoint/react` from the workspace (0.8.0) |
| **Evidence** | [`poc/results.jsonl`](poc/results.jsonl) (run 2, 36 rows: engine × method × width, plus the `rem`/font rows), [`poc/results-run1.jsonl`](poc/results-run1.jsonl) (run 1: `svg` and `transform` only, before `svg-transform` and the split slide), screenshots in [`poc/`](poc/) |

## 1. The question

Can a silverpoint chart, mounted by a framework (React `createPortal` into the fence's slot), live
inside a Marpit slide that scales to its container, with correct layout, pointer, focus and keyboard,
in Chromium, Firefox and WebKit? And with which scaling method?

## 2. Methods compared

| Method | Marpit | Scaling |
|---|---|---|
| `svg` | `inlineSVG: true` | The `<svg viewBox="0 0 1280 720">` at `width: 100%`; `@marp-team/marpit-svg-polyfill`'s `observe()` for WebKit. The prompt's default |
| `transform` | `inlineSVG: false`, `slideContainer: div.sp-slide-box` | Each `<section>` gets `transform: scale(k)` from a `ResizeObserver`, `k = width / 1280`. The prompt's fallback |
| `svg-transform` | `inlineSVG: true`, `slideContainer: div.sp-slide-box` | The `<svg>` fixed at 1280×720 (no `viewBox` scaling, **no polyfill**); the whole `<svg>` gets `transform: scale(k)` from a `ResizeObserver`. Added during the PoC (§4) |

## 3. What each case measures

Slides 1..3: a fragment list; a heading and a `silverpoint` fence with a `BarChart` (8 bars, two
series); a `![bg left:40%]` split background. Container widths 464, 944 and 1584 px (viewports
480, 960, 1600 less the scrollbar). For each case:

| Measure | Pass |
|---|---|
| Slide 2's rendered box vs the container | width error ≤ 1 px; height = width × 9/16 ± 1 px |
| The fence's figure | left at `section.left + 80k` ± 2 px; width `1120k` ± 2 px |
| The chart's own measurement | `width="1120"`: it measures the canvas, not the scaled box |
| Hit-testing | `elementFromPoint` at each of the 8 bars lands inside the chart |
| Real clicks | a mouse click on bar *i* of the first series makes the chart announce datum *i* (`x Q1` … `x Q4`) |
| Keyboard | focus the chart, `ArrowRight` ×2: the live region announces a value |
| Split background | the `bg left:40%` figure is 0.4 of the slide's width |
| Root font size | slide 2's `h1` height identical with the host's `html { font-size: 10px }`; `document.fonts.check('500 64px "EB Garamond"')` |

## 4. Results

Pass counts over the 3 widths (geometry + hit-testing + clicks + keyboard + split background):

| Method | Chromium | Firefox | WebKit |
|---|---|---|---|
| `svg` (inline SVG + polyfill) | 3/3 | 3/3 | **0/3** |
| `transform` | 0/3 — split background absent | 0/3 — split background absent | 0/3 — split background absent |
| `svg-transform` | **3/3** | **3/3** | **3/3** (and 9/9 over `--repeat-each=3`) |

The root-font-size and font rows pass in every engine and method: the `h1` height is identical at
`font-size: 10px`, and EB Garamond loads inside the Marpit container (no Shadow DOM involved).

**WebKit under `svg`**, run 1 ([`poc/results-run1.jsonl`](poc/results-run1.jsonl)):

| Width | Geometry | Clicks on bars Q1..Q4 announce |
|---|---|---|
| 464 | correct | nothing: no click reaches the chart (`elementFromPoint` 0/8) |
| 944 | slide 696 px wide in a 944 px box: **scaled twice**, Q4 cut off ([`poc/webkit-svg-960.png`](poc/webkit-svg-960.png)) | Q1, Q2, Q3, Q4 |
| 1584 | correct | Q1, Q2, **Q2 (previous), Q3 (previous)**: clicks land on the wrong bar |

Run 2 and three repetitions (`--repeat-each=3`) failed again, though not always in the same way: at
1584 px the slide was 1960 px wide (scaled twice) and no click reached the chart. The polyfill's
correction (a `transform` on the `<section>`, recomputed from the `viewBox` ratio) is not applied
consistently, and WebKit does not map pointer events through it. **The `svg` method is
unreliable in WebKit, in rendering and in input.**

**`transform`** passes everything in the three engines except REQ-588: without inline SVG, Marpit
renders no advanced backgrounds. Verified directly on Marpit 3.2.3: `![bg left:40%](a.png)
![bg](b.png)` gives one `background-image: url("b.png")` on the `<section>` (the split and the first
image are lost), whereas inline SVG gives `data-marpit-advanced-background="background"` with two
figures and a content `foreignObject` at `x="40%"`.

**`svg-transform`** keeps Marpit's inline SVG, and so its advanced backgrounds, but never asks an
engine to scale HTML through a `viewBox`: the `foreignObject` is laid out at 1:1, and the scale is an
ordinary CSS transform on an ancestor, which all three engines hit-test correctly. Every measure
passes in every engine at every width, the polyfill is not used, and the screenshot
[`poc/webkit-svg-transform-960.png`](poc/webkit-svg-transform-960.png) shows the slide whole.

## 5. Findings for the design

| # | Finding | Goes to |
|---|---|---|
| F1 | **Scaling: `svg-transform`.** Inline SVG at 1280×720, one `transform: scale()` per slide box from one `ResizeObserver`; no polyfill | DD-051 |
| F2 | `@marp-team/marpit-svg-polyfill` is **not needed**: it leaves the dependencies (amends REQ-570, API delta §1) | DD-051, TD §5.3 |
| F3 | Never re-wrap Marpit's DOM: its scoped CSS uses child combinators (`div.sp-deck-x > section`). Wrapping the `<section>`s in the PoC's first attempt dropped the whole theme (Times New Roman, a 168 px slide). Boxes come from Marpit's `slideContainer` | DD-051, DD-052 |
| F4 | A chart inside a scaled slide measures its **layout** width (1120), not its rendered width, in every engine: the transform does not leak into the core's measurement (DD-015) | DD-053 |
| F5 | A chart hit-tests from its root (`elementFromPoint` returns `.sp-root`, and the chart maps coordinates to the datum): correct under `svg-transform` and `transform` in the three engines | DD-053 |
| F6 | The chart's keyboard model and live region work inside a slide unchanged | REQ-618 |
| F7 | Marpit 3.2.3 bundles for the browser under Vite 8 without shims (the PoC page is 699 kB min / 227 kB gzip with React, the chart and Marpit) | REQ-628 |

## 6. Limits of this PoC

- **React only.** Vue's `render()` and Angular's `createComponent({ hostElement })` mount into the
  same slot element; the engines' layout and hit-testing do not depend on which framework appended
  the node. REQ-625's e2e covers the three adapters in the three engines.
- **One chart** (`BarChart`). The hit-testing model is shared by the 60 charts (the core's
  interaction engine), so one chart exercises it; the e2e of REQ-625 adds a radial and a hierarchy chart.
- **The focus indicator was not located** by the PoC's selector (`[data-role="focus"]`): the chart's
  focus ring is drawn differently. Its position under scaling is left to the e2e (REQ-625).
- **The `svg` dimensions were set as attributes** (`width="1280" height="720"`) by the PoC; the
  design sets them from CSS under a `[data-sp-scaled]` flag so the server markup stays Marpit's
  (DD-051). The e2e re-checks that variant in WebKit first (task in Phase 10b).
- Print, fullscreen and the overview were out of scope (no scaling question: print is 1:1).
