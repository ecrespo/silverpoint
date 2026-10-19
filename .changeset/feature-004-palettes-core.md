---
'@silverpoint/core': minor
---

Palettes, the composed components' and overlays' core, and the timeline's (feature-004,
T-200..T-208). On the new subpath `@silverpoint/core/palettes`: `resolvePalette`, `paletteStyle`, `PALETTE_PROPERTIES`,
`contrastRatio`, `checkPalette`, `PALETTE_PAIRS` and six verified presets (`silverpoint`,
`sanguine`, `sepia`, `ironGall`, `verdigris`, `indigo`); the `Palette` type on the main entry.
A palette value is accepted only if it is a CSS colour (an allowlist). On `@silverpoint/core/ui`:
`uiSortRows`, `uiPageWindow`, `uiPagination`, `uiNumberValue` (now also reporting the range as
drawn), `uiNumberStep`, `uiInitials`, `uiListKey`, `uiTypeahead`, `uiPlace`, `uiAnchor`; ten new
glyphs in `UI_GLYPHS`; and the view trees of `SpSurface`, `SpGlyph`, `SpTable`, `SpPagination`,
`SpBreadcrumb`, `SpAvatar`, `SpAvatarGroup`, `SpStatistic`, `SpDescriptions`, `SpTimelineList`,
`SpCollapse`, `SpCollapseItem`, `SpEmpty`, `SpResult`, `SpTextarea` and `SpInputNumber`, and of
the overlays `SpModal`, `SpDrawer`, `SpPopover`, `SpTooltip`, `SpSelect`, `SpDropdownMenu`,
`SpToast` and `SpToaster` (native `<dialog>` and Popover API), with `uiTriggerView`,
`uiTriggerAria`, `uiSelectItems`, `uiMenuItems` and `uiToastDuration`. On the new
subpath `@silverpoint/core/timeline`: `timelineView`, `timelineInk`, `TIMELINE_FRAMES`,
`TIMELINE_TONES` and the `SpTimelineProps` / `TimelineData` types. `UI_COMPONENTS` gains 21 rows
with a `family` field (`ui`, `composed`, `overlay`), three groups and batches `A1`, `A2`, `B`;
`UI_DEMOS` gains their 35 states, and `@silverpoint/core/ui-demos` exports `TIMELINE_DEMO`. New
diagnostics `SP023`, `SP024` and `SP025`.

A link's `href` (`SpButton`, `SpBreadcrumb`) now keeps only relative URLs and the `http`, `https`,
`mailto` and `tel` schemes, and a `headingLevel` outside 2..6 draws `h3`; both warn `SP017`.

`UiTokens` gains the optional `backdrop` and `rowTone` levels; `resolveUiTokens` holds them to 1..4
and gives a ground that declares none `2` and `1` (T-209).
