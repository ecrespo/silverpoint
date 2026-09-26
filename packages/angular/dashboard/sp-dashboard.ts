import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, contentChildren, forwardRef, input, type TemplateRef } from '@angular/core';
import { dashboardView, diagnose, type DashboardLayout, type DashboardLink, type DashboardProps, type GroundRef, type InkMode, type SubstrateName } from '@silverpoint/core';
import { SP_DASHBOARD, SpDashboardCell, type DashboardParent } from './sp-dashboard-cell';

/** `--name:value;…`, the variables as one `style` attribute. */
const styleOf = (vars: Readonly<Record<string, string>>) => Object.entries(vars).map(([name, value]) => `${name}:${value}`).join(';');

/**
 * `<sp-dashboard>` (REQ-200): standalone, signal inputs, OnPush (REQ-101). The layout is resolved
 * by the core's `dashboardView` from the inputs and the `cell` of each `sp-dashboard-cell`, read from
 * `contentChildren` — available during server rendering. The component computes nothing (Art. 2).
 */
@Component({
  selector: 'sp-dashboard',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: SP_DASHBOARD, useExisting: forwardRef(() => SpDashboard) }],
  template: `<section [attr.class]="view().section.className" part="dashboard" [attr.data-substrate]="view().section.substrate" [attr.aria-labelledby]="view().section.labelledby ?? null" [attr.aria-describedby]="view().section.describedby ?? null" [attr.aria-label]="view().section.label ?? null" [attr.style]="sectionStyle()">@if (view().heading; as heading) {@switch (heading.level) {@case (3) {<h3 class="sp-dashboard-title" part="dashboard-title" [id]="heading.id">{{ heading.text }}</h3>}@case (4) {<h4 class="sp-dashboard-title" part="dashboard-title" [id]="heading.id">{{ heading.text }}</h4>}@case (5) {<h5 class="sp-dashboard-title" part="dashboard-title" [id]="heading.id">{{ heading.text }}</h5>}@case (6) {<h6 class="sp-dashboard-title" part="dashboard-title" [id]="heading.id">{{ heading.text }}</h6>}@default {<h2 class="sp-dashboard-title" part="dashboard-title" [id]="heading.id">{{ heading.text }}</h2>}}}@if (view().description; as description) {<p class="sp-dashboard-description" part="dashboard-description" [id]="description.id">{{ description.text }}</p>}<div class="sp-dashboard-grid" part="dashboard-grid">@for (cell of view().cells; track cell.context.chartId) {<article class="sp-dashboard-cell" part="dashboard-cell" [attr.aria-labelledby]="cell.labelledby" [attr.style]="styleOf(cell.style)"><ng-container [ngTemplateOutlet]="contentOf(cell.child)" /></article>}</div></section>`,
})
export class SpDashboard implements DashboardParent {
  /** Stable identifier; seeds of unnamed charts derive from it (REQ-209). */
  readonly id = input.required<string>();
  readonly title = input<string>();
  readonly label = input<string>();
  readonly layout = input<DashboardLayout>();
  readonly description = input<string>();
  readonly headingLevel = input<2 | 3 | 4 | 5 | 6>();
  readonly ssrWidth = input<number>();
  readonly link = input<DashboardLink>();
  readonly ground = input<GroundRef>();
  readonly substrate = input<SubstrateName>();
  readonly mode = input<InkMode>();
  readonly locale = input<string>();
  readonly className = input<string>();

  protected readonly cells = contentChildren(SpDashboardCell);
  protected readonly styleOf = styleOf;

  protected readonly view = computed(() => {
    const props = {
      id: this.id(),
      title: this.title(),
      label: this.label(),
      layout: this.layout(),
      description: this.description(),
      headingLevel: this.headingLevel(),
      ssrWidth: this.ssrWidth(),
      link: this.link(),
      ground: this.ground(),
      substrate: this.substrate(),
      mode: this.mode(),
      locale: this.locale(),
      className: this.className(),
    } as DashboardProps;
    // Signal inputs cannot say "title or label" (REQ-214), which React and Vue enforce by type.
    if (props.title === undefined && props.label === undefined) {
      diagnose('SP002', 'Dashboard', { property: 'title', message: 'A dashboard needs a `title` or a `label` to name its region.' });
    }
    return dashboardView(props, this.cells().map((cell) => ({ cell: cell.cell(), id: cell.chartId() })));
  });

  protected readonly sectionStyle = computed(() => styleOf(this.view().section.style));

  /** The content of the child at `index`, placed in its cell's `article`. */
  protected contentOf(index: number): TemplateRef<unknown> | null {
    return this.cells()[index]?.content() ?? null;
  }

  contextOf(cell: SpDashboardCell) {
    const index = this.cells().indexOf(cell);
    return this.view().cells.find((c) => c.child === index)?.context;
  }
}
