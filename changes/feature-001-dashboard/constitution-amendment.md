# Constitution amendment — Art. 3, parity over normalised markup (v1.4 → v1.5)

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-25 (Analyze A-01); **folded into `specs/constitution.md` on 2026-09-25** |
| **Raised by** | feature-001 Dashboard, DD-017 |
| **Nature** | Widens the gate; relaxes nothing |

## Why

Art. 3 requires "a normalised **SVG** output … character-for-character identical across every
adapter". A dashboard emits HTML around the charts' SVG —a `section`, a heading, one `article` per
cell, CSS custom properties— and that wrapper differs by framework as easily as a chart does. Left
as written, the article would not cover it, and a dashboard could drift between React, Vue and
Angular while every chart inside stayed green.

## Text

In Art. 3, first paragraph, replace:

> THE SYSTEM SHALL produce, for the same data, configuration, ground, mode and seed, a
> normalised SVG output —attributes ordered, numbers to 2 decimals, whitespace collapsed—
> **character-for-character identical across every adapter**.

with:

> THE SYSTEM SHALL produce, for the same data, configuration, ground, mode and seed, a
> normalised markup —the SVG of every chart and any wrapper markup the library emits around
> charts; attributes ordered, numbers to 2 decimals, whitespace collapsed—
> **character-for-character identical across every adapter**.

In the same article, "The gate operates over a declared fixture matrix —chart × ground × mode ×
size—" becomes "—chart or composition × ground × mode × size—".

## Amendments table row

| Date | Article | Change | Reason | Approved by |
|---|---|---|---|---|
| 2026-09-25 | Art. 3 | Parity covers normalised markup, wrappers included, and the fixture matrix admits compositions | The dashboard (feature-001) emits HTML around the charts; the gate must hold it to the same zero tolerance | Ernesto Crespo |

The header becomes `Version 1.5 · … · Last amended: 2026-09-25`, and `CLAUDE.md`'s status table
"Constitution ✅ v1.4 ratified" becomes v1.5 on folding.
