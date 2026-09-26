import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, contentChildren, forwardRef, inject, input, output, signal, viewChild, type OnInit, type Signal, type TemplateRef } from '@angular/core';
import { SP_DASHBOARD_CELL, SP_DASHBOARD_LINK, type DashboardCellHandle, type DashboardLinkHandle } from '@silverpoint/angular';
import { dashboardView, type LinkState, type DashboardLayout, type DashboardLink, type DashboardProps, type GroundRef, type InkMode, type SubstrateName } from '@silverpoint/core';

/** `--name:value;…`, the variables as one `style` attribute. */
const styleOf = (vars: Readonly<Record<string, string>>) => Object.entries(vars).map(([name, value]) => `${name}:${value}`).join(';');

/**
 * `<sp-dashboard-cell>` (REQ-200): marks a child of `sp-dashboard` with its layout cell. Its content
 * waits in a template that the dashboard instantiates inside the cell's `article`, in reading order
 * (REQ-203); on its own, it renders its content in place. It provides its chart the cell context.
 * Both components live in one module so the cell reaches its dashboard with no token (REQ-220).
 */
@Component({
  selector: 'sp-dashboard-cell',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: SP_DASHBOARD_CELL, useExisting: forwardRef(() => SpDashboardCell) }],
  template: `<ng-template #content><ng-content /></ng-template>@if (!dashboard) {<ng-container [ngTemplateOutlet]="content" />}`,
})
export class SpDashboardCell implements DashboardCellHandle, OnInit {
  /** The layout cell this child fills. Omitted: next in source order, span 1 (API Spec §7.1). */
  readonly cell = input<string>();
  /** @internal The content the dashboard places in the cell's `article`. */
  readonly content = viewChild.required<TemplateRef<unknown>>('content');

  protected readonly dashboard: SpDashboard | null = inject(forwardRef(() => SpDashboard), { optional: true });
  private attached?: Signal<string | undefined>;

  readonly context = computed(() => this.dashboard?.contextOf(this));
  /** @internal Its inputs are set. A cell an `@for` generates is queried before they are. */
  readonly ready = signal(false);

  ngOnInit(): void {
    this.ready.set(true);
  }

  attach(id: Signal<string | undefined>): void {
    this.attached = id;
  }

  /** @internal The chart's own `id`, which the cell's label points at when given. */
  chartId(): string | undefined {
    return this.attached?.();
  }
}

/**
 * `<sp-dashboard>` (REQ-200): standalone, signal inputs, OnPush (REQ-101). The layout is resolved
 * by the core's `dashboardView` from the inputs and the `cell` of each `sp-dashboard-cell`, read from
 * `contentChildren` — available during server rendering. The component computes nothing (Art. 2).
 */
@Component({
  selector: 'sp-dashboard',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: SP_DASHBOARD_LINK, useExisting: forwardRef(() => SpDashboard) }],
  template: `@let s = view().section;<section [attr.class]="s.className" part="dashboard" [attr.data-substrate]="s.substrate" [attr.aria-labelledby]="s.labelledby" [attr.aria-describedby]="s.describedby" [attr.aria-label]="s.label" [attr.style]="styleOf(s.style)">@if (view().heading; as h) {@switch (h.level) {@case (3) {<h3 class="sp-dashboard-title" part="dashboard-title" [id]="h.id">{{ h.text }}</h3>}@case (4) {<h4 class="sp-dashboard-title" part="dashboard-title" [id]="h.id">{{ h.text }}</h4>}@case (5) {<h5 class="sp-dashboard-title" part="dashboard-title" [id]="h.id">{{ h.text }}</h5>}@case (6) {<h6 class="sp-dashboard-title" part="dashboard-title" [id]="h.id">{{ h.text }}</h6>}@default {<h2 class="sp-dashboard-title" part="dashboard-title" [id]="h.id">{{ h.text }}</h2>}}}@if (view().description; as d) {<p class="sp-dashboard-description" part="dashboard-description" [id]="d.id">{{ d.text }}</p>}<div class="sp-dashboard-grid" part="dashboard-grid">@for (c of view().cells; track c.context.chartId) {<article class="sp-dashboard-cell" part="dashboard-cell" [attr.aria-labelledby]="c.labelledby" [attr.style]="styleOf(c.style)"><ng-container [ngTemplateOutlet]="contentOf(c.child)" /></article>}</div></section>`,
})
export class SpDashboard implements DashboardLinkHandle {
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

  /** The linked value changed; `null` when the source cleared (API Spec §9, REQ-216). */
  readonly linkChange = output<{ key: string; value: unknown } | null>();

  protected readonly cells = contentChildren(SpDashboardCell);
  /** The linked value its charts share, client-side only (REQ-219). */
  readonly linkState = signal<LinkState | null>(null);

  linkKey(): string | undefined {
    return this.link()?.key;
  }

  setLink(next: LinkState | null): void {
    this.linkState.set(next);
    this.linkChange.emit(next && { key: next.key, value: next.value });
  }
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
    const cells = this.cells();
    // A cell an `@for` generates can be queried before its inputs are set, while an earlier cell's chart
    // already renders. Until every cell is ready, children go in source order with no layout, so that
    // transient state raises no SP015 (REQ-205).
    if (!cells.every((cell) => cell.ready())) return dashboardView({ ...props, layout: undefined }, cells.map((cell) => ({ id: cell.chartId() })));
    // Signal inputs cannot say "title or label" (REQ-214): the core warns SP002 when neither is set.
    return dashboardView(props, cells.map((cell) => ({ cell: cell.cell(), id: cell.chartId() })));
  });

  /** The content of the child at `index`, placed in its cell's `article`. */
  protected contentOf(index: number): TemplateRef<unknown> | null {
    return this.cells()[index]?.content() ?? null;
  }

  /** @internal The context of a cell: its chart id, nominal box and config. */
  contextOf(cell: SpDashboardCell) {
    const index = this.cells().indexOf(cell);
    return this.view().cells.find((c) => c.child === index)?.context;
  }
}
