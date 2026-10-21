# Grounds and palettes

## Grounds

A *ground* is the drawing technique. Every chart and component draws in the ground the application
provider sets, and a `ground` prop overrides it.

<!-- generated:grounds -->

- **silverpoint** (the default): tone is *hatch density*, not colour. A darker category gets
  denser hatching, so a chart reads in grey scale and in print. Highlights are white heightening
  with an ink outline.
- **cyanotype**: tone is *line weight*, and nothing is hatched. Its only substrate, `prussian`, is
  painted whatever `substrate` says, so leave `substrate` out.
- `mode="precision"` turns the hand-inked jitter off: the lines become exact. It is forced
  when the page declares `prefers-contrast: more` or `forced-colors: active`, and no prop can undo
  that.

## Palettes

A palette recolours a ground field by field. The fields you leave unset keep the ground's colours.

<!-- generated:palette-fields -->

The six presets, all checked for contrast on their substrate:

<!-- generated:palette-presets -->

Pass the object, never its name. That way a page that names no preset ships none:

```tsx
import { sanguine } from '@silverpoint/core/palettes';
import { BarChart } from '@silverpoint/react/bar-chart';

export function Revenue() {
  return <BarChart title="Revenue by quarter" palette={sanguine} />;
}
```

A palette of your own is a plain object, so check its contrast before you ship it, with
`check_palette` on the MCP server or `checkPalette` from `@silverpoint/core/palettes`. A colour
that is not a CSS colour is dropped with `SP024`, and a pair under its contrast threshold warns
`SP023`.

## Precedence

`ground`, `substrate`, `mode`, `locale` and `palette` resolve from the chart's prop first, then the
dashboard, then the provider, then the library default. A palette merges field by field at each
level, and a nested provider inherits what it does not set.

```tsx
import { sepia } from '@silverpoint/core/palettes';
import { SilverpointProvider } from '@silverpoint/react';
import { LineChart } from '@silverpoint/react/line-chart';

export function Report() {
  return (
    <SilverpointProvider ground="silverpoint" substrate="ochre" palette={sepia}>
      <LineChart title="Visits" />
      <LineChart title="Visits, exact" mode="precision" />
    </SilverpointProvider>
  );
}
```
