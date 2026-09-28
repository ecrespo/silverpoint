---
'@silverpoint/grounds': minor
---

**The components' stylesheet (feature-002, step 6b).** `@silverpoint/grounds/ui.css`, a new,
opt-in stylesheet: control sizes and focus from each ground's new `ui` tokens, hand-drawn frames
and hatch tones generated at build time by the ground's own inker and laid as CSS masks painted
with `--sp-` properties, an exact `precision` frame, a forced-colors block, and motion only under
`prefers-reduced-motion: no-preference`. `silverpoint` inks its frames in four variants;
`cyanotype` keeps an exact frame and reads tone as line weight. `styles.css` is unchanged, byte
for byte.
