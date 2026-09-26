import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, InjectionToken, input, viewChild, type Signal, type TemplateRef } from '@angular/core';
import { SP_DASHBOARD_CELL, type DashboardCellHandle } from '@silverpoint/angular';
import type { DashboardCellContext } from '@silverpoint/core';

/** What a cell asks of the dashboard around it. */
export interface DashboardParent {
  contextOf(cell: SpDashboardCell): DashboardCellContext | undefined;
}

export const SP_DASHBOARD = new InjectionToken<DashboardParent>('SP_DASHBOARD');

/**
 * `<sp-dashboard-cell>` (REQ-200): marks a child of `sp-dashboard` with its layout cell. Its content
 * waits in a template that the dashboard instantiates inside the cell's `article`, in reading order
 * (REQ-203); on its own, it renders its content in place. It provides its chart the cell context.
 */
@Component({
  selector: 'sp-dashboard-cell',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: SP_DASHBOARD_CELL, useExisting: forwardRef(() => SpDashboardCell) }],
  template: `<ng-template #content><ng-content /></ng-template>@if (!dashboard) {<ng-container [ngTemplateOutlet]="content" />}`,
})
export class SpDashboardCell implements DashboardCellHandle {
  /** The layout cell this child fills. Omitted: next in source order, span 1 (API Spec §7.1). */
  readonly cell = input<string>();
  /** @internal The content the dashboard places in the cell's `article`. */
  readonly content = viewChild.required<TemplateRef<unknown>>('content');

  protected readonly dashboard = inject(SP_DASHBOARD, { optional: true });
  private attached?: Signal<string | undefined>;

  readonly context = computed(() => this.dashboard?.contextOf(this));

  attach(id: Signal<string | undefined>): void {
    this.attached = id;
  }

  /** @internal The chart's own `id`, which the cell's label points at when given. */
  chartId(): string | undefined {
    return this.attached?.();
  }
}
