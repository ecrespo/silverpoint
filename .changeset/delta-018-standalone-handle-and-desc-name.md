---
'@silverpoint/core': minor
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
'@silverpoint/embed': minor
---

Every chart's handle gains `toStandaloneSVGString(extraCss?)`, a self-painting SVG file with the stylesheet loaded on demand (#25). A chart's accessible name is now a `<desc id="{id}-title">` instead of an SVG `<title>`, so browsers no longer show a native tooltip over a chart (#29); the normalised SVG output changes by that element name.
