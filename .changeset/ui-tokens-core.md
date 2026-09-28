---
'@silverpoint/core': minor
---

**UI tokens and tone tiles in the core (feature-002, step 6b).** `Ground` gains an optional `ui`
section (Data Model §3.8: frame style and variants, control heights, radius, focus width, tone per
state); a ground without it takes `UI_TOKEN_DEFAULTS`. `@silverpoint/core/ui` gains
`resolveUiTokens`, which holds a ground's tokens to their domain, and `uiToneTile`, the seamless
tile geometry the grounds build draws a control's tone from. No change to the rendered output of
any chart.
