---
'@silverpoint/core': minor
---

**UI components in the core (feature-002, step 6a).** The new subpath `@silverpoint/core/ui` holds
the framework-neutral half of the 17 UI components of `0.3.0`: their props types (`SpButtonProps` …), the catalog `UI_COMPONENTS`, value
geometry (`uiValue`, `uiRateCount`, `uiProgressArc`, `uiSteps`), the WAI-ARIA roving-focus
transition `uiRovingKey`, the frame variant and outlines (`uiFrameVariant`, `uiFrameOutline`,
`UI_FRAME_KINDS`), and the checks `uiItems` and `uiRequireName`. The reference states `UI_DEMOS`
live on the new subpath `@silverpoint/core/ui-demos`. New diagnostic codes `SP017`, `SP018`,
`SP019`. The main entry is unchanged, and so is the rendered output of every chart.
