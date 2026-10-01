# Accessibility audit — UI page (T-159)

REQ-313, REQ-314, REQ-318, REQ-331. Audited 2026-09-29 on the `/ui` page of the four example apps
(`vite-react`, `vite-vue`, `nextjs`, `angular`), three panels each: `silverpoint · cream · ink`,
`precision`, and `cyanotype · prussian`; the 17 components.

## 1. Automated — done

`e2e/ui.spec.ts` › *accessibility audit (T-159)*, in CI's `browser` job.

| Check | Tool | Result |
|---|---|---|
| WCAG 2.0/2.1/2.2 A and AA (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`), every rule but `color-contrast`, on the page as drawn | axe-core 4.13, all three panels | 0 violations, 4 apps |
| `color-contrast`, frames and tone tiles made transparent (below) | axe-core 4.13, all three panels | 0 violations, 4 apps |
| Roles and states: `progressbar` with `aria-valuenow`/`min`/`max` (none on the indeterminate one), Steps as an `<ol>` with `aria-current="step"`, `alert` × 2, `status` × 2, `aria-busy` skeleton, `separator` | Playwright | pass, 4 apps |
| Focus ring: solid outline ≥ 2 px, ≥ 3:1 against the substrate, ten kinds of focusable on each of the three panels; no second ring of the browser's (REQ-316) | Playwright | pass, 4 apps |
| Target size ≥ 24 × 24 px, every kind present on every panel; the slider measured on its native range (REQ-317, I-20) | Playwright | pass, 4 apps |
| Reduced motion: no animation and no transition anywhere on the page; the indeterminate sweep runs without it (REQ-320) | Playwright | pass, 4 apps |
| Keyboard: Tabs, RadioGroup, Segmented, Rate — arrows, Home/End, wrap, skip disabled, one tab stop (REQ-315); RTL from an ancestor's `dir`, on a native group and on Tabs (REQ-321) | Playwright | pass, 4 apps |
| The panel's `FormData` carries every value, once per name, before and after a keyboard change (REQ-323) | Playwright | pass, 4 apps |
| Firefox and WebKit: 17 components render, Tabs arrows work (REQ-314) | Playwright, pinned image | pass |

### The one exclusion, and why

A frame (`[part='sp-frame']`) is an ink line drawn as `background: var(--sp-ink)` under a CSS
mask (DD-022). axe cannot see the mask, so it reads the frame as a solid `#5a5e65` backdrop under
the text above it and reports 1.52:1 (`#3f4348` on `#5a5e65`) on the ink panel. The text sits on
the substrate, not on the frame. The audit runs axe twice: every rule but `color-contrast` on the
page as drawn, then `color-contrast` alone with frames and tone tiles made transparent (their
layout untouched). Both carry no text; their own contrast is the job of the 11 UI pairs in the
palette contrast gate (T-142), which CI already enforces. The `precision` and `cyanotype` panels
did not need the exclusion.

### Found and fixed by the audit

- 2026-09-30 — the text input of `SpInput` kept the browser's `outline: auto` inside the exact
  ring of its box: two rings, one of them not exact (REQ-316). `ui.css` now sets `outline: none`
  on the native, text and range controls, whose ring is drawn on their item, box or thumb.

## 2. Manual screen-reader pass — **pending**

Not done. It needs NVDA (Windows) and VoiceOver (macOS/iOS), which cannot be run from the
development machine (Linux) or from CI. T-159's *Done* ("audit file committed") is therefore met
for the automated half only.

To record, per component, on `/ui` of `vite-react` (any app is equivalent, the markup is shared):

| Screen reader | Browser | Script |
|---|---|---|
| NVDA | Firefox and Chrome | name, role, state announced for each of the 17; Tabs, RadioGroup, Segmented, Rate arrows; Alert announced on load; Progress value |
| VoiceOver | Safari | same |

Result and date go in a table here; any A/AA finding blocks T-163.
