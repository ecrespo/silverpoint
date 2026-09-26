---
'@silverpoint/tailwind': minor
---

**`@silverpoint/tailwind`, an optional Tailwind preset.** It names the public `--sp-` variables as
theme tokens (REQ-047): `bg-sp-substrate`, `text-sp-ink`, `border-sp-rule` and the other
colours, plus `font-sp-display` and `rounded-sp`. For Tailwind 4, `@import
'@silverpoint/tailwind/theme.css'`; for 3.4, `presets: [require('@silverpoint/tailwind')]`. The
values stay in `@silverpoint/grounds`, so the utilities follow the ground, the substrate and your
overrides. It depends on nothing, not even Tailwind, and no silverpoint package depends on it.
