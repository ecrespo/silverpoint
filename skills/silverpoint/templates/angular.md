# Angular

```sh
npm install @silverpoint/angular @silverpoint/grounds @silverpoint/fonts
```

Add the stylesheets to the `styles` array of `angular.json`, in this order:
`@silverpoint/fonts/fonts.css`, `@silverpoint/grounds/styles.css`, and
`@silverpoint/grounds/ui.css` if you use components.

```ts angular
import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { provideSilverpoint } from '@silverpoint/angular';

@Component({ selector: 'app-root', template: '' })
class App {}

bootstrapApplication(App, { providers: [provideSilverpoint({ ground: 'silverpoint', substrate: 'cream' })] }).catch(console.error);
```

## Components

Every chart and component is a standalone component with signal inputs and `OnPush`, imported from
its own secondary entry point: `@silverpoint/angular/line-chart`, `@silverpoint/angular/ui/modal`.
Selectors are `sp-<name>`. The exceptions are `SpButton` (`<button spButton>`) and `SpSurface`
(`[spSurface]`), which sit on your own element.

- **Bind every input**, strings included: `[title]="'Traffic'"`. `strictTemplates` checks
  bindings, while a static attribute with a misspelt name passes silently.
- Values: `[(value)]`, or a forms directive (`formControlName`, `ngModel`): the value components
  are `ControlValueAccessor`s. Open state: `[(open)]`. Pagination: `[(current)]`.
- Events are outputs: `(activeChange)`, `(select)`, `(rootChange)`, `(openChange)`, `(sort)`.
- Content is projected through templates: `<ng-template spFooter>`, `spExtra`, `spAction`,
  `spFallback`, `spTooltip`. An overlay's trigger is `<button type="button" spTrigger>`, with
  `SpTrigger` imported from the overlay's subpath.
- `provideSilverpoint` returns a `Provider`, so a component's own `providers` can nest one for its
  subtree.
- Server rendering with `@angular/ssr` is supported.

## Example

<!-- generated:angular-example -->
