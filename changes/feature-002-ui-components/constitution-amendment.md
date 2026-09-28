# Constitution amendment — components join the charts (v1.6 → v1.7)

| Field | Value |
|---|---|
| **Status** | `PROPOSED` — to be approved with gate 1; folded into `specs/constitution.md` only after approval |
| **Raised by** | feature-002 UI components |
| **Nature** | Widens four articles to a second kind of artefact; relaxes nothing |

## Why

The Constitution speaks of **charts**: "a charting library", "the geometry of the data", "every
chart", "a single element per chart". Interface components are not charts, and left as written the
articles would either not bind them (so a component could ink its thumb off its value) or bind them
in ways that make no sense (a button has no "data" and no "tabular alternative"). Each change below
states the same principle for components that the article already states for charts.

## Text

**"What silverpoint is"** — replace the first sentence with:

> A library of charts —and of the interface components around them— for React, Vue and Angular,
> whose visual language is historical drawing techniques.

**Art. 1** — append a second paragraph:

> For interface components, THE SYSTEM SHALL draw with exact geometry every hit area, every focus
> indicator and every shape that carries a value (a progress fill, a slider thumb, a rating), and
> SHALL apply hand inking only to frames, rules and tonal fills. Switching a component between
> `ink` and `precision` SHALL change no layout box and no value geometry, verified by a test that
> compares both.

**Art. 3** — in the first paragraph, "the SVG of every chart and any wrapper markup the library
emits around charts" becomes "the SVG of every chart, any wrapper markup the library emits around
charts, and the markup of every interface component"; and "—chart or composition × ground × mode ×
size—" becomes "—chart, composition or component state × ground × mode × size—".

**Art. 5** — append:

> THE SYSTEM SHALL build every interface component on the native element that carries its role
> where one exists, follow the WAI-ARIA Authoring Practices pattern where none does, draw an exact
> focus indicator, and apply `precision` mode to components under the same conditions as to
> charts. The drawing of a component SHALL never take focus nor carry its accessible name.

**Art. 6** — the last sentence becomes:

> White heightening SHALL be reserved for a single element per chart, and, in an interface
> component, for its current item only (the active tab, the current step, the selected segment, the
> thumb), at most one per component instance.

## Amendments table row

| Date | Article | Change | Reason | Approved by |
|---|---|---|---|---|
| _on approval_ | — , 1, 3, 5, 6 | Interface components enter the scope; exact interaction and value geometry; parity, accessibility and heightening stated for components | feature-002 adds interface components drawn with the grounds; the charts' principles must bind them explicitly | Ernesto Crespo |

The header becomes `Version 1.7 · … · Last amended: <date of approval>`, and `CLAUDE.md`'s status
table "Constitution ✅ v1.6" becomes v1.7 on folding.
