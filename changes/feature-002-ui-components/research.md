# Research — UI component libraries, and hand-drawn ones

> Input to [`prd-delta.md`](prd-delta.md). Gathered 2026-09-26. Each row cites its source; what
> could not be verified is marked so.

## Survey

| Library | What it is | Behaviour engine | Frameworks | Style model | Relevance |
|---|---|---|---|---|---|
| **Ant Design** | Full design system, 73 core components in 7 groups (General, Layout, Navigation, Data Entry, Data Display, Feedback, Other) | Own, per component | React (community ports for Vue and Angular) | CSS-in-JS tokens | Functional reference for the **inventory**, as Monocharts was for the charts |
| **wired-elements** | "Basic UI elements that have a hand-drawn look", for wireframes and mockups | Own (Lit) | Web components | `rough.js` redraws the whole element, data included | The closest precedent. It deforms **everything**, including the geometry a user reads or aims at, and has no exact mode |
| **Zag.js** | Framework-agnostic state machines for accessible components; `connect()` returns props spread through `normalizeProps` | Machines | React, Vue, Solid, Svelte (no official Angular adapter) | Headless | One behaviour engine for several frameworks — the right shape, but it lacks the third framework silverpoint must serve |
| **Angular Aria** (`@angular/aria`, Angular 21) | Headless directives for 13 WAI-ARIA patterns: Autocomplete, Listbox, Select, Multiselect, Combobox, Menu, Menubar, Toolbar, Accordion, Tabs, Tree, Grid | Directives | Angular | Headless | Strong for Angular overlays and lists; one framework only |
| **Reka UI** (formerly Radix Vue) | 40+ unstyled, WAI-ARIA-compliant primitives | Components | Vue | Headless | Vue counterpart of Radix; renders its own elements |
| **React Aria** | Hooks returning props to spread on your own elements | Hooks | React | Headless | Not re-verified on 2026-09-26 (the docs URL redirected); listed from prior knowledge only |

Sources:
[Ant Design components overview](https://ant.design/components/overview/) ·
[wired-elements](https://github.com/rough-stuff/wired-elements) ·
[Zag](https://github.com/chakra-ui/zag) · [zagjs.com](https://zagjs.com/) ·
[Angular Aria overview](https://angular.dev/guide/aria/overview) ·
[Announcing Angular v21](https://blog.angular.dev/announcing-angular-v21-57946c34f14b) ·
[Reka UI](https://reka-ui.com/)

## What silverpoint takes, and what it leaves

| # | Observation | Consequence for silverpoint |
|---|---|---|
| 1 | Most of Ant Design's weight is behaviour, not drawing: focus management, keyboard, ARIA, overlay positioning, virtualisation | **Scope** `0.3.0` to components whose behaviour is native or a small keyboard pattern; overlays, tables and trees wait for a delta that chooses their engine |
| 2 | wired-elements inks the whole control; a slider thumb or a checkbox tick is drawn off its true position | **Keep Art. 1**: interaction and value geometry exact; the hand draws frames, rules and fills only |
| 3 | No headless library covers React, Vue **and** Angular with one engine (Zag lacks Angular; Radix/Reka/Angular Aria are one framework each) | **Take** the Zag shape —pure behaviour, props spread by an adapter— but **implement it in `@silverpoint/core`** for the few patterns in scope (roving focus, value stepping). No new dependency (Art. 8) and one engine for three adapters (Art. 2) |
| 4 | Three different headless libraries would emit three different markups | **Parity** (Art. 3) is only reachable if the library owns the markup; that rules out wrapping per-framework primitives for `0.3.0` |
| 5 | Native `<button>`, `<input type="checkbox|radio|range">` bring keyboard, forms and assistive-technology support for free | **Native first**: the drawing sits over a real control that stays in the accessibility tree |
| 6 | A hand-drawn frame redrawn per element and per resize (the rough.js approach) costs JavaScript, measurement and a server/client mismatch | **Frames as CSS**: pieces generated at build time, laid as a multi-layer CSS mask painted with `--sp-` properties; no runtime inking, no measurement |
| 7 | Hand-drawn kits have no high-contrast story | **Precision** mode and the `prefers-contrast` / `forced-colors` override apply to every component, as to every chart |
